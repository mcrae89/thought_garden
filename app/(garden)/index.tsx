import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, ScrollView, useWindowDimensions, TouchableOpacity, Modal, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import { useAuthStore } from '@/stores/auth-store';
import { useGardenStore } from '@/stores/garden-store';
import { useSeedStore } from '@/stores/seed-store';
import { useNotificationStore } from '@/stores/notification-store';
import { JournalPanel } from '@/components/journal/JournalPanel';
import { GreenhousePanel } from '@/components/greenhouse/GreenhousePanel';
import { AchievementToast } from '@/components/notifications/AchievementToast';
import { PlantSprite } from '@/components/garden/PlantSprite';
import { SeedInventoryModal } from '@/components/garden/SeedInventoryModal';
import { PlantDetailSheet } from '@/components/garden/PlantDetailSheet';
import { SettingsPanel } from '@/components/garden/SettingsPanel';
import { NotificationsPanel } from '@/components/garden/NotificationsPanel';
import { TilemapRenderer } from '@/components/garden/TilemapRenderer';
import { useGardenSubscription } from '@/hooks/use-garden-subscription';
import { useEntrySubscription } from '@/hooks/use-entry-subscription';
import { useSeedSubscription } from '@/hooks/use-seed-subscription';
import { colors, spacing } from '@/theme/tokens';
import type { Plant } from '@/modules/garden';
import type { TiledMap } from '@/types/tiled';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const FREE_MAP: TiledMap = require('../../assets/tiles/garden-map-free.json');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PAID_MAP: TiledMap = require('../../assets/tiles/garden-map-paid.json');

const CHEST_TILE = { col: 4, row: 9 };
const MAILBOX_TILE = { col: 15, row: 9 };

function getSoilPlots(map: TiledMap, tileSize: number) {
  const soilLayer = map.layers.find((l) => l.name === 'soil' && l.type === 'tilelayer');
  if (!soilLayer) return [];
  const plots: Array<{ plotIndex: number; left: number; top: number }> = [];
  let plotIndex = 0;
  for (let i = 0; i < soilLayer.data.length; i++) {
    if (soilLayer.data[i] !== 0) {
      const col = i % soilLayer.width;
      const row = Math.floor(i / soilLayer.width);
      plots.push({ plotIndex: plotIndex++, left: col * tileSize, top: row * tileSize });
    }
  }
  return plots;
}

type ActiveModal = 'seeds' | 'greenhouse' | 'journal' | 'notifications' | 'settings' | 'plantDetail' | null;

