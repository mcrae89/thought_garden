import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { gardenService } from '@/modules/garden';
import { achievementEngine } from '@/modules/achievements';
import { useNotificationStore } from '@/stores/notification-store';
import { useSeedStore } from '@/stores/seed-store';
import { db } from '@/database';
import { EMOTIONS } from '@/shared/types';
import type { Plant } from '@/modules/garden';
import type { SeedData } from '@/stores/seed-store';
import type { Tier } from '@/shared/types';
import { getMaxPlots } from '@/modules/garden/garden-service';

function refreshSeeds(userId: string) {
  const rows = db.getAllSync<SeedData>('SELECT * FROM seeds WHERE user_id = ? AND is_planted = 0', [userId]);
  useSeedStore.getState().setSeeds(rows);
}

interface GardenState {
  plants: Plant[];
  isLoading: boolean;
  setPlants: (plants: Plant[]) => void;
  plantSeed: (seedId: string, plotIndex: number, userId: string, tier: Tier) => Promise<Plant>;
  movePlant: (plantId: string, toPlotIndex: number, userId: string) => Promise<void>;
  moveToGreenhouse: (plantId: string, userId: string, tier: Tier) => Promise<void>;
  moveFromGreenhouse: (plantId: string, plotIndex: number, userId: string) => Promise<void>;
  revertToSeed: (plantId: string, userId: string) => Promise<void>;
  waterGarden: (userId: string, entryDate: string) => Promise<void>;
}

export const useGardenStore = create<GardenState>()(
  devtools(
    (set) => ({
      plants: [],
      isLoading: false,
      setPlants: (plants) => set({ plants, isLoading: false }),
      plantSeed: async (seedId, plotIndex, userId, tier) => {
        const plant = await gardenService.plantSeed(seedId, plotIndex, userId, tier);
        set((state) => ({ plants: [...state.plants, plant] }));
        refreshSeeds(userId);
        const { addNotification } = useNotificationStore.getState();
        const allPlants = gardenService.getGarden(userId);
        if (allPlants.length >= getMaxPlots(tier)) {
          const r = achievementEngine.evaluateGardenEvent({ type: 'full-garden', seedEmotion: plant.emotion, userId });
          if (r) addNotification(r);
        }
        const emotions = new Set(allPlants.map((p) => p.emotion));
        if (emotions.size >= EMOTIONS.length) {
          const r = achievementEngine.evaluateGardenEvent({ type: 'all-emotions', seedEmotion: plant.emotion, userId });
          if (r) addNotification(r);
        }
        return plant;
      },
      movePlant: async (plantId, toPlotIndex, userId) => {
        await gardenService.movePlant(plantId, toPlotIndex, userId);
        set((state) => ({
          plants: state.plants.map((p) => p.id === plantId ? { ...p, plotPosition: toPlotIndex } : p),
        }));
      },
      moveToGreenhouse: async (plantId, userId, tier) => {
        await gardenService.moveToGreenhouse(plantId, userId, tier);
        set((state) => ({
          plants: state.plants.map((p) => p.id === plantId ? { ...p, location: 'greenhouse' as const, plotPosition: null } : p),
        }));
      },
      moveFromGreenhouse: async (plantId, plotIndex, userId) => {
        await gardenService.moveFromGreenhouse(plantId, plotIndex, userId);
        set((state) => ({
          plants: state.plants.map((p) => p.id === plantId ? { ...p, location: 'garden' as const, plotPosition: plotIndex } : p),
        }));
      },
      revertToSeed: async (plantId, userId) => {
        await gardenService.revertToSeed(plantId, userId);
        set((state) => ({ plants: state.plants.filter((p) => p.id !== plantId) }));
        refreshSeeds(userId);
      },
      waterGarden: async (userId, entryDate) => {
        gardenService.waterGarden(userId, entryDate);
        set({ plants: gardenService.getGarden(userId) });
      },
    }),
    { name: 'garden-store', enabled: __DEV__ },
  ),
);
