// Feature: thought-garden, Property 8: Emotion frequency tiebreaker
import fc from 'fast-check';
import type { Emotion } from '@/shared/types';
import { EMOTIONS } from '@/shared/types';

jest.mock('@/database', () => ({ database: {} }));

import { resolveTie } from '@/modules/achievements/achievement-engine';

describe('Property 8: Emotion frequency tiebreaker', () => {
  it('should return emotion with highest count when no tie', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        fc.constantFrom(...EMOTIONS).filter((e) => e !== EMOTIONS[0]),
        fc.integer({ min: 2, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        (emotion1: Emotion, emotion2: Emotion, highCount, lowDelta) => {
          fc.pre(emotion1 !== emotion2);
          const lowCount = Math.max(1, highCount - lowDelta);
          fc.pre(highCount > lowCount);

          const counts = new Map<Emotion, number>([[emotion1, highCount], [emotion2, lowCount]]);
          const lastUsed = new Map<Emotion, Date>([[emotion1, new Date('2024-01-01')], [emotion2, new Date('2024-06-01')]]);

          const result = resolveTie(counts, lastUsed);

          expect(result).toBe(emotion1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return most recently used emotion on tie', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        fc.constantFrom(...EMOTIONS),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 0, max: 1_500_000_000_000 }),
        fc.integer({ min: 1, max: 365 }),
        (emotion1: Emotion, emotion2: Emotion, count, baseMs, daysDiff) => {
          fc.pre(emotion1 !== emotion2);
          const earlierDate = new Date(baseMs);
          const laterDate = new Date(baseMs + daysDiff * 86_400_000);

          const counts = new Map<Emotion, number>([[emotion1, count], [emotion2, count]]);
          const lastUsed = new Map<Emotion, Date>([[emotion1, earlierDate], [emotion2, laterDate]]);

          const result = resolveTie(counts, lastUsed);

          expect(result).toBe(emotion2);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle single emotion', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        fc.integer({ min: 1, max: 100 }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2025-01-01') }),
        (emotion: Emotion, count, date) => {
          const counts = new Map<Emotion, number>([[emotion, count]]);
          const lastUsed = new Map<Emotion, Date>([[emotion, date]]);

          const result = resolveTie(counts, lastUsed);

          expect(result).toBe(emotion);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should be deterministic (same input = same output)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(fc.constantFrom(...EMOTIONS), fc.integer({ min: 1, max: 50 })),
          { minLength: 1, maxLength: 10 },
        ),
        (entries) => {
          const counts = new Map<Emotion, number>(entries as [Emotion, number][]);
          const lastUsed = new Map<Emotion, Date>(
            [...counts.keys()].map((e) => [e, new Date('2024-01-15')]),
          );

          const result1 = resolveTie(counts, lastUsed);
          const result2 = resolveTie(counts, lastUsed);

          expect(result1).toBe(result2);
        },
      ),
      { numRuns: 100 },
    );
  });
});
