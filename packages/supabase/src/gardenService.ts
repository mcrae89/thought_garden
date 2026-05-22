import { supabase } from './client';
import type { GardenConfig, Plant, Seed } from '@tg/core';

export async function loadGardenState(userId: string): Promise<{
  config: GardenConfig;
  plants: Plant[];
  seeds: Seed[];
}> {
  const [configRes, plantsRes, seedsRes] = await Promise.all([
    supabase.from('garden_configs').select('*').eq('user_id', userId).single(),
    supabase.from('plants').select('*').eq('user_id', userId),
    supabase.from('seeds').select('*').eq('user_id', userId).eq('location', 'inventory'),
  ]);

  const row = configRes.data;
  const config: GardenConfig = {
    id: row?.id ?? '',
    userId,
    gardenGridSize: row?.garden_grid_size ?? '4x4',
    greenhouseCapacity: row?.greenhouse_capacity ?? 10,
    tier: (row?.tier as 'free' | 'paid') ?? 'free',
  };

  const plants: Plant[] = (plantsRes.data ?? []).map((p) => ({
    id: p.id,
    userId: p.user_id,
    seedId: p.seed_id,
    species: p.species,
    colorPrimary: p.color_primary,
    colorSecondary: p.color_secondary,
    growthStage: p.growth_stage as 1 | 2 | 3 | 4,
    wateringCount: p.watering_count,
    isRare: p.is_rare,
    isRadiant: p.is_radiant,
    location: p.location as 'garden' | 'greenhouse',
    gardenPositionX: p.garden_position_x,
    gardenPositionY: p.garden_position_y,
    plantedAt: p.planted_at,
    lastWateredAt: p.last_watered_at,
    bloomedAt: p.bloomed_at,
  }));

  const seeds: Seed[] = (seedsRes.data ?? []).map((s) => ({
    id: s.id,
    userId: s.user_id,
    entryId: s.entry_id,
    plantSpecies: s.plant_species,
    colorPrimary: s.color_primary,
    colorSecondary: s.color_secondary,
    isRare: s.is_rare,
    location: s.location as 'inventory' | 'greenhouse' | 'garden',
    createdAt: s.created_at,
  }));

  return { config, plants, seeds };
}
