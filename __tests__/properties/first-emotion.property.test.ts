// Feature: thought-garden, Property 9: First-time emotion achievement
import fc from 'fast-check';
import type { Entry } from '@/modules/entries';
import type { AchievementContext } from '@/modules/achievements';
import type { Emotion } from '@/shared/types';
import { EMOTIONS } from '@/shared/types';

jest.mock('@/database', () => ({ database: {} }));

import { firstEmotionUse } from '@/modules/achievements/achievement-engine';

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

describe('Property 9: First-time emotion achievement', () => {
  it('should award seed on first use of each emotion', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        (emotion: Emotion) => {
          const entry = makeEntry({ primaryEmotion: emotion });
          const context = makeContext({ emotionUsageCounts: new Map([[emotion, 1]]) });
          const earned = new Set<string>();

          const result = firstEmotionUse(entry, context, earned);

          expect(result).not.toBeNull();
          expect(result!.seedEmotion).toBe(emotion);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not award on subsequent uses', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        fc.integer({ min: 2, max: 100 }),
        (emotion: Emotion, count) => {
          const entry = makeEntry({ primaryEmotion: emotion });
          const context = makeContext({ emotionUsageCounts: new Map([[emotion, count]]) });
          const earned = new Set<string>();

          const result = firstEmotionUse(entry, context, earned);

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
        (emotion: Emotion) => {
          const entry = makeEntry({ primaryEmotion: emotion });
          const context = makeContext({ emotionUsageCounts: new Map([[emotion, 1]]) });
          const earned = new Set<string>([`first_emotion_${emotion}`]);

          const result = firstEmotionUse(entry, context, earned);

          expect(result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});
