import { db } from '@/database';
import { generateId, now, toDate } from '@/database/helpers';
import type { AppError } from '@/shared/result';
import { TIER_LIMITS, NEXT_STAGE, WATER_THRESHOLD } from '@/shared/types';
import type { GrowthStage, Tier, Emotion } from '@/shared/types';
import type { GardenService, Plant, PlantGrowthUpdate, WateringResult } from './index';

interface PlantRow {
  id: string;
  user_id: string;
  seed_id: string;
  emotion: string;
  color_variation: string | null;
  growth_stage: string;
  location: string;
  plot_position: number | null;
  planted_at: number;
  last_watered_at: number | null;
  last_growth_date: string | null;
  water_count: number;
}

interface SeedRow {
  id: string;
  user_id: string;
  emotion: string;
  color_variation: string | null;
  is_planted: number;
}

// --- Pure helpers ---

export function getMaxGreenhouse(tier: Tier): number {
  return TIER_LIMITS[tier].greenhouseCapacity;
}

export function canAdvanceGrowth(currentStage: GrowthStage, lastGrowthDate: string | null, today: string): boolean {
  return currentStage !== 'bloom' && (lastGrowthDate === null || lastGrowthDate !== today);
}

function toPlant(row: PlantRow): Plant {
  return {
    id: row.id,
    userId: row.user_id,
    seedId: row.seed_id,
    emotion: row.emotion as Emotion,
    colorVariation: row.color_variation as Emotion | null,
    growthStage: row.growth_stage as GrowthStage,
    location: row.location as 'garden' | 'greenhouse',
    plotPosition: row.plot_position,
    plantedAt: toDate(row.planted_at)!,
    lastWateredAt: toDate(row.last_watered_at),
    lastGrowthDate: row.last_growth_date,
  };
}

function throwAppError(error: AppError): never {
  throw error;
}

function fetchGardenPlants(userId: string): PlantRow[] {
  return db.getAllSync<PlantRow>('SELECT * FROM plants WHERE user_id = ? AND location = ?', [userId, 'garden']);
}

function fetchGreenhousePlants(userId: string): PlantRow[] {
  return db.getAllSync<PlantRow>('SELECT * FROM plants WHERE user_id = ? AND location = ?', [userId, 'greenhouse']);
}

// --- Service implementation ---

