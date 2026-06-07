import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useGardenStore } from '@/stores/garden-store';
import { modalStyles } from './styles';
import type { Plant } from '@/modules/garden';
import type { Tier } from '@/shared/types';

interface Props {
  plant: Plant | null;
  userId: string;
  tier: Tier;
  onClose: () => void;
}

export function PlantDetailSheet({ plant, userId, tier, onClose }: Props) {
  const moveToGreenhouse = useGardenStore((s) => s.moveToGreenhouse);

  if (!plant) return null;

  async function handleMoveToGreenhouse() {
    try {
      await moveToGreenhouse(plant!.id, userId, tier);
      onClose();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not move plant');
    }
  }

  return (
    <View style={modalStyles.modalSheet}>
      <Text style={modalStyles.modalTitle}>{plant.emotion}</Text>
      <Text style={modalStyles.detailText}>Stage: {plant.growthStage}</Text>
      <TouchableOpacity
        style={modalStyles.actionButton}
        onPress={handleMoveToGreenhouse}
        accessibilityLabel="Move to greenhouse"
      >
        <Text style={modalStyles.actionButtonText}>Move to Greenhouse</Text>
      </TouchableOpacity>
      <TouchableOpacity style={modalStyles.closeButton} onPress={onClose} accessibilityLabel="Close">
        <Text style={modalStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}
