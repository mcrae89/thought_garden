import { View, Text, TouchableOpacity, StyleSheet, Alert, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useGardenStore } from '@/stores/garden-store';
import { modalStyles } from './styles';
import { colors, spacing } from '@/theme/tokens';
import { EMOTION_TO_PLANT } from '@/shared/constants';
import type { SeedData } from '@/stores/seed-store';
import type { Tier, Emotion } from '@/shared/types';

// Farming Plants items.png: 32x240, 16px per row
// Row 0 = empty seed bag, Row 1+ = harvested crop items (same order as crops)
const FARMING_ITEMS_SHEET = require('../../../assets/sprites/objects/items/farming-Plants-items.png');
const ITEMS_SHEET_WIDTH = 32;
const ITEMS_SHEET_HEIGHT = 240;
const ITEM_FRAME = 16;

// Row in the items sheet (row 0 is empty bag, crops start at row 1)
const ITEM_ROW: Record<string, number> = {
  corn: 1,
  carrot: 2,
  cauliflower: 3,
  tomato: 4,
  eggplant: 5,
  blue_kale: 6,
  leafy_greens: 7,
  wheat: 8,
  pumpkin: 9,
  parsnip: 10,
  purple_cabbage: 11,
  radish: 12,
  star_fruit: 13,
  cucumber: 14,
};

interface Props {
  seeds: SeedData[];
  plotIndex: number | null;
  userId: string;
  tier: Tier;
  onClose: () => void;
}

export function SeedInventoryModal({ seeds, plotIndex, userId, tier, onClose }: Props) {
  const plantSeed = useGardenStore((s) => s.plantSeed);

  async function handlePlant(seed: SeedData) {
    if (plotIndex === null) return;
    try {
      await plantSeed(seed.id, plotIndex, userId, tier);
      onClose();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not plant seed');
    }
  }

  return (
    <Pressable style={modalStyles.backdrop} onPress={onClose}>
      <Pressable style={modalStyles.modalSheet}>
        <Text style={modalStyles.modalTitle}>Seed Inventory</Text>
        <View style={styles.seedGrid}>
          {plotIndex === null && (
            <Text style={modalStyles.emptyText}>Tap an empty plot in the garden first, then select a seed.</Text>
          )}
          {seeds.map((seed) => {
            const plantInfo = EMOTION_TO_PLANT[seed.emotion as Emotion];
            // For trees/berries, show the empty seed bag (row 0). For crops, show the item.
            const row = plantInfo ? (ITEM_ROW[plantInfo.spriteKey] ?? 0) : 0;
            return (
              <TouchableOpacity
                key={seed.id}
                style={[styles.seedItem, plotIndex === null && styles.seedItemDisabled]}
                onPress={() => handlePlant(seed)}
                disabled={plotIndex === null}
                accessibilityLabel={`Plant ${seed.emotion} seed`}
                accessibilityState={{ disabled: plotIndex === null }}
              >
                <View style={styles.seedSpriteContainer}>
                  <Image
                    source={FARMING_ITEMS_SHEET}
                    style={{
                      width: ITEMS_SHEET_WIDTH,
                      height: ITEMS_SHEET_HEIGHT,
                      marginTop: -row * ITEM_FRAME,
                    }}
                    contentFit="cover"
                    accessibilityLabel={`${seed.emotion} seed`}
                  />
                </View>
                <Text style={styles.seedLabel}>{seed.emotion}</Text>
              </TouchableOpacity>
            );
          })}
          {seeds.length === 0 && <Text style={modalStyles.emptyText}>No seeds available</Text>}
        </View>
        <TouchableOpacity style={modalStyles.closeButton} onPress={onClose} accessibilityLabel="Close">
          <Text style={modalStyles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  seedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  seedItem: { alignItems: 'center', gap: spacing.xs, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  seedItemDisabled: { opacity: 0.4 },
  seedSpriteContainer: { width: ITEM_FRAME, height: ITEM_FRAME, overflow: 'hidden' },
  seedLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
});