function createGardenService(): GardenService {
  return {
    getGarden(userId: string): Plant[] {
      const rows = db.getAllSync<PlantRow>('SELECT * FROM plants WHERE user_id = ?', [userId]);
      return rows.map(toPlant);
    },

    plantSeed(seedId: string, plotIndex: number, userId: string, tier: Tier): Plant {
      const seed = db.getFirstSync<SeedRow>('SELECT * FROM seeds WHERE id = ?', [seedId]);
      if (!seed || seed.user_id !== userId || seed.is_planted === 1) {
        throwAppError({ type: 'validation', field: 'id', message: 'Not found' });
      }

      const gardenPlants = fetchGardenPlants(userId);

      if (gardenPlants.some((p) => p.plot_position === plotIndex)) {
        throwAppError({ type: 'validation', field: 'plotIndex', message: 'Plot already occupied' });
      }

      const plantId = generateId();
      const plantedAt = now();

      db.withTransactionSync(() => {
        db.runSync(
          'INSERT INTO plants (id, user_id, seed_id, emotion, color_variation, growth_stage, location, plot_position, planted_at, last_modified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [plantId, userId, seedId, seed.emotion, seed.color_variation, 'seed', 'garden', plotIndex, plantedAt, plantedAt],
        );
        db.runSync('UPDATE seeds SET is_planted = 1, last_modified_at = ? WHERE id = ?', [plantedAt, seedId]);
      });

      return {
        id: plantId,
        userId,
        seedId,
        emotion: seed.emotion as Emotion,
        colorVariation: seed.color_variation as Emotion | null,
        growthStage: 'seed',
        location: 'garden',
        plotPosition: plotIndex,
        plantedAt: toDate(plantedAt)!,
        lastWateredAt: null,
        lastGrowthDate: null,
      };
    },

    movePlant(plantId: string, toPlotIndex: number, userId: string): void {
      const plant = db.getFirstSync<PlantRow>('SELECT * FROM plants WHERE id = ?', [plantId]);
      if (!plant || plant.user_id !== userId || plant.location !== 'garden') {
        throwAppError({ type: 'validation', field: 'id', message: 'Not found' });
      }

      const gardenPlants = fetchGardenPlants(userId);
      if (gardenPlants.some((p) => p.id !== plantId && p.plot_position === toPlotIndex)) {
        throwAppError({ type: 'capacity', resource: 'garden', current: gardenPlants.length, max: gardenPlants.length });
      }

      db.runSync('UPDATE plants SET plot_position = ?, last_modified_at = ? WHERE id = ?', [toPlotIndex, now(), plantId]);
    },

    moveToGreenhouse(plantId: string, userId: string, tier: Tier): void {
      const plant = db.getFirstSync<PlantRow>('SELECT * FROM plants WHERE id = ?', [plantId]);
      if (!plant || plant.user_id !== userId || plant.location !== 'garden') {
        throwAppError({ type: 'validation', field: 'id', message: 'Not found' });
      }

      const greenhousePlants = fetchGreenhousePlants(userId);
      const max = getMaxGreenhouse(tier);

      if (greenhousePlants.length >= max) {
        throwAppError({ type: 'capacity', resource: 'greenhouse', current: greenhousePlants.length, max });
      }

      db.runSync('UPDATE plants SET location = ?, plot_position = NULL, last_modified_at = ? WHERE id = ?', ['greenhouse', now(), plantId]);
    },

    moveFromGreenhouse(plantId: string, plotIndex: number, userId: string): void {
      const plant = db.getFirstSync<PlantRow>('SELECT * FROM plants WHERE id = ?', [plantId]);
      if (!plant || plant.user_id !== userId || plant.location !== 'greenhouse') {
        throwAppError({ type: 'validation', field: 'id', message: 'Not found' });
      }

      const gardenPlants = fetchGardenPlants(userId);
      if (gardenPlants.some((p) => p.plot_position === plotIndex)) {
        throwAppError({ type: 'capacity', resource: 'garden', current: gardenPlants.length, max: gardenPlants.length });
      }

      db.runSync('UPDATE plants SET location = ?, plot_position = ?, last_modified_at = ? WHERE id = ?', ['garden', plotIndex, now(), plantId]);
    },

    revertToSeed(plantId: string, userId: string): void {
      const plant = db.getFirstSync<PlantRow>('SELECT * FROM plants WHERE id = ?', [plantId]);
      if (!plant || plant.user_id !== userId) {
        throwAppError({ type: 'validation', field: 'id', message: 'Not found' });
      }

      const originalSeed = db.getFirstSync<SeedRow & { source_achievement_id: string }>(
        'SELECT * FROM seeds WHERE id = ?', [plant.seed_id],
      );

      db.withTransactionSync(() => {
        const revertedAt = now();
        db.runSync(
          'INSERT INTO seeds (id, user_id, source_entry_id, source_achievement_id, emotion, color_variation, earned_at, is_planted, last_modified_at) VALUES (?, ?, NULL, ?, ?, ?, ?, 0, ?)',
          [generateId(), userId, originalSeed?.source_achievement_id ?? null, plant.emotion, plant.color_variation, revertedAt, revertedAt],
        );
        db.runSync('DELETE FROM plants WHERE id = ?', [plantId]);
      });
    },

    waterGarden(userId: string, entryDate: string): WateringResult {
      const gardenPlants = fetchGardenPlants(userId);
      const advances: { plantId: string; previousStage: GrowthStage; newStage: GrowthStage }[] = [];

      const wateredAt = now();
      db.withTransactionSync(() => {
        for (const plant of gardenPlants) {
          const stage = plant.growth_stage as GrowthStage;
          if (stage === 'bloom') continue;
          if (plant.last_growth_date === entryDate) continue; // already watered today

          const newCount = plant.water_count + 1;
          const threshold = WATER_THRESHOLD[stage];

          if (newCount >= threshold) {
            const newStage = NEXT_STAGE[stage]!;
            advances.push({ plantId: plant.id, previousStage: stage, newStage });
            db.runSync(
              'UPDATE plants SET water_count = 0, growth_stage = ?, last_growth_date = ?, last_watered_at = ?, last_modified_at = ? WHERE id = ?',
              [newStage, entryDate, wateredAt, wateredAt, plant.id],
            );
          } else {
            db.runSync(
              'UPDATE plants SET water_count = ?, last_growth_date = ?, last_watered_at = ?, last_modified_at = ? WHERE id = ?',
              [newCount, entryDate, wateredAt, wateredAt, plant.id],
            );
          }
        }
      });

      const plantsAdvanced: PlantGrowthUpdate[] = advances.map(({ plantId, previousStage, newStage }) => ({
        plantId,
        previousStage,
        newStage,
      }));

      return { plantsWatered: gardenPlants.length, plantsAdvanced };
    },
  };
}

export const gardenService: GardenService = createGardenService();
