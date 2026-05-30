// Feature: thought-garden, Property 13: Consistent theme achievement
import fc from 'fast-check';
import type { Entry } from '@/modules/entries';
import type { AchievementContext } from '@/modules/achievements';
import type { Emotion } from '@/shared/types';
import { EMOTIONS } from '@/shared/types';

jest.mock('@/database', () => ({ database: {} }));

import { consistentThemeEvaluator } from '@/modules/achievements/achievement-engine';

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

describe('Property 13: Consistent theme achievement', () => {
  it('should award when consecutiveSameEmotionCount is exactly 5', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        (emotion: Emotion) => {
          const entry = makeEntry({ primaryEmotion: emotion });
          const context = makeContext({ consecutiveSameEmotionCount: 5, lastConsecutiveEmotion: emotion });
          const earned = new Set<string>();

          const result = consistentThemeEvaluator(entry, context, earned);

          expect(result).not.toBeNull();
          expect(result!.seedEmotion).toBe(emotion);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not award when count < 5', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),
        (count) => {
          const entry = makeEntry();
          const context = makeContext({ consecutiveSameEmotionCount: count, lastConsecutiveEmotion: 'happy' });
          const earned = new Set<string>();

          const result = consistentThemeEvaluator(entry, context, earned);

          expect(result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not award when count > 5 (already past trigger point)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 6, max: 20 }),
        (count) => {
          const entry = makeEntry();
          const context = makeContext({ consecutiveSameEmotionCount: count, lastConsecutiveEmotion: 'happy' });
          const earned = new Set<string>();

          const result = consistentThemeEvaluator(entry, context, earned);

          expect(result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});
