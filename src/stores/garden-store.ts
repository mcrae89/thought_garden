import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { gardenService } from '@/modules/garden';
import type { Plant } from '@/modules/garden';
import type { Tier } from '@/shared/types';

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
        return gardenService.plantSeed(seedId, plotIndex, userId, tier);
      },
      movePlant: async (plantId, toPlotIndex, userId) => {
        await gardenService.movePlant(plantId, toPlotIndex, userId);
      },
      moveToGreenhouse: async (plantId, userId, tier) => {
        await gardenService.moveToGreenhouse(plantId, userId, tier);
      },
      moveFromGreenhouse: async (plantId, plotIndex, userId) => {
        await gardenService.moveFromGreenhouse(plantId, plotIndex, userId);
      },
      revertToSeed: async (plantId, userId) => {
        await gardenService.revertToSeed(plantId, userId);
      },
      waterGarden: async (userId, entryDate) => {
        await gardenService.waterGarden(userId, entryDate);
      },
    }),
    { name: 'garden-store', enabled: __DEV__ },
  ),
);
