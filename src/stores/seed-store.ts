import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface SeedData {
  id: string;
  user_id: string;
  source_entry_id: string | null;
  source_achievement_id: string;
  emotion: string;
  color_variation: string | null;
  earned_at: number;
  is_planted: number;
}

interface SeedState {
  seeds: SeedData[];
  isLoading: boolean;
  setSeeds: (seeds: SeedData[]) => void;
}

export const useSeedStore = create<SeedState>()(
  devtools(
    (set) => ({
      seeds: [],
      isLoading: true,
      setSeeds: (seeds) => set({ seeds, isLoading: false }),
    }),
    { name: 'seed-store', enabled: __DEV__ },
  ),
);
