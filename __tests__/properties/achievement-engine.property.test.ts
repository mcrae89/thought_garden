// Feature: thought-garden, Property 7: Achievement engine awards correct seeds
import fc from 'fast-check';
import type { Entry } from '@/modules/entries';
import type { AchievementContext } from '@/modules/achievements';
import type { Emotion } from '@/shared/types';
import { EMOTIONS } from '@/shared/types';

jest.mock('@/database', () => ({ database: {} }));

import {
  firstEntry,
  milestoneEntry,
  firstEmotionUse,
  firstLongEntry,
  firstSecondaryEmotion,
  morningEntry,
  eveningEntry,
  weekendEntry,
} from '@/modules/achievements/achievement-engine';

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

describe('Property 7: Achievement engine awards correct seeds', () => {
  it('should return null when condition not met', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 1000 }),
        (totalEntryCount) => {
          const entry = makeEntry();
          const context = makeContext({ totalEntryCount });
          const earned = new Set<string>();

          const result = firstEntry(entry, context, earned);

          expect(result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return result with correct seedEmotion', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        (emotion: Emotion) => {
          const entry = makeEntry({ primaryEmotion: emotion });
          const context = makeContext({ totalEntryCount: 1, hasFirstEntry: false });
          const earned = new Set<string>();

          const result = firstEntry(entry, context, earned);

          expect(result).not.toBeNull();
          expect(result!.seedEmotion).toBe(emotion);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should award exactly one result per triggered evaluator', () => {
    const evaluatorConfigs = [
      { evaluator: firstEntry, setup: () => ({ context: makeContext({ totalEntryCount: 1, hasFirstEntry: false }), entry: makeEntry(), earned: new Set<string>() }) },
      { evaluator: firstLongEntry, setup: () => ({ context: makeContext({ hasFirstLongEntry: false }), entry: makeEntry({ wordCount: 250 }), earned: new Set<string>() }) },
      { evaluator: firstSecondaryEmotion, setup: () => ({ context: makeContext({ hasFirstSecondaryEmotion: false }), entry: makeEntry({ secondaryEmotions: ['sad'] }), earned: new Set<string>() }) },
      { evaluator: morningEntry, setup: () => ({ context: makeContext({ hasFirstMorningEntry: false }), entry: makeEntry({ createdAt: new Date('2024-06-15T08:00:00') }), earned: new Set<string>() }) },
      { evaluator: eveningEntry, setup: () => ({ context: makeContext({ hasFirstEveningEntry: false }), entry: makeEntry({ createdAt: new Date('2024-06-15T20:00:00') }), earned: new Set<string>() }) },
      { evaluator: weekendEntry, setup: () => ({ context: makeContext({ hasFirstWeekendEntry: false }), entry: makeEntry({ createdAt: new Date('2024-06-15T10:00:00') }), earned: new Set<string>() }) },
    ];

    fc.assert(
      fc.property(
        fc.subarray(evaluatorConfigs, { minLength: 1 }),
        (subset) => {
          const results = subset.map(({ evaluator, setup }) => {
            const { context, entry, earned } = setup();
            return evaluator(entry, context, earned);
          });

          const triggered = results.filter((r) => r !== null);

          expect(triggered).toHaveLength(subset.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});
