// Feature: thought-garden, Property 14: Emotion milestone achievement
import fc from 'fast-check';
import type { Entry } from '@/modules/entries';
import type { AchievementContext } from '@/modules/achievements';
import type { Emotion } from '@/shared/types';
import { EMOTIONS } from '@/shared/types';

jest.mock('@/database', () => ({ database: {} }));

import { emotionMilestoneEvaluator } from '@/modules/achievements/achievement-engine';

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'test-id',
    userId: 'user-1',
    content: 'test content',
    primaryEmotion: 'happy',
    secondaryEmotions: [],
    wordCount: 2,
    createdAt: new Date('2024-06-15T10:00:00'),
    modifiedAt: null,
    isDeleted: false,
    ...overrides,
  };
}

function makeContext(overrides: Partial<AchievementContext> = {}): AchievementContext {
  return {
    totalEntryCount: 1,
    emotionUsageCounts: new Map(),
    currentStreak: 0,
    lastEntryDate: null,
    consecutiveSameEmotionCount: 0,
    lastConsecutiveEmotion: null,
    hasFirstEntry: false,
    hasFirstMorningEntry: false,
    hasFirstEveningEntry: false,
    hasFirstWeekendEntry: false,
    hasFirstLongEntry: false,
    hasFirstSecondaryEmotion: false,
    hasFirstBloom: false,
    hasFilledGarden: false,
    hasAllEmotionPlants: false,
    uniqueEmotionsUsed: new Set(),
    lifetimeEmotionCounts: new Map(),
    ...overrides,
  };
}

describe('Property 14: Emotion milestone achievement', () => {
  it('should award milestone when count reaches threshold', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        fc.constantFrom(10, 25, 50),
        (emotion: Emotion, threshold: number) => {
          const entry = makeEntry({ primaryEmotion: emotion });
          const context = makeContext({ lifetimeEmotionCounts: new Map([[emotion, threshold]]) });
          // Pre-earn all lower thresholds so the target threshold is the first unearned
          const earned = new Set<string>(
            [10, 25, 50].filter(t => t < threshold).map(t => `emotion-milestone:${emotion}:${t}`),
          );

          const result = emotionMilestoneEvaluator(entry, context, earned);

          expect(result).not.toBeNull();
          expect(result!.achievementKey).toBe(`emotion-milestone:${emotion}:${threshold}`);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not award when count below threshold', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        fc.constantFrom(10, 25, 50),
        (emotion: Emotion, threshold: number) => {
          const entry = makeEntry({ primaryEmotion: emotion });
          const context = makeContext({ lifetimeEmotionCounts: new Map([[emotion, threshold - 1]]) });
          // Pre-earn all thresholds below the target that would still be met
          const earned = new Set<string>(
            [10, 25, 50].filter(t => t < threshold && (threshold - 1) >= t).map(t => `emotion-milestone:${emotion}:${t}`),
          );

          const result = emotionMilestoneEvaluator(entry, context, earned);

          expect(result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not award if already earned', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        fc.constantFrom(10, 25, 50),
        (emotion: Emotion, threshold: number) => {
          const entry = makeEntry({ primaryEmotion: emotion });
          const context = makeContext({ lifetimeEmotionCounts: new Map([[emotion, threshold]]) });
          // Earn all thresholds at or below the current count
          const earnedKeys: string[] = [];
          for (const t of [10, 25, 50]) {
            if (threshold >= t) earnedKeys.push(`emotion-milestone:${emotion}:${t}`);
          }
          const earned = new Set<string>(earnedKeys);

          const result = emotionMilestoneEvaluator(entry, context, earned);

          expect(result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should award correct emotion as seed', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        (emotion: Emotion) => {
          const entry = makeEntry({ primaryEmotion: emotion });
          const context = makeContext({ lifetimeEmotionCounts: new Map([[emotion, 10]]) });
          const earned = new Set<string>();

          const result = emotionMilestoneEvaluator(entry, context, earned);

          expect(result).not.toBeNull();
          expect(result!.seedEmotion).toBe(emotion);
        },
      ),
      { numRuns: 100 },
    );
  });
});
