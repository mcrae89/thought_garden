import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { plantVisualService } from '@/modules/plant-visuals';
import type { Plant } from '@/modules/garden';

const TILE_SIZE = 32;

export function PlantSprite({ plant }: { plant: Plant }) {
  const spriteData = plantVisualService.getPlantSprite(plant.emotion, plant.growthStage, plant.colorVariation ?? null, 'garden');
  if (plant.growthStage === 'seed') {
    return (
      <Image
        source={require('../../../assets/sprites/plants/seed.png')}
        style={styles.plantSprite}
        contentFit="contain"
        accessibilityLabel={`${plant.emotion} seed`}
      />
    );
  }
  return (
    <Image
      source={{ uri: spriteData.uri }}
      style={styles.plantSprite}
      contentFit="none"
      accessibilityLabel={`${plant.emotion} plant, ${plant.growthStage} stage`}
    />
  );
}

const styles = StyleSheet.create({
  plantSprite: { width: TILE_SIZE, height: TILE_SIZE },
});
