import type { Emotion, GrowthStage, Tier } from '@/shared/types';

export interface Plant {
  readonly id: string;
  readonly userId: string;
  readonly seedId: string;
  readonly emotion: Emotion;
  readonly colorVariation: Emotion | null;
  readonly growthStage: GrowthStage;
  readonly location: 'garden' | 'greenhouse';
  readonly plotPosition: number | null;
  readonly plantedAt: Date;
  readonly lastWateredAt: Date | null;
  readonly lastGrowthDate: string | null;
}

export interface PlantGrowthUpdate {
  readonly plantId: string;
  readonly previousStage: GrowthStage;
  readonly newStage: GrowthStage;
}

export interface WateringResult {
  readonly plantsWatered: number;
  readonly plantsAdvanced: PlantGrowthUpdate[];
}

export interface GardenService {
  getGarden(userId: string): Plant[];
  plantSeed(seedId: string, plotIndex: number, userId: string, tier: Tier): Plant;
  movePlant(plantId: string, toPlotIndex: number, userId: string): void;
  moveToGreenhouse(plantId: string, userId: string, tier: Tier): void;
  moveFromGreenhouse(plantId: string, plotIndex: number, userId: string): void;
  revertToSeed(plantId: string, userId: string): void;
  waterGarden(userId: string, entryDate: string): WateringResult;
}

export { gardenService } from './garden-service';
