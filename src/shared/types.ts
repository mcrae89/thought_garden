export const EMOTIONS = [
  'happy', 'sad', 'angry', 'anxious', 'calm',
  'grateful', 'love', 'hope', 'excited', 'lonely',
  'proud', 'confused', 'peaceful', 'inspired', 'curious',
  'frustrated', 'content', 'overwhelmed', 'brave', 'determined',
  'compassionate',
] as const;

export type Emotion = typeof EMOTIONS[number];

export type GrowthStage = 'seed' | 'sprout' | 'full' | 'bloom';

export type Tier = 'free' | 'paid';

export const GROWTH_STAGE_ORDER: Record<GrowthStage, number> = {
  seed: 0,
  sprout: 1,
  full: 2,
  bloom: 3,
};

export const NEXT_STAGE: Record<GrowthStage, GrowthStage | null> = {
  seed: 'sprout',
  sprout: 'full',
  full: 'bloom',
  bloom: null,
};

export const WATER_THRESHOLD: Record<GrowthStage, number> = {
  seed: 3,
  sprout: 5,
  full: 7,
  bloom: Infinity,
};

export const TIER_LIMITS: Record<Tier, { greenhouseCapacity: number; dailyEntryLimit: number }> = {
  free: { greenhouseCapacity: 3, dailyEntryLimit: 1 },
  paid: { greenhouseCapacity: 10, dailyEntryLimit: Infinity },
};
