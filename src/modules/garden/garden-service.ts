import { Q } from '@nozbe/watermelondb';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';
import { database } from '@/database';
import { Plant as PlantModel } from '@/database/models/plant.model';
import { Seed } from '@/database/models/seed.model';
import type { AppError } from '@/shared/result';
import { TIER_LIMITS, NEXT_STAGE } from '@/shared/types';
import type { GrowthStage, Tier, Emotion } from '@/shared/types';
import type { GardenService, Plant, PlantGrowthUpdate, WateringResult } from './index';

// --- Pure helpers ---

export function getMaxPlots(tier: Tier): number {
  return TIER_LIMITS[tier].gardenPlots;
}

export function getMaxGreenhouse(tier: Tier): number {
  return TIER_LIMITS[tier].greenhouseCapacity;
}

export function canAdvanceGrowth(currentStage: GrowthStage, lastGrowthDate: string | null, today: string): boolean {
  return currentStage !== 'bloom' && (lastGrowthDate === null || lastGrowthDate !== today);
}

// --- Internal helpers ---

function toPlant(model: PlantModel): Plant {
  return {
    id: model.id,
    userId: model.userId,
    seedId: model.seedId,
    emotion: model.emotion as Emotion,
    colorVariation: model.colorVariation as Emotion | null,
    growthStage: model.growthStage as GrowthStage,
    location: model.location as 'garden' | 'greenhouse',
    plotPosition: model.plotPosition,
    plantedAt: model.plantedAt,
    lastWateredAt: model.lastWateredAt,
    lastGrowthDate: model.lastGrowthDate,
  };
}

function throwAppError(error: AppError): never {
  throw error;
}

async function fetchGardenPlants(userId: string): Promise<PlantModel[]> {
  return database.get<PlantModel>('plants')
    .query(Q.where('user_id', userId), Q.where('location', 'garden'))
    .fetch();
}

async function fetchGreenhousePlants(userId: string): Promise<PlantModel[]> {
  return database.get<PlantModel>('plants')
    .query(Q.where('user_id', userId), Q.where('location', 'greenhouse'))
    .fetch();
}

// --- Service implementation ---

