import { create } from 'zustand';
import type { Plant, Seed, GardenConfig } from '../types';

interface GardenState {
  config: GardenConfig | null;
  plants: Plant[];
  seeds: Seed[]; // inventory only
  setConfig: (config: GardenConfig) => void;
  setPlants: (plants: Plant[]) => void;
  setSeeds: (seeds: Seed[]) => void;
  plantSeed: (seedId: string, x: number, y: number) => void;
  movePlant: (plantId: string, x: number, y: number) => void;
  moveToGreenhouse: (plantId: string) => void;
  moveToGarden: (plantId: string, x: number, y: number) => void;
}

export const useGardenStore = create<GardenState>((set) => ({
  config: null,
  plants: [],
  seeds: [],

  setConfig: (config) => set({ config }),
  setPlants: (plants) => set({ plants }),
  setSeeds: (seeds) => set({ seeds }),

  plantSeed: (seedId, x, y) =>
    set((s) => {
      const seed = s.seeds.find((sd) => sd.id === seedId);
      if (!seed) return s;
      const newPlant: Plant = {
        id: `plant-${Date.now()}`,
        userId: seed.userId,
        seedId: seed.id,
        species: seed.plantSpecies,
        colorPrimary: seed.colorPrimary,
        colorSecondary: seed.colorSecondary,
        growthStage: 1,
        wateringCount: 0,
        isRare: seed.isRare,
        isRadiant: false,
        location: 'garden',
        gardenPositionX: x,
        gardenPositionY: y,
        plantedAt: new Date().toISOString(),
        lastWateredAt: null,
        bloomedAt: null,
      };
      return {
        plants: [...s.plants, newPlant],
        seeds: s.seeds.filter((sd) => sd.id !== seedId),
      };
    }),

  movePlant: (plantId, x, y) =>
    set((s) => ({
      plants: s.plants.map((p) =>
        p.id === plantId ? { ...p, gardenPositionX: x, gardenPositionY: y } : p
      ),
    })),

  moveToGreenhouse: (plantId) =>
    set((s) => ({
      plants: s.plants.map((p) =>
        p.id === plantId
          ? { ...p, location: 'greenhouse', gardenPositionX: null, gardenPositionY: null }
          : p
      ),
    })),

  moveToGarden: (plantId, x, y) =>
    set((s) => ({
      plants: s.plants.map((p) =>
        p.id === plantId ? { ...p, location: 'garden', gardenPositionX: x, gardenPositionY: y } : p
      ),
    })),
}));
