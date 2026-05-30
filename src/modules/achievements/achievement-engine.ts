import { Q } from '@nozbe/watermelondb';
import { database } from '@/database';
import { AchievementRecord } from '@/database/models/achievement-record.model';
import { Seed } from '@/database/models/seed.model';
import { UserStats } from '@/database/models/user-stats.model';
import { EntryEmotion as EntryEmotionModel } from '@/database/models/entry-emotion.model';
import type { Emotion } from '@/shared/types';
import type { Entry } from '@/modules/entries';
import type { AchievementContext, AchievementEngine, AchievementResult, GardenEvent } from './index';

export type Evaluator = (entry: Entry, context: AchievementContext, earned: Set<string>) => AchievementResult | null;

export function resolveTie(emotionCounts: Map<Emotion, number>, emotionLastUsed: Map<Emotion, Date>): Emotion {
  let best: Emotion | null = null;
  let bestCount = -1;
  let bestDate = new Date(0);

  for (const [emotion, count] of emotionCounts) {
    const lastUsed = emotionLastUsed.get(emotion) ?? new Date(0);
    if (count > bestCount || (count === bestCount && lastUsed > bestDate)) {
      best = emotion;
      bestCount = count;
      bestDate = lastUsed;
    }
  }

  return best!;
}

export function calendarDayDiff(from: string, to: Date): number {
  const fromDate = new Date(from);
  const fromMidnight = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((toMidnight.getTime() - fromMidnight.getTime()) / 86_400_000);
}

// --- One-time entry evaluators ---

export const firstEntry: Evaluator = (entry, context, earned) => {
  if (earned.has('first_entry')) return null;
  if (context.totalEntryCount !== 1 || context.hasFirstEntry) return null;
  return { achievementKey: 'first_entry', achievementType: 'milestone', seedEmotion: entry.primaryEmotion };
};

export const milestoneEntry: Evaluator = (entry, context, earned) => {
  const milestones = [10, 50, 100] as const;
  for (const m of milestones) {
    const key = `milestone_${m}`;
    if (context.totalEntryCount === m && !earned.has(key)) {
      return { achievementKey: key, achievementType: 'milestone', seedEmotion: entry.primaryEmotion };
    }
  }
  return null;
};

export const firstEmotionUse: Evaluator = (entry, context, earned) => {
  const key = `first_emotion_${entry.primaryEmotion}`;
  if (earned.has(key)) return null;
  if (context.emotionUsageCounts.get(entry.primaryEmotion) !== 1) return null;
  return { achievementKey: key, achievementType: 'emotion_discovery', seedEmotion: entry.primaryEmotion };
};

export const allEmotionsUsed: Evaluator = (entry, context, earned) => {
  if (earned.has('all_emotions_used')) return null;
  if (context.uniqueEmotionsUsed.size !== 30) return null;
  return { achievementKey: 'all_emotions_used', achievementType: 'collection', seedEmotion: entry.primaryEmotion };
};

export const firstLongEntry: Evaluator = (entry, context, earned) => {
  if (earned.has('first_long_entry')) return null;
  if (entry.wordCount < 200 || context.hasFirstLongEntry) return null;
  return { achievementKey: 'first_long_entry', achievementType: 'milestone', seedEmotion: entry.primaryEmotion };
};

export const firstSecondaryEmotion: Evaluator = (entry, context, earned) => {
  if (earned.has('first_secondary_emotion')) return null;
  if (entry.secondaryEmotions.length === 0 || context.hasFirstSecondaryEmotion) return null;
  return { achievementKey: 'first_secondary_emotion', achievementType: 'milestone', seedEmotion: entry.primaryEmotion };
};

// --- Time-based evaluators (Task 5.3) ---

export const morningEntry: Evaluator = (entry, context, earned) => {
  if (earned.has('time:morning')) return null;
  const hour = entry.createdAt.getHours();
  if (hour < 5 || hour > 11 || context.hasFirstMorningEntry) return null;
  return { achievementKey: 'time:morning', achievementType: 'time', seedEmotion: entry.primaryEmotion };
};

export const eveningEntry: Evaluator = (entry, context, earned) => {
  if (earned.has('time:evening')) return null;
  const hour = entry.createdAt.getHours();
  if (hour < 18 || hour > 23 || context.hasFirstEveningEntry) return null;
  return { achievementKey: 'time:evening', achievementType: 'time', seedEmotion: entry.primaryEmotion };
};

