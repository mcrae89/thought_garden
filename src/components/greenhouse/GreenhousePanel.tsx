import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useAuthStore } from '@/stores/auth-store';
import { useGardenStore } from '@/stores/garden-store';
import { plantVisualService } from '@/modules/plant-visuals';
import { DeleteConfirmDialog } from '@/components/journal/DeleteConfirmDialog';
import { colors, spacing, radii } from '@/theme/tokens';
import { TIER_LIMITS } from '@/shared/types';
import type { Plant } from '@/modules/garden';

interface GreenhousePanelProps {
  onClose: () => void;
}

export function GreenhousePanel({ onClose }: GreenhousePanelProps) {
  const session = useAuthStore((s) => s.session);
  const tier = useAuthStore((s) => s.tier);
  const plants = useGardenStore((s) => s.plants);
  const moveFromGreenhouse = useGardenStore((s) => s.moveFromGreenhouse);
  const revertToSeed = useGardenStore((s) => s.revertToSeed);

  const [revertTarget, setRevertTarget] = useState<Plant | null>(null);

  const userId = session?.userId ?? '';
  const storedPlants = plants.filter((p) => p.location === 'greenhouse');
  const capacity = TIER_LIMITS[tier].greenhouseCapacity;
  const isFull = storedPlants.length >= capacity;

  async function handleMoveToGarden(plant: Plant) {
    // Find first empty plot
    const gardenPlants = plants.filter((p) => p.location === 'garden');
    const gardenSize = Math.sqrt(TIER_LIMITS[tier].gardenPlots);
    const totalPlots = gardenSize * gardenSize;
    const occupiedPlots = new Set(gardenPlants.map((p) => p.plotPosition));
    const firstEmpty = Array.from({ length: totalPlots }, (_, i) => i).find((i) => !occupiedPlots.has(i));
    if (firstEmpty === undefined) return;
    try {
      await moveFromGreenhouse(plant.id, firstEmpty, userId);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not move plant');
    }
  }

  async function handleRevert() {
    if (!revertTarget) return;
    try {
      await revertToSeed(revertTarget.id, userId);
      setRevertTarget(null);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not revert plant');
    }
  }

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <Text style={styles.title}>Greenhouse</Text>
        <Text style={styles.capacity}>{storedPlants.length}/{capacity}</Text>
        <TouchableOpacity onPress={onClose} accessibilityLabel="Close greenhouse">
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {isFull && (
        <Text style={styles.fullMessage}>
          Greenhouse is full. Revert a plant to seed to make space.
        </Text>
      )}

      <ScrollView contentContainerStyle={styles.grid}>
        {storedPlants.map((plant) => {
          const sprite = plantVisualService.getPlantSprite(plant.emotion, plant.growthStage, plant.colorVariation ?? null, 'greenhouse');
          return (
            <View key={plant.id} style={styles.plantCard}>
              <Image
                source={{ uri: sprite.uri }}
                style={styles.plantSprite}
                contentFit="none"
                accessibilityLabel={`${plant.emotion} plant, ${plant.growthStage}`}
              />
              <Text style={styles.plantEmotion}>{plant.emotion}</Text>
              <Text style={styles.plantStage}>{plant.growthStage}</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleMoveToGarden(plant)}
                accessibilityLabel={`Move ${plant.emotion} plant to garden`}
              >
                <Text style={styles.actionText}>→ Garden</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.revertButton}
                onPress={() => setRevertTarget(plant)}
                accessibilityLabel={`Revert ${plant.emotion} plant to seed`}
              >
                <Text style={styles.revertText}>Revert</Text>
              </TouchableOpacity>
            </View>
          );
        })}
        {storedPlants.length === 0 && <Text style={styles.emptyText}>Greenhouse is empty</Text>}
      </ScrollView>

      <DeleteConfirmDialog
        visible={revertTarget !== null}
        onConfirm={handleRevert}
        onCancel={() => setRevertTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    maxHeight: '85%',
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  capacity: {
    color: colors.textSecondary,
  },
  closeText: {
    fontSize: 20,
    color: colors.textSecondary,
    padding: spacing.xs,
  },
  fullMessage: {
    color: colors.error,
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: radii.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  plantCard: {
    width: 96,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  plantSprite: {
    width: 64,
    height: 64,
  },
  plantEmotion: {
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  plantStage: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '600',
  },
  revertButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  revertText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg,
    width: '100%',
  },
});
