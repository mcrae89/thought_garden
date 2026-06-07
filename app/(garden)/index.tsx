import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, useWindowDimensions, TouchableOpacity, Modal, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import { useAuthStore } from '@/stores/auth-store';
import { useGardenStore } from '@/stores/garden-store';
import { useSeedStore } from '@/stores/seed-store';
import { useNotificationStore } from '@/stores/notification-store';
import { JournalPanel } from '@/components/journal/JournalPanel';
import { GreenhousePanel } from '@/components/greenhouse/GreenhousePanel';
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
const MAILBOX_TILE = { col: 6.7, row: 8.5 };
const DOOR_TILE = { col: 6, row: 8 };

const DOOR_FRAMES = [
  require('../../assets/tiles/sliced/door_anim/5.png'),
  require('../../assets/tiles/sliced/door_anim/4.png'),
  require('../../assets/tiles/sliced/door_anim/3.png'),
  require('../../assets/tiles/sliced/door_anim/2.png'),
  require('../../assets/tiles/sliced/door_anim/1.png'),
  require('../../assets/tiles/sliced/door_anim/0.png'),
];

const INTERIOR_SOIL_GID = 90;

function getSoilPlots(map: TiledMap, tileSize: number) {
  // soil_paid is the active layer in the paid map; soil_free in the free map.
  // Only GID 90 (interior dirt) is a plantable plot — border tiles are excluded.
  const soilLayer = map.layers.find(
    (l) => l.type === 'tilelayer' && (l.name === 'soil_paid' || l.name === 'soil_free') && l.visible,
  );
  if (!soilLayer) return [];
  const plots: Array<{ plotIndex: number; left: number; top: number }> = [];
  let plotIndex = 0;
  for (let i = 0; i < soilLayer.data.length; i++) {
    if (soilLayer.data[i] === INTERIOR_SOIL_GID) {
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

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [chestFrame, setChestFrame] = useState(0);
  const [doorFrame, setDoorFrame] = useState(0);
  const chestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChestPress = useCallback(() => {
    if (chestTimerRef.current) return;
    let frame = 0;
    const animate = () => {
      frame++;
      if (frame >= 4) {
        setChestFrame(4);
        chestTimerRef.current = null;
        setActiveModal('seeds');
      } else {
        setChestFrame(frame);
        chestTimerRef.current = setTimeout(animate, 100);
      }
    };
    chestTimerRef.current = setTimeout(animate, 100);
  }, []);

  useEffect(() => {
    return () => { if (chestTimerRef.current) clearTimeout(chestTimerRef.current); if (doorTimerRef.current) clearTimeout(doorTimerRef.current); };
  }, []);

  const handleDoorPress = useCallback(() => {
    if (doorTimerRef.current) return;
    let frame = 0;
    const animate = () => {
      frame++;
      if (frame >= 5) {
        setDoorFrame(5);
        doorTimerRef.current = null;
        setActiveModal('greenhouse');
      } else {
        setDoorFrame(frame);
        doorTimerRef.current = setTimeout(animate, 100);
      }
    };
    doorTimerRef.current = setTimeout(animate, 100);
  }, []);

  const closeGreenhouse = useCallback(() => { setActiveModal(null); setDoorFrame(0); }, []);

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
    setActiveModal('notifications');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        <View style={{ zIndex: 0 }}>
          <TilemapRenderer mapData={mapData} tileSize={tileSize} />
        </View>

        <View style={{ position: 'absolute', left: DOOR_TILE.col * tileSize, top: DOOR_TILE.row * tileSize + Math.floor(tileSize * 0.4), width: tileSize, height: Math.floor(tileSize * 0.6), zIndex: 20, overflow: 'hidden' }}>
          <TouchableOpacity
            style={{ width: tileSize, height: tileSize, marginTop: -Math.floor(tileSize * 0.4) }}
            onPress={handleDoorPress}
            accessibilityLabel="Open greenhouse door"
          >
            <Image
              source={DOOR_FRAMES[doorFrame]}
              style={{ width: tileSize, height: tileSize }}
              contentFit="fill"
            />
          </TouchableOpacity>
        </View>

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

        <View
          style={{ position: 'absolute', left: MAILBOX_TILE.col * tileSize - tileSize, top: MAILBOX_TILE.row * tileSize - tileSize, width: tileSize * 3, height: tileSize * 3, zIndex: 10 }}
        >
          <TouchableOpacity
            style={{ width: tileSize * 3, height: tileSize * 3 }}
            onPress={handleMailboxPress}
            accessibilityLabel={hasUnread ? 'Mailbox with new notifications' : 'Mailbox'}
          >
            <Image
              source={hasUnread
                ? require('../../assets/tiles/sprout-lands/structures/mailbox-with-envelope.png')
                : require('../../assets/tiles/sprout-lands/structures/mailbox-idle.png')
              }
              style={{ width: tileSize * 3, height: tileSize * 3 }}
              contentFit="contain"
              accessibilityLabel="Mailbox"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.hud}>
        <TouchableOpacity style={styles.hudButton} onPress={() => setActiveModal('journal')} accessibilityLabel="Open journal">
          <Text style={styles.hudButtonText}>📖</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hudButton} onPress={() => setActiveModal('settings')} accessibilityLabel="Open settings">
          <Text style={styles.hudButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={activeModal === 'seeds'} animationType="slide" transparent onRequestClose={() => { setActiveModal(null); setChestFrame(0); }}>
        <SeedInventoryModal seeds={seeds} plotIndex={selectedPlot} userId={userId} tier={tier} onClose={() => { setActiveModal(null); setChestFrame(0); }} />
      </Modal>
      <Modal visible={activeModal === 'greenhouse'} animationType="slide" transparent onRequestClose={closeGreenhouse}>
        <GreenhousePanel onClose={closeGreenhouse} />
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapWrapper: { position: 'relative' },
  hud: { position: 'absolute', bottom: spacing.lg, right: spacing.lg, gap: spacing.sm },
  hudButton: { width: 48, height: 48, backgroundColor: colors.surface, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  hudButtonText: { fontSize: 24 },
});