export const weekendEntry: Evaluator = (entry, context, earned) => {
  if (earned.has('time:weekend')) return null;
  const day = entry.createdAt.getDay();
  if ((day !== 0 && day !== 6) || context.hasFirstWeekendEntry) return null;
  return { achievementKey: 'time:weekend', achievementType: 'time', seedEmotion: entry.primaryEmotion };
};

// --- Repeatable evaluators (Task 5.4) ---

export const streakEvaluator: Evaluator = (entry, context, earned) => {
  const thresholds = [3, 7, 14, 30] as const;
  for (const t of thresholds) {
    const key = `streak:${t}`;
    if (context.currentStreak >= t && !earned.has(key)) {
      return { achievementKey: key, achievementType: 'streak', seedEmotion: entry.primaryEmotion };
    }
  }
  return null;
};

export const returningEvaluator: Evaluator = (entry, context) => {
  if (context.lastEntryDate === null) return null;
  if (calendarDayDiff(context.lastEntryDate, entry.createdAt) < 7) return null;
  return { achievementKey: 'returning', achievementType: 'returning', seedEmotion: entry.primaryEmotion };
};

export const consistentThemeEvaluator: Evaluator = (entry, context) => {
  if (context.consecutiveSameEmotionCount !== 5) return null;
  return { achievementKey: 'consistent-theme', achievementType: 'consistent-theme', seedEmotion: context.lastConsecutiveEmotion! };
};

export const emotionMilestoneEvaluator: Evaluator = (entry, context, earned) => {
  const thresholds = [10, 25, 50] as const;
  for (const t of thresholds) {
    const key = `emotion-milestone:${entry.primaryEmotion}:${t}`;
    if ((context.lifetimeEmotionCounts.get(entry.primaryEmotion) ?? 0) >= t && !earned.has(key)) {
      return { achievementKey: key, achievementType: 'emotion-milestone', seedEmotion: entry.primaryEmotion };
    }
  }
  return null;
};

const evaluators: Evaluator[] = [
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
];

// --- Context builder ---

export async function buildAchievementContext(userId: string, _currentEntry: Entry): Promise<AchievementContext> {
  const achievementRecords = await database.get<AchievementRecord>('achievement_records')
    .query(Q.where('user_id', userId))
    .fetch();

  const earnedKeys = new Set(achievementRecords.map(r => r.achievementKey));

  const statsRecords = await database.get<UserStats>('user_stats')
    .query(Q.where('user_id', userId))
    .fetch();
  const stats = statsRecords[0];

  const totalEntryCount = stats?.totalEntries ?? 0;
  const currentStreak = stats?.currentStreak ?? 0;
  const lastEntryDate = stats?.lastEntryDate ?? null;
  const consecutiveSameEmotionCount = stats?.consecutiveSameEmotion ?? 0;
  const lastConsecutiveEmotion = (stats?.lastEmotion as Emotion) ?? null;

  const allEntryEmotions = await database.get<EntryEmotionModel>('entry_emotions')
    .query(Q.where('type', 'primary'))
    .fetch();

  const emotionUsageCounts = new Map<Emotion, number>();
  const lifetimeEmotionCounts = new Map<Emotion, number>();
  for (const em of allEntryEmotions) {
    const emotion = em.emotion as Emotion;
    emotionUsageCounts.set(emotion, (emotionUsageCounts.get(emotion) ?? 0) + 1);
    lifetimeEmotionCounts.set(emotion, (lifetimeEmotionCounts.get(emotion) ?? 0) + 1);
  }

  const uniqueEmotionsUsed = new Set<Emotion>(emotionUsageCounts.keys());

  return {
    totalEntryCount,
    emotionUsageCounts,
    currentStreak,
    lastEntryDate,
    consecutiveSameEmotionCount,
    lastConsecutiveEmotion,
    hasFirstEntry: earnedKeys.has('first_entry'),
    hasFirstMorningEntry: earnedKeys.has('time:morning'),
    hasFirstEveningEntry: earnedKeys.has('time:evening'),
    hasFirstWeekendEntry: earnedKeys.has('time:weekend'),
    hasFirstLongEntry: earnedKeys.has('first_long_entry'),
    hasFirstSecondaryEmotion: earnedKeys.has('first_secondary_emotion'),
    hasFirstBloom: earnedKeys.has('garden:first-bloom'),
    hasFilledGarden: earnedKeys.has('garden:full-garden'),
    hasAllEmotionPlants: earnedKeys.has('garden:all-emotions'),
    uniqueEmotionsUsed,
    lifetimeEmotionCounts,
  };
}

