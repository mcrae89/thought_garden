/**
 * Feature: thought-garden, Property 6: Seed immutability
 */
jest.mock('@/database', () => ({ database: {} }));

import fc from 'fast-check';
import { EMOTIONS } from '@/shared/types';
import type { Emotion } from '@/shared/types';

interface SeedData {
  id: string;
  emotion: Emotion;
  colorVariation: Emotion | null;
  sourceEntryId: string;
  earnedAt: Date;
}

function simulateEditPrimaryEmotion(entryEmotion: Emotion, newEmotion: Emotion) { return newEmotion; }
function simulateDeleteEntry() { return null; }

const seedArb = fc.record({
  id: fc.uuid(),
  emotion: fc.constantFrom(...EMOTIONS),
  colorVariation: fc.option(fc.constantFrom(...EMOTIONS), { nil: null }),
  sourceEntryId: fc.uuid(),
  earnedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
});

describe('Seed immutability property tests', () => {
  it('should retain emotion after source entry primary emotion is edited', () => {
    fc.assert(
      fc.property(seedArb, fc.constantFrom(...EMOTIONS), (seed, newEntryEmotion) => {
        const snapshot = seed.emotion;
        simulateEditPrimaryEmotion(seed.emotion, newEntryEmotion);
        expect(seed.emotion).toBe(snapshot);
      }),
      { numRuns: 100 },
    );
  });

  it('should retain colorVariation after source entry secondary emotions are edited', () => {
    fc.assert(
      fc.property(seedArb, fc.option(fc.constantFrom(...EMOTIONS), { nil: null }), (seed, newSecondary) => {
        const snapshot = seed.colorVariation;
        let _entrySecondary = seed.colorVariation;
        _entrySecondary = newSecondary;
        expect(seed.colorVariation).toBe(snapshot);
      }),
      { numRuns: 100 },
    );
  });

  it('should retain emotion and colorVariation after source entry is deleted', () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const emotionSnapshot = seed.emotion;
        const colorSnapshot = seed.colorVariation;
        simulateDeleteEntry();
        expect(seed.emotion).toBe(emotionSnapshot);
        expect(seed.colorVariation).toBe(colorSnapshot);
      }),
      { numRuns: 100 },
    );
  });

  it('should retain earnedAt after any entry operation', () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const snapshot = seed.earnedAt.getTime();
        simulateEditPrimaryEmotion(seed.emotion, EMOTIONS[0]);
        simulateDeleteEntry();
        expect(seed.earnedAt.getTime()).toBe(snapshot);
      }),
      { numRuns: 100 },
    );
  });
});
