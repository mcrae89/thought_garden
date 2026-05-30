import type { Emotion } from '@/shared/types';
import type { Entry } from '@/modules/entries';

export interface AchievementContext {
  readonly totalEntryCount: number;
  readonly emotionUsageCounts: Map<Emotion, number>;
  readonly currentStreak: number;
  readonly lastEntryDate: string | null;
  readonly consecutiveSameEmotionCount: number;
  readonly lastConsecutiveEmotion: Emotion | null;
  readonly hasFirstEntry: boolean;
  readonly hasFirstMorningEntry: boolean;
  readonly hasFirstEveningEntry: boolean;
  readonly hasFirstWeekendEntry: boolean;
  readonly hasFirstLongEntry: boolean;
  readonly hasFirstSecondaryEmotion: boolean;
  readonly hasFirstBloom: boolean;
  readonly hasFilledGarden: boolean;
  readonly hasAllEmotionPlants: boolean;
  readonly uniqueEmotionsUsed: Set<Emotion>;
  readonly lifetimeEmotionCounts: Map<Emotion, number>;
}

export interface AchievementResult {
  readonly achievementKey: string;
  readonly achievementType: string;
  readonly seedEmotion: Emotion;
}

export interface GardenEvent {
  readonly type: 'first-bloom' | 'full-garden' | 'all-emotions';
  readonly seedEmotion: Emotion;
  readonly userId: string;
}

export interface AchievementEngine {
  evaluateEntry(entry: Entry, context: AchievementContext): Promise<AchievementResult[]>;
  evaluateGardenEvent(event: GardenEvent): Promise<AchievementResult | null>;
  getEarnedAchievements(userId: string): Promise<{ key: string; type: string; earnedAt: Date }[]>;
  resetStreakIfNeeded(userId: string): Promise<void>;
}

export { achievementEngine } from './achievement-engine';
export { buildAchievementContext, resolveTie, calendarDayDiff } from './achievement-engine';
export {
  firstEntry,
  milestoneEntry,
  firstEmotionUse,
  allEmotionsUsed,
  firstLongEntry,
  firstSecondaryEmotion,
  morningEntry,
  eveningEntry,
  weekendEntry,
  streakEvaluator,
  returningEvaluator,
  consistentThemeEvaluator,
  emotionMilestoneEvaluator,
} from './achievement-engine';
export type { Evaluator } from './achievement-engine';