// --- Garden event key mapping ---

const GARDEN_EVENT_KEYS: Record<GardenEvent['type'], string> = {
  'first-bloom': 'garden:first-bloom',
  'full-garden': 'garden:full-garden',
  'all-emotions': 'garden:all-emotions',
};

// --- Engine implementation ---

class AchievementEngineImpl implements AchievementEngine {
  async evaluateEntry(entry: Entry, context: AchievementContext): Promise<AchievementResult[]> {
    const records = await database.get<AchievementRecord>('achievement_records')
      .query(Q.where('user_id', entry.userId), Q.where('is_active', true))
      .fetch();
    const earned = new Set(records.map(r => r.achievementKey));

    const results: AchievementResult[] = [];
    for (const evaluator of evaluators) {
      const result = evaluator(entry, context, earned);
      if (result) results.push(result);
    }

    if (results.length > 0) {
      await database.write(async () => {
        const ops = results.flatMap(result => {
          const achievementRecord = database.get<AchievementRecord>('achievement_records').prepareCreate((r) => {
            r.userId = entry.userId;
            r.achievementType = result.achievementType;
            r.achievementKey = result.achievementKey;
            r.triggerEntryId = entry.id;
            r.isActive = true;
          });
          const seed = database.get<Seed>('seeds').prepareCreate((s) => {
            s.userId = entry.userId;
            s.sourceEntryId = entry.id;
            s.sourceAchievementId = achievementRecord.id;
            s.emotion = result.seedEmotion;
            s.colorVariation = null;
            s.isPlanted = false;
          });
          return [achievementRecord, seed];
        });
        await database.batch(...ops);
      });
    }

    return results;
  }

  async evaluateGardenEvent(event: GardenEvent): Promise<AchievementResult | null> {
    const key = GARDEN_EVENT_KEYS[event.type];
    const existing = await database.get<AchievementRecord>('achievement_records')
      .query(Q.where('user_id', event.userId), Q.where('achievement_key', key))
      .fetch();

    if (existing.length > 0) return null;

    const result: AchievementResult = { achievementKey: key, achievementType: 'garden', seedEmotion: event.seedEmotion };

    await database.write(async () => {
      const achievementRecord = database.get<AchievementRecord>('achievement_records').prepareCreate((r) => {
        r.userId = event.userId;
        r.achievementType = result.achievementType;
        r.achievementKey = result.achievementKey;
        r.triggerEntryId = null;
        r.isActive = true;
      });
      const seed = database.get<Seed>('seeds').prepareCreate((s) => {
        s.userId = event.userId;
        s.sourceEntryId = null;
        s.sourceAchievementId = achievementRecord.id;
        s.emotion = result.seedEmotion;
        s.colorVariation = null;
        s.isPlanted = false;
      });
      await database.batch(achievementRecord, seed);
    });

    return result;
  }

  async getEarnedAchievements(userId: string): Promise<{ key: string; type: string; earnedAt: Date }[]> {
    const records = await database.get<AchievementRecord>('achievement_records')
      .query(Q.where('user_id', userId))
      .fetch();
    return records.map(r => ({ key: r.achievementKey, type: r.achievementType, earnedAt: r.earnedAt }));
  }

  async resetStreakIfNeeded(userId: string): Promise<void> {
    const statsRecords = await database.get<UserStats>('user_stats')
      .query(Q.where('user_id', userId))
      .fetch();
    const stats = statsRecords[0];

    if (!stats?.lastEntryDate) return;

    const gap = calendarDayDiff(stats.lastEntryDate, new Date());
    if (gap < 30) return;

    const activeStreakRecords = await database.get<AchievementRecord>('achievement_records')
      .query(
        Q.where('user_id', userId),
        Q.where('achievement_type', 'streak'),
        Q.where('is_active', true),
      )
      .fetch();

    if (activeStreakRecords.length === 0) return;

    await database.write(async () => {
      const ops = activeStreakRecords.map(r => r.prepareUpdate((rec) => {
        rec.isActive = false;
      }));
      await database.batch(...ops);
    });
  }
}

export const achievementEngine: AchievementEngine = new AchievementEngineImpl();
