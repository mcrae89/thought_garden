import type { GrowthStage, Plant } from '../types';

const WATERING_THRESHOLDS: Record<GrowthStage, number> = {
  1: 0,
  2: 3,
  3: 7,
  4: Infinity, // radiant only via rare unlock, not watering count alone
};

/** Returns the growth stage a plant should be at given its watering count. */
export function computeGrowthStage(plant: Pick<Plant, 'wateringCount' | 'isRare'>): GrowthStage {
  const { wateringCount, isRare } = plant;
  if (wateringCount >= WATERING_THRESHOLDS[3] && isRare) return 4;
  if (wateringCount >= WATERING_THRESHOLDS[3]) return 3;
  if (wateringCount >= WATERING_THRESHOLDS[2]) return 2;
  return 1;
}

/** Returns updated plant after a watering. Only waters garden plants. */
export function waterPlant(plant: Plant, now: string): Plant {
  if (plant.location !== 'garden') return plant;
  const wateringCount = plant.wateringCount + 1;
  const growthStage = computeGrowthStage({ wateringCount, isRare: plant.isRare });
  const bloomedAt =
    growthStage >= 3 && plant.bloomedAt === null ? now : plant.bloomedAt;
  return { ...plant, wateringCount, growthStage, lastWateredAt: now, bloomedAt };
}
