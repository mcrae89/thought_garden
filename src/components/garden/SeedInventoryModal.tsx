import { View, Text, TouchableOpacity, StyleSheet, Alert, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useGardenStore } from '@/stores/garden-store';
import { modalStyles } from './styles';
import { colors, spacing } from '@/theme/tokens';
import type { SeedData } from '@/stores/seed-store';
import type { Tier } from '@/shared/types';

const SEED_BAG_IMAGES: Record<string, ReturnType<typeof require>> = {
  happy: require('../../../assets/sprites/seeds/happy-sunflower-seeds.png'),
  sad: require('../../../assets/sprites/seeds/sad-bleeding-heart-seeds.png'),
  angry: require('../../../assets/sprites/seeds/angry-cactus-seeds.png'),
  anxious: require('../../../assets/sprites/seeds/anxious-passionflower-seeds.png'),
  calm: require('../../../assets/sprites/seeds/calm-lavender-seeds.png'),
  grateful: require('../../../assets/sprites/seeds/grateful-hydrangea-seeds.png'),
  love: require('../../../assets/sprites/seeds/love-rose-seeds.png'),
  hope: require('../../../assets/sprites/seeds/hope-daffodil-seeds.png'),
  excited: require('../../../assets/sprites/seeds/excited-bird-of-paradise-seeds.png'),
  lonely: require('../../../assets/sprites/seeds/lonely-forget-me-not-seeds.png'),
  proud: require('../../../assets/sprites/seeds/proud-orchid-seeds.png'),
  confused: require('../../../assets/sprites/seeds/confused-wisteria-seeds.png'),
  peaceful: require('../../../assets/sprites/seeds/peaceful-lotus-seeds.png'),
  nostalgic: require('../../../assets/sprites/seeds/nostalgic-cherry-blossom-seeds.png'),
  jealous: require('../../../assets/sprites/seeds/jealous-nightshade-seeds.png'),
  inspired: require('../../../assets/sprites/seeds/inspired-iris-seeds.png'),
  guilty: require('../../../assets/sprites/seeds/guilty-thistle-seeds.png'),
  curious: require('../../../assets/sprites/seeds/curious-snapdragon-seeds.png'),
  frustrated: require('../../../assets/sprites/seeds/frustrated-bramble-seeds.png'),
  content: require('../../../assets/sprites/seeds/content-chamomile-seeds.png'),
  overwhelmed: require('../../../assets/sprites/seeds/overwhelmed-morning-glory-seeds.png'),
  brave: require('../../../assets/sprites/seeds/brave-protea-seeds.png'),
  embarrassed: require('../../../assets/sprites/seeds/embarrassed-mimosa-seeds.png'),
  surprised: require('../../../assets/sprites/seeds/surprised-stargazer-lily-seeds.png'),
  bored: require('../../../assets/sprites/seeds/bored-dandelion-seeds.png'),
  determined: require('../../../assets/sprites/seeds/determined-gladiolus-seeds.png'),
  compassionate: require('../../../assets/sprites/seeds/compassionate-aloe-vera-seeds.png'),
  melancholy: require('../../../assets/sprites/seeds/melancholy-bluebell-seeds.png'),
  joyful: require('../../../assets/sprites/seeds/joyful-daisy-seeds.png'),
  vulnerable: require('../../../assets/sprites/seeds/vulnerable-snowdrop-seeds.png'),
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
          {seeds.map((seed) => (
            <TouchableOpacity
              key={seed.id}
              style={[styles.seedItem, plotIndex === null && styles.seedItemDisabled]}
              onPress={() => handlePlant(seed)}
              disabled={plotIndex === null}
              accessibilityLabel={`Plant ${seed.emotion} seed`}
              accessibilityState={{ disabled: plotIndex === null }}
            >
              <Image
                source={SEED_BAG_IMAGES[seed.emotion] ?? require('../../../assets/sprites/plants/seed.png')}
                style={styles.seedSprite}
                contentFit="contain"
                accessibilityLabel={`${seed.emotion} seed bag`}
              />
              <Text style={styles.seedLabel}>{seed.emotion}</Text>
            </TouchableOpacity>
          ))}
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
  seedSprite: { width: 48, height: 48 },
  seedLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
});
