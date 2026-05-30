// Feature: thought-garden, Property 10: Streak calculation correctness
import fc from 'fast-check';
import type { Entry } from '@/modules/entries';
import type { AchievementContext } from '@/modules/achievements';
import type { Emotion } from '@/shared/types';
import { EMOTIONS } from '@/shared/types';

jest.mock('@/database', () => ({ database: {} }));

import { streakEvaluator, calendarDayDiff } from '@/modules/achievements/achievement-engine';

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

describe('Property 10: Streak calculation correctness', () => {
  it('should award streak:3 when currentStreak is exactly 3', () => {
    const entry = makeEntry();
    const context = makeContext({ currentStreak: 3 });
    const earned = new Set<string>();

    const result = streakEvaluator(entry, context, earned);

    expect(result).not.toBeNull();
    expect(result!.achievementKey).toBe('streak:3');
  });

  it('should award highest unearned streak threshold only', () => {
    const thresholds = [3, 7, 14, 30] as const;

    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 30 }),
        (streak) => {
          const earned = new Set<string>();
          for (const t of thresholds) {
            if (t < streak && streak >= t) {
              earned.add(`streak:${t}`);
            }
          }
          // Remove the current matching threshold from earned so it can be awarded
          const applicableThresholds = thresholds.filter(t => streak >= t && !earned.has(`streak:${t}`));

          const entry = makeEntry();
          const context = makeContext({ currentStreak: streak });

          const result = streakEvaluator(entry, context, earned);

          if (applicableThresholds.length > 0) {
            expect(result).not.toBeNull();
            expect(result!.achievementKey).toBe(`streak:${applicableThresholds[0]}`);
          } else {
            expect(result).toBeNull();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not award streak below threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),
        (streak) => {
          const entry = makeEntry();
          const context = makeContext({ currentStreak: streak });
          const earned = new Set<string>();

          const result = streakEvaluator(entry, context, earned);

          expect(result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return correct day count from calendarDayDiff', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 150 }),
        (days) => {
          // Start in summer to avoid DST transitions within range
          const fromDate = new Date(2024, 5, 1);
          const toDate = new Date(2024, 5, 1 + days);
          const fromString = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}T00:00:00`;

          expect(calendarDayDiff(fromString, toDate)).toBe(days);
        },
      ),
      { numRuns: 100 },
    );
  });
});