function createGardenService(): GardenService {
  return {
    getGarden(userId: string): Observable<Plant[]> {
      return database.get<PlantModel>('plants')
        .query(Q.where('user_id', userId), Q.where('location', 'garden'))
        .observe()
        .pipe(map((plants) => plants.map(toPlant)));
    },

    async plantSeed(seedId: string, plotIndex: number, userId: string, tier: Tier): Promise<Plant> {
      const seed = await database.get<Seed>('seeds').find(seedId);
      if (seed.userId !== userId || seed.isPlanted) {
        throwAppError({ type: 'validation', field: 'id', message: 'Not found' });
      }

      const gardenPlants = await fetchGardenPlants(userId);
      const maxPlots = getMaxPlots(tier);

      if (gardenPlants.some((p) => p.plotPosition === plotIndex)) {
        throwAppError({ type: 'capacity', resource: 'garden', current: gardenPlants.length, max: maxPlots });
      }

      let created!: PlantModel;
      await database.write(async () => {
        await database.batch(
          database.get<PlantModel>('plants').prepareCreate((p) => {
            p.userId = userId;
            p.seedId = seedId;
            p.emotion = seed.emotion;
            p.colorVariation = seed.colorVariation;
            p.growthStage = 'seed';
            p.location = 'garden';
            p.plotPosition = plotIndex;
            created = p;
          }),
          seed.prepareUpdate((s) => {
            s.isPlanted = true;
          }),
        );
      });

      return toPlant(created);
    },

    async movePlant(plantId: string, toPlotIndex: number, userId: string): Promise<void> {
      const plant = await database.get<PlantModel>('plants').find(plantId);
      if (plant.userId !== userId || plant.location !== 'garden') {
        throwAppError({ type: 'validation', field: 'id', message: 'Not found' });
      }

      const gardenPlants = await fetchGardenPlants(userId);
      if (gardenPlants.some((p) => p.id !== plantId && p.plotPosition === toPlotIndex)) {
        throwAppError({ type: 'capacity', resource: 'garden', current: gardenPlants.length, max: gardenPlants.length });
      }

      await database.write(async () => {
        await plant.update((p) => {
          p.plotPosition = toPlotIndex;
        });
      });
    },

    async moveToGreenhouse(plantId: string, userId: string, tier: Tier): Promise<void> {
      const plant = await database.get<PlantModel>('plants').find(plantId);
      if (plant.userId !== userId || plant.location !== 'garden') {
        throwAppError({ type: 'validation', field: 'id', message: 'Not found' });
      }

      const greenhousePlants = await fetchGreenhousePlants(userId);
      const max = getMaxGreenhouse(tier);

      if (greenhousePlants.length >= max) {
        throwAppError({ type: 'capacity', resource: 'greenhouse', current: greenhousePlants.length, max });
      }

      await database.write(async () => {
        await plant.update((p) => {
          p.location = 'greenhouse';
          p.plotPosition = null;
        });
      });
    },

    async moveFromGreenhouse(plantId: string, plotIndex: number, userId: string): Promise<void> {
      const plant = await database.get<PlantModel>('plants').find(plantId);
      if (plant.userId !== userId || plant.location !== 'greenhouse') {
        throwAppError({ type: 'validation', field: 'id', message: 'Not found' });
      }

      const gardenPlants = await fetchGardenPlants(userId);
      if (gardenPlants.some((p) => p.plotPosition === plotIndex)) {
        throwAppError({ type: 'capacity', resource: 'garden', current: gardenPlants.length, max: gardenPlants.length });
      }

      await database.write(async () => {
        await plant.update((p) => {
          p.location = 'garden';
          p.plotPosition = plotIndex;
        });
      });
    },

    async revertToSeed(plantId: string, userId: string): Promise<void> {
      const plant = await database.get<PlantModel>('plants').find(plantId);
      if (plant.userId !== userId) {
        throwAppError({ type: 'validation', field: 'id', message: 'Not found' });
      }

      await database.write(async () => {
        await database.batch(
          database.get<Seed>('seeds').prepareCreate((s) => {
            s.userId = userId;
            s.emotion = plant.emotion;
            s.colorVariation = plant.colorVariation;
            s.sourceAchievementId = plant.seedId;
            s.isPlanted = false;
          }),
          plant.prepareDestroyPermanently(),
        );
      });
    },

    async waterGarden(userId: string, entryDate: string): Promise<WateringResult> {
      const gardenPlants = await fetchGardenPlants(userId);
      const advances: { plant: PlantModel; previousStage: GrowthStage; newStage: GrowthStage }[] = [];

      for (const plant of gardenPlants) {
        const stage = plant.growthStage as GrowthStage;
        if (canAdvanceGrowth(stage, plant.lastGrowthDate, entryDate)) {
          const newStage = NEXT_STAGE[stage];
          if (newStage) {
            advances.push({ plant, previousStage: stage, newStage });
          }
        }
      }

      if (advances.length > 0) {
        await database.write(async () => {
          await database.batch(
            ...advances.map(({ plant, newStage }) =>
              plant.prepareUpdate((p) => {
                p.growthStage = newStage;
                p.lastGrowthDate = entryDate;
                p.lastWateredAt = new Date();
              }),
            ),
          );
        });
      }

      const plantsAdvanced: PlantGrowthUpdate[] = advances.map(({ plant, previousStage, newStage }) => ({
        plantId: plant.id,
        previousStage,
        newStage,
      }));

      return { plantsWatered: gardenPlants.length, plantsAdvanced };
    },
  };
}

export const gardenService: GardenService = createGardenService();
