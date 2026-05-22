import type { Mood } from './constants/moods';
import type { Theme } from './constants/plants';

export type AnalysisStatus = 'pending' | 'complete';

export interface EntryAnalysis {
  moodPrimary: Mood;
  moodSecondary: Mood | null;
  themes: Theme[];
  sentimentIntensity: number; // 0–1
}

export interface Entry {
  id: string;
  userId: string;
  body: string;
  createdAt: string; // ISO
  moodPrimary: Mood | null;
  moodSecondary: Mood | null;
  themes: Theme[];
  analysisStatus: AnalysisStatus;
  rawAnalysis: EntryAnalysis | null;
}

export type GrowthStage = 1 | 2 | 3 | 4;
export type PlantLocation = 'garden' | 'greenhouse';
export type SeedLocation = 'inventory' | 'greenhouse' | 'garden';

export interface Seed {
  id: string;
  userId: string;
  entryId: string | null;
  plantSpecies: string;
  colorPrimary: string;
  colorSecondary: string;
  isRare: boolean;
  location: SeedLocation;
  createdAt: string;
}

export interface Plant {
  id: string;
  userId: string;
  seedId: string;
  species: string;
  colorPrimary: string;
  colorSecondary: string;
  growthStage: GrowthStage;
  wateringCount: number;
  isRare: boolean;
  isRadiant: boolean;
  location: PlantLocation;
  gardenPositionX: number | null;
  gardenPositionY: number | null;
  plantedAt: string;
  lastWateredAt: string | null;
  bloomedAt: string | null;
}

export interface GardenConfig {
  id: string;
  userId: string;
  gardenGridSize: string; // e.g. "4x4"
  greenhouseCapacity: number;
  tier: 'free' | 'paid';
}
