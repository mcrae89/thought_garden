export const EMOTIONS = [
  'happy', 'sad', 'angry', 'anxious', 'calm',
  'grateful', 'love', 'hope', 'excited', 'lonely',
  'proud', 'confused', 'peaceful', 'nostalgic', 'jealous',
  'inspired', 'guilty', 'curious', 'frustrated', 'content',
  'overwhelmed', 'brave', 'embarrassed', 'surprised', 'bored',
  'determined', 'compassionate', 'melancholy', 'joyful', 'vulnerable',
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

export const TIER_LIMITS: Record<Tier, { gardenPlots: number; greenhouseCapacity: number; dailyEntryLimit: number }> = {
  free: { gardenPlots: 9, greenhouseCapacity: 3, dailyEntryLimit: 1 },
  paid: { gardenPlots: 25, greenhouseCapacity: 10, dailyEntryLimit: Infinity },
};
