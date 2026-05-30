jest.mock('@/database', () => ({ database: {} }));

import type { Entry } from '@/modules/entries';
import type { AchievementContext } from '@/modules/achievements';
import type { Emotion } from '@/shared/types';
import { EMOTIONS } from '@/shared/types';
import {
  firstEntry,
  milestoneEntry,
  allEmotionsUsed,
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

describe('firstEntry evaluator', () => {
  it('should award on first entry (totalEntryCount=1, hasFirstEntry=false)', () => {
    const entry = makeEntry();
    const context = makeContext({ totalEntryCount: 1, hasFirstEntry: false });
    const earned = new Set<string>();

    const result = firstEntry(entry, context, earned);

    expect(result).not.toBeNull();
    expect(result!.achievementKey).toBe('first_entry');
    expect(result!.seedEmotion).toBe('happy');
  });

  it('should not award if hasFirstEntry=true', () => {
    const entry = makeEntry();
    const context = makeContext({ totalEntryCount: 1, hasFirstEntry: true });
    const earned = new Set<string>();

    const result = firstEntry(entry, context, earned);

    expect(result).toBeNull();
  });

  it('should not award if totalEntryCount !== 1', () => {
    const entry = makeEntry();
    const context = makeContext({ totalEntryCount: 2, hasFirstEntry: false });
    const earned = new Set<string>();

    const result = firstEntry(entry, context, earned);

    expect(result).toBeNull();
  });
});

describe('milestoneEntry evaluator', () => {
  it('should award milestone_10 at exactly 10 entries', () => {
    const entry = makeEntry();
    const context = makeContext({ totalEntryCount: 10 });
    const earned = new Set<string>();

    const result = milestoneEntry(entry, context, earned);

    expect(result).not.toBeNull();
    expect(result!.achievementKey).toBe('milestone_10');
  });

  it('should award milestone_50 at exactly 50 entries', () => {
    const entry = makeEntry();
    const context = makeContext({ totalEntryCount: 50 });
    const earned = new Set<string>();

    const result = milestoneEntry(entry, context, earned);

    expect(result).not.toBeNull();
    expect(result!.achievementKey).toBe('milestone_50');
  });

  it('should award milestone_100 at exactly 100 entries', () => {
    const entry = makeEntry();
    const context = makeContext({ totalEntryCount: 100 });
    const earned = new Set<string>();

    const result = milestoneEntry(entry, context, earned);

    expect(result).not.toBeNull();
    expect(result!.achievementKey).toBe('milestone_100');
  });

  it('should not award at 9, 11, 49, 51, 99, 101', () => {
    const entry = makeEntry();
    const earned = new Set<string>();

    for (const count of [9, 11, 49, 51, 99, 101]) {
      const context = makeContext({ totalEntryCount: count });

      const result = milestoneEntry(entry, context, earned);

      expect(result).toBeNull();
    }
  });

  it('should not award if key already earned', () => {
    const entry = makeEntry();
    const context = makeContext({ totalEntryCount: 10 });
    const earned = new Set<string>(['milestone_10']);

    const result = milestoneEntry(entry, context, earned);

    expect(result).toBeNull();
  });
});

describe('allEmotionsUsed evaluator', () => {
  it('should award when uniqueEmotionsUsed.size === 30', () => {
    const entry = makeEntry();
    const context = makeContext({ uniqueEmotionsUsed: new Set(EMOTIONS) });
    const earned = new Set<string>();

    const result = allEmotionsUsed(entry, context, earned);

    expect(result).not.toBeNull();
    expect(result!.achievementKey).toBe('all_emotions_used');
  });

  it('should not award when size < 30', () => {
    const entry = makeEntry();
    const context = makeContext({ uniqueEmotionsUsed: new Set(EMOTIONS.slice(0, 29)) });
    const earned = new Set<string>();

    const result = allEmotionsUsed(entry, context, earned);

    expect(result).toBeNull();
  });

  it('should not award if already earned', () => {
    const entry = makeEntry();
    const context = makeContext({ uniqueEmotionsUsed: new Set(EMOTIONS) });
    const earned = new Set<string>(['all_emotions_used']);

    const result = allEmotionsUsed(entry, context, earned);

    expect(result).toBeNull();
  });
});

describe('firstLongEntry evaluator', () => {
  it('should award when wordCount >= 200 and !hasFirstLongEntry', () => {
    const entry = makeEntry({ wordCount: 250 });
    const context = makeContext({ hasFirstLongEntry: false });
    const earned = new Set<string>();

    const result = firstLongEntry(entry, context, earned);

    expect(result).not.toBeNull();
    expect(result!.achievementKey).toBe('first_long_entry');
  });

  it('should not award when wordCount < 200', () => {
    const entry = makeEntry({ wordCount: 199 });
    const context = makeContext({ hasFirstLongEntry: false });
    const earned = new Set<string>();

    const result = firstLongEntry(entry, context, earned);

    expect(result).toBeNull();
  });

  it('should not award if hasFirstLongEntry=true', () => {
    const entry = makeEntry({ wordCount: 250 });
    const context = makeContext({ hasFirstLongEntry: true });
    const earned = new Set<string>();

    const result = firstLongEntry(entry, context, earned);

    expect(result).toBeNull();
  });

  it('boundary: wordCount=200 awards, wordCount=199 does not', () => {
    const context = makeContext({ hasFirstLongEntry: false });
    const earned = new Set<string>();

    const at200 = firstLongEntry(makeEntry({ wordCount: 200 }), context, earned);
    const at199 = firstLongEntry(makeEntry({ wordCount: 199 }), context, earned);

    expect(at200).not.toBeNull();
    expect(at199).toBeNull();
  });
});

describe('firstSecondaryEmotion evaluator', () => {
  it('should award when secondaryEmotions.length > 0 and !hasFirstSecondaryEmotion', () => {
    const entry = makeEntry({ secondaryEmotions: ['sad'] });
    const context = makeContext({ hasFirstSecondaryEmotion: false });
    const earned = new Set<string>();

    const result = firstSecondaryEmotion(entry, context, earned);

    expect(result).not.toBeNull();
    expect(result!.achievementKey).toBe('first_secondary_emotion');
  });

  it('should not award when secondaryEmotions is empty', () => {
    const entry = makeEntry({ secondaryEmotions: [] });
    const context = makeContext({ hasFirstSecondaryEmotion: false });
    const earned = new Set<string>();

    const result = firstSecondaryEmotion(entry, context, earned);

    expect(result).toBeNull();
  });

  it('should not award if hasFirstSecondaryEmotion=true', () => {
    const entry = makeEntry({ secondaryEmotions: ['sad'] });
    const context = makeContext({ hasFirstSecondaryEmotion: true });
    const earned = new Set<string>();

    const result = firstSecondaryEmotion(entry, context, earned);

    expect(result).toBeNull();
  });
});

describe('morningEntry evaluator', () => {
  it('should award at hour 5 (boundary)', () => {
    const entry = makeEntry({ createdAt: new Date('2024-06-15T05:00:00') });
    const context = makeContext({ hasFirstMorningEntry: false });
    const earned = new Set<string>();

    const result = morningEntry(entry, context, earned);

    expect(result).not.toBeNull();
    expect(result!.achievementKey).toBe('time:morning');
  });

  it('should award at hour 11 (boundary)', () => {
    const entry = makeEntry({ createdAt: new Date('2024-06-15T11:30:00') });
    const context = makeContext({ hasFirstMorningEntry: false });
    const earned = new Set<string>();

    const result = morningEntry(entry, context, earned);

    expect(result).not.toBeNull();
    expect(result!.achievementKey).toBe('time:morning');
  });

  it('should not award at hour 4', () => {
    const entry = makeEntry({ createdAt: new Date('2024-06-15T04:59:00') });
    const context = makeContext({ hasFirstMorningEntry: false });
    const earned = new Set<string>();

    const result = morningEntry(entry, context, earned);

    expect(result).toBeNull();
  });

  it('should not award at hour 12', () => {
    const entry = makeEntry({ createdAt: new Date('2024-06-15T12:00:00') });
    const context = makeContext({ hasFirstMorningEntry: false });
    const earned = new Set<string>();

    const result = morningEntry(entry, context, earned);

    expect(result).toBeNull();
  });

  it('should not award if hasFirstMorningEntry=true', () => {
    const entry = makeEntry({ createdAt: new Date('2024-06-15T08:00:00') });
    const context = makeContext({ hasFirstMorningEntry: true });
    const earned = new Set<string>();

    const result = morningEntry(entry, context, earned);

    expect(result).toBeNull();
  });
});

describe('eveningEntry evaluator', () => {
  it('should award at hour 18 (boundary)', () => {
    const entry = makeEntry({ createdAt: new Date('2024-06-15T18:00:00') });
    const context = makeContext({ hasFirstEveningEntry: false });
    const earned = new Set<string>();

    const result = eveningEntry(entry, context, earned);

    expect(result).not.toBeNull();
    expect(result!.achievementKey).toBe('time:evening');
  });

  it('should award at hour 23 (boundary)', () => {
    const entry = makeEntry({ createdAt: new Date('2024-06-15T23:30:00') });
    const context = makeContext({ hasFirstEveningEntry: false });
    const earned = new Set<string>();

    const result = eveningEntry(entry, context, earned);

    expect(result).not.toBeNull();
    expect(result!.achievementKey).toBe('time:evening');
  });

  it('should not award at hour 17', () => {
    const entry = makeEntry({ createdAt: new Date('2024-06-15T17:59:00') });
    const context = makeContext({ hasFirstEveningEntry: false });
    const earned = new Set<string>();

    const result = eveningEntry(entry, context, earned);

    expect(result).toBeNull();
  });

  it('should not award if hasFirstEveningEntry=true', () => {
    const entry = makeEntry({ createdAt: new Date('2024-06-15T20:00:00') });
    const context = makeContext({ hasFirstEveningEntry: true });
    const earned = new Set<string>();

    const result = eveningEntry(entry, context, earned);

    expect(result).toBeNull();
  });
});

describe('weekendEntry evaluator', () => {
  it('should award on Saturday (day=6)', () => {
    // 2024-06-15 is a Saturday
    const entry = makeEntry({ createdAt: new Date('2024-06-15T10:00:00') });
    const context = makeContext({ hasFirstWeekendEntry: false });
    const earned = new Set<string>();

    const result = weekendEntry(entry, context, earned);

    expect(result).not.toBeNull();
    expect(result!.achievementKey).toBe('time:weekend');
  });

  it('should award on Sunday (day=0)', () => {
    // 2024-06-16 is a Sunday
    const entry = makeEntry({ createdAt: new Date('2024-06-16T10:00:00') });
    const context = makeContext({ hasFirstWeekendEntry: false });
    const earned = new Set<string>();

    const result = weekendEntry(entry, context, earned);

    expect(result).not.toBeNull();
    expect(result!.achievementKey).toBe('time:weekend');
  });

  it('should not award on Monday (day=1)', () => {
    // 2024-06-17 is a Monday
    const entry = makeEntry({ createdAt: new Date('2024-06-17T10:00:00') });
    const context = makeContext({ hasFirstWeekendEntry: false });
    const earned = new Set<string>();

    const result = weekendEntry(entry, context, earned);

    expect(result).toBeNull();
  });

  it('should not award if hasFirstWeekendEntry=true', () => {
    const entry = makeEntry({ createdAt: new Date('2024-06-15T10:00:00') });
    const context = makeContext({ hasFirstWeekendEntry: true });
    const earned = new Set<string>();

    const result = weekendEntry(entry, context, earned);

    expect(result).toBeNull();
  });
});

describe('Achievement persistence after entry deletion (Req 4.23)', () => {
  it('should not re-award once achievementKey is in earned set regardless of entry changes', () => {
    const entry = makeEntry({ id: 'different-entry-id' });
    const context = makeContext({ totalEntryCount: 1, hasFirstEntry: false });
    const earned = new Set<string>(['first_entry']);

    const result = firstEntry(entry, context, earned);

    expect(result).toBeNull();
  });

  it('should not re-award milestone when key is in earned set', () => {
    const entry = makeEntry();
    const context = makeContext({ totalEntryCount: 10 });
    const earned = new Set<string>(['milestone_10']);

    const result = milestoneEntry(entry, context, earned);

    expect(result).toBeNull();
  });

  it('should not re-award time:morning when key is in earned set', () => {
    const entry = makeEntry({ createdAt: new Date('2024-06-15T08:00:00') });
    const context = makeContext({ hasFirstMorningEntry: false });
    const earned = new Set<string>(['time:morning']);

    const result = morningEntry(entry, context, earned);

    expect(result).toBeNull();
  });
});
