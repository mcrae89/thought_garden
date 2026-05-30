// Feature: thought-garden, Property 12: Returning achievement
import fc from 'fast-check';
import type { Entry } from '@/modules/entries';
import type { AchievementContext } from '@/modules/achievements';

jest.mock('@/database', () => ({ database: {} }));

import { returningEvaluator } from '@/modules/achievements/achievement-engine';

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

describe('Property 12: Returning achievement', () => {
  it('should award returning when gap >= 7 days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 7, max: 365 }),
        (gap) => {
          const lastEntryDate = new Date(2024, 0, 1);
          const createdAt = new Date(lastEntryDate.getTime() + gap * 86_400_000);
          const entry = makeEntry({ createdAt });
          const context = makeContext({ lastEntryDate: lastEntryDate.toISOString() });
          const earned = new Set<string>();

          const result = returningEvaluator(entry, context, earned);

          expect(result).not.toBeNull();
          expect(result!.achievementKey).toBe('returning');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not award when gap < 7 days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 6 }),
        (gap) => {
          const lastEntryDate = new Date(2024, 0, 1);
          const createdAt = new Date(lastEntryDate.getTime() + gap * 86_400_000);
          const entry = makeEntry({ createdAt });
          const context = makeContext({ lastEntryDate: lastEntryDate.toISOString() });
          const earned = new Set<string>();

          const result = returningEvaluator(entry, context, earned);

          expect(result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not award when lastEntryDate is null (first entry)', () => {
    const entry = makeEntry();
    const context = makeContext({ lastEntryDate: null });
    const earned = new Set<string>();

    const result = returningEvaluator(entry, context, earned);

    expect(result).toBeNull();
  });
});