export default function GardenWorldScreen() {
  const session = useAuthStore((s) => s.session);
  const tier = useAuthStore((s) => s.tier);
  const plants = useGardenStore((s) => s.plants);
  const seeds = useSeedStore((s) => s.seeds);
  const hasUnread = useNotificationStore((s) => s.hasUnread);
  const clearAll = useNotificationStore((s) => s.clearAll);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [chestFrame, setChestFrame] = useState(0);
  const chestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChestPress = useCallback(() => {
    if (chestTimerRef.current) return; // animation already running
    let frame = 0;
    const animate = () => {
      frame++;
      if (frame >= 4) {
        setChestFrame(4);
        chestTimerRef.current = null;
        setTimeout(() => {
          setActiveModal('seeds');
          setChestFrame(0);
        }, 200);
      } else {
        setChestFrame(frame);
        chestTimerRef.current = setTimeout(animate, 100);
      }
    };
    chestTimerRef.current = setTimeout(animate, 100);
  }, []);

  useEffect(() => {
    return () => { if (chestTimerRef.current) clearTimeout(chestTimerRef.current); };
  }, []);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const userId = session?.userId ?? '';
  const mapData = tier === 'free' ? FREE_MAP : PAID_MAP;
  const tileSize = Math.floor(Math.min(screenWidth / mapData.width, screenHeight / mapData.height));
  const soilPlots = useMemo(() => getSoilPlots(mapData, tileSize), [mapData, tileSize]);

  useGardenSubscription(userId);
  useEntrySubscription();
  useSeedSubscription();

  const gardenPlants = plants.filter((p) => p.location === 'garden');

  const handlePlotPress = useCallback((plotIndex: number) => {
    const plant = gardenPlants.find((p) => p.plotPosition === plotIndex) ?? null;
    if (plant) {
      setSelectedPlot(plotIndex);
      setSelectedPlant(plant);
      setActiveModal('plantDetail');
    } else {
      setSelectedPlot(plotIndex);
      setSelectedPlant(null);
      setActiveModal('seeds');
    }
  }, [gardenPlants]);

  const handleMailboxPress = useCallback(() => {
    clearAll();
    setActiveModal('notifications');
  }, [clearAll]);

  return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'relative' }}>
      <View style={{ position: 'relative' }}>
        <TilemapRenderer mapData={mapData} tileSize={tileSize} />

        {soilPlots.map(({ plotIndex, left, top }) => {
          const plant = gardenPlants.find((p) => p.plotPosition === plotIndex);
          return (
            <TouchableOpacity
              key={plotIndex}
              style={{ position: 'absolute', left, top, width: tileSize, height: tileSize, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => handlePlotPress(plotIndex)}
              accessibilityLabel={plant ? `Plant plot ${plotIndex}, occupied` : `Empty plot ${plotIndex}`}
            >
              {plant ? <PlantSprite plant={plant} /> : null}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={{ position: 'absolute', left: CHEST_TILE.col * tileSize, top: CHEST_TILE.row * tileSize, width: tileSize * 3, height: tileSize * 3, zIndex: 10, overflow: 'hidden' }}
          onPress={handleChestPress}
          accessibilityLabel="Open seed chest"
        >
          <Image
            source={require("../../assets/tiles/sprout-lands/structures/Chest.png")}
            style={{ width: tileSize * 3 * 5, height: tileSize * 3 * 2, marginLeft: -chestFrame * tileSize * 3 }}
            contentFit="fill"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={{ position: 'absolute', left: MAILBOX_TILE.col * tileSize, top: MAILBOX_TILE.row * tileSize, width: tileSize, height: tileSize, zIndex: 10 }}
          onPress={handleMailboxPress}
          accessibilityLabel={hasUnread ? 'Mailbox with new notifications' : 'Mailbox'}
        >
          <Image
            source={require('../../assets/tiles/sprout-lands/structures/Mailbox Animation Frames.png')}
            style={{ width: tileSize, height: tileSize }}
            contentFit="none"
            accessibilityLabel="Mailbox"
          />
        </TouchableOpacity>
      </View>

        </View>
      <View style={styles.hud}>
        <TouchableOpacity style={styles.hudButton} onPress={() => setActiveModal('greenhouse')} accessibilityLabel="Open greenhouse">
          <Text style={styles.hudButtonText}>🌿</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hudButton} onPress={() => setActiveModal('journal')} accessibilityLabel="Open journal">
          <Text style={styles.hudButtonText}>📖</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hudButton} onPress={() => setActiveModal('settings')} accessibilityLabel="Open settings">
          <Text style={styles.hudButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <AchievementToast />

      <Modal visible={activeModal === 'seeds'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <SeedInventoryModal seeds={seeds} plotIndex={selectedPlot} userId={userId} tier={tier} onClose={() => setActiveModal(null)} />
      </Modal>
      <Modal visible={activeModal === 'greenhouse'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <GreenhousePanel onClose={() => setActiveModal(null)} />
      </Modal>
      <Modal visible={activeModal === 'journal'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <JournalPanel onClose={() => setActiveModal(null)} />
      </Modal>
      <Modal visible={activeModal === 'settings'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <SettingsPanel onClose={() => setActiveModal(null)} />
      </Modal>
      <Modal visible={activeModal === 'notifications'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <NotificationsPanel onClose={() => setActiveModal(null)} />
      </Modal>
      <Modal visible={activeModal === 'plantDetail'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <PlantDetailSheet plant={selectedPlant} userId={userId} tier={tier} onClose={() => setActiveModal(null)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hud: { position: 'absolute', bottom: spacing.lg, right: spacing.lg, gap: spacing.sm },
  hudButton: { width: 48, height: 48, backgroundColor: colors.surface, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  hudButtonText: { fontSize: 24 },
});

