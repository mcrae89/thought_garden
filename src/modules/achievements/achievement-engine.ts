import { db } from '@/database';
import { generateId, now } from '@/database/helpers';
import type { Emotion } from '@/shared/types';
import type { Entry } from '@/modules/entries';
import type { AchievementContext, AchievementEngine, AchievementResult, GardenEvent } from './index';

export type Evaluator = (entry: Entry, context: AchievementContext, earned: Set<string>) => AchievementResult | null;

interface AchievementRow {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_key: string;
  trigger_entry_id: string | null;
  earned_at: number;
  is_active: number;
}

interface UserStatsRow {
  id: string;
  user_id: string;
  total_entries: number;
  current_streak: number;
  last_entry_date: string | null;
  consecutive_same_emotion: number;
  last_emotion: string | null;
  tier: string;
}

interface EntryEmotionRow {
  id: string;
  entry_id: string;
  emotion: string;
  type: string;
  order: number;
}

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

// --- Time-based evaluators ---

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

// --- Repeatable evaluators ---

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

export const consistentThemeEvaluator: Evaluator = (entry, context, earned) => {
  if (context.consecutiveSameEmotionCount < 5) return null;
  if (earned.has('consistent-theme')) return null;
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

export function buildAchievementContext(userId: string, _currentEntry: Entry): AchievementContext {
  const achievementRecords = db.getAllSync<AchievementRow>(
    'SELECT * FROM achievement_records WHERE user_id = ?', [userId],
  );
  const earnedKeys = new Set(achievementRecords.map(r => r.achievement_key));

  const stats = db.getFirstSync<UserStatsRow>('SELECT * FROM user_stats WHERE user_id = ?', [userId]);

  const totalEntryCount = stats?.total_entries ?? 0;
  const currentStreak = stats?.current_streak ?? 0;
  const lastEntryDate = stats?.last_entry_date ?? null;
  const consecutiveSameEmotionCount = stats?.consecutive_same_emotion ?? 0;
  const lastConsecutiveEmotion = (stats?.last_emotion as Emotion) ?? null;

  const allEntryEmotions = db.getAllSync<EntryEmotionRow>(
    `SELECT ee.* FROM entry_emotions ee
     INNER JOIN entries e ON e.id = ee.entry_id
     WHERE ee.type = 'primary' AND e.user_id = ?`,
    [userId],
  );

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

// --- User stats updater ---

export function updateUserStats(userId: string, entry: Entry): void {
  const today = entry.createdAt.toISOString().slice(0, 10);
  const stats = db.getFirstSync<UserStatsRow>('SELECT * FROM user_stats WHERE user_id = ?', [userId]);
  const timestamp = now();

  if (!stats) {
    db.runSync(
      `INSERT INTO user_stats (id, user_id, total_entries, current_streak, last_entry_date, consecutive_same_emotion, last_emotion, tier, last_modified_at)
       VALUES (?, ?, 1, 1, ?, 1, ?, 'free', ?)`,
      [generateId(), userId, today, entry.primaryEmotion, timestamp],
    );
    return;
  }

  let streak = stats.current_streak;
  if (stats.last_entry_date) {
    const diff = calendarDayDiff(stats.last_entry_date, entry.createdAt);
    if (diff === 1) streak++;
    else if (diff > 1) streak = 1;
    // diff === 0 means same day, keep streak unchanged
  } else {
    streak = 1;
  }

  const consecutiveSame = stats.last_emotion === entry.primaryEmotion
    ? stats.consecutive_same_emotion + 1
    : 1;

  db.runSync(
    `UPDATE user_stats SET total_entries = total_entries + 1, current_streak = ?, last_entry_date = ?,
     consecutive_same_emotion = ?, last_emotion = ?, last_modified_at = ? WHERE id = ?`,
    [streak, today, consecutiveSame, entry.primaryEmotion, timestamp, stats.id],
  );
}

// --- Garden event key mapping ---

const GARDEN_EVENT_KEYS: Record<GardenEvent['type'], string> = {
  'first-bloom': 'garden:first-bloom',
  'full-garden': 'garden:full-garden',
  'all-emotions': 'garden:all-emotions',
};

// --- Engine implementation ---

class AchievementEngineImpl implements AchievementEngine {
  evaluateEntry(entry: Entry, context: AchievementContext): AchievementResult[] {
    const records = db.getAllSync<AchievementRow>(
      'SELECT * FROM achievement_records WHERE user_id = ? AND is_active = 1', [entry.userId],
    );
    const earned = new Set(records.map(r => r.achievement_key));

    const results: AchievementResult[] = [];
    for (const evaluator of evaluators) {
      const result = evaluator(entry, context, earned);
      if (result) results.push(result);
    }

    if (results.length > 0) {
      db.withTransactionSync(() => {
        for (const result of results) {
          const achievementId = generateId();
          const seedId = generateId();
          const earnedAt = now();
          db.runSync(
            'INSERT INTO achievement_records (id, user_id, achievement_type, achievement_key, trigger_entry_id, earned_at, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [achievementId, entry.userId, result.achievementType, result.achievementKey, entry.id, earnedAt],
          );
          db.runSync(
            'INSERT INTO seeds (id, user_id, source_entry_id, source_achievement_id, emotion, color_variation, earned_at, is_planted) VALUES (?, ?, ?, ?, ?, NULL, ?, 0)',
            [seedId, entry.userId, entry.id, achievementId, result.seedEmotion, earnedAt],
          );
        }
      });
    }

    return results;
  }

  evaluateGardenEvent(event: GardenEvent): AchievementResult | null {
    const key = GARDEN_EVENT_KEYS[event.type];
    const existing = db.getFirstSync<AchievementRow>(
      'SELECT * FROM achievement_records WHERE user_id = ? AND achievement_key = ?', [event.userId, key],
    );

    if (existing) return null;

    const result: AchievementResult = { achievementKey: key, achievementType: 'garden', seedEmotion: event.seedEmotion };
    const achievementId = generateId();
    const seedId = generateId();
    const earnedAt = now();

    db.withTransactionSync(() => {
      db.runSync(
        'INSERT INTO achievement_records (id, user_id, achievement_type, achievement_key, trigger_entry_id, earned_at, is_active) VALUES (?, ?, ?, ?, NULL, ?, 1)',
        [achievementId, event.userId, result.achievementType, result.achievementKey, earnedAt],
      );
      db.runSync(
        'INSERT INTO seeds (id, user_id, source_entry_id, source_achievement_id, emotion, color_variation, earned_at, is_planted) VALUES (?, ?, NULL, ?, ?, NULL, ?, 0)',
        [seedId, event.userId, achievementId, result.seedEmotion, earnedAt],
      );
    });

    return result;
  }

  getEarnedAchievements(userId: string): { key: string; type: string; earnedAt: Date }[] {
    const records = db.getAllSync<AchievementRow>(
      'SELECT * FROM achievement_records WHERE user_id = ?', [userId],
    );
    return records.map(r => ({ key: r.achievement_key, type: r.achievement_type, earnedAt: new Date(r.earned_at) }));
  }

  resetStreakIfNeeded(userId: string): void {
    const stats = db.getFirstSync<UserStatsRow>('SELECT * FROM user_stats WHERE user_id = ?', [userId]);
    if (!stats?.last_entry_date) return;

    const gap = calendarDayDiff(stats.last_entry_date, new Date());
    if (gap < 30) return;

    const activeStreakRecords = db.getAllSync<AchievementRow>(
      'SELECT * FROM achievement_records WHERE user_id = ? AND achievement_type = ? AND is_active = 1',
      [userId, 'streak'],
    );

    if (activeStreakRecords.length === 0) return;

    db.withTransactionSync(() => {
      for (const r of activeStreakRecords) {
        db.runSync('UPDATE achievement_records SET is_active = 0 WHERE id = ?', [r.id]);
      }
    });
  }
}

export const achievementEngine: AchievementEngine = new AchievementEngineImpl();
