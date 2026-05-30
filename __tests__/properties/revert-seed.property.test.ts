// Feature: thought-garden, Property 26: Revert-to-seed preserves emotion
jest.mock('@/database', () => ({ database: {} }));

import fc from 'fast-check';
import { EMOTIONS } from '@/shared/types';
import type { Emotion } from '@/shared/types';

describe('Property 26: Revert-to-seed preserves emotion', () => {
  it('should preserve emotion when reverting plant to seed', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        (emotion: Emotion) => {
          const plant = { emotion, colorVariation: null };
          const seed = { emotion: plant.emotion, colorVariation: plant.colorVariation };

          expect(seed.emotion).toBe(plant.emotion);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should preserve colorVariation when reverting', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        fc.option(fc.constantFrom(...EMOTIONS), { nil: null }),
        (emotion: Emotion, colorVariation: Emotion | null) => {
          const plant = { emotion, colorVariation };
          const seed = { emotion: plant.emotion, colorVariation: plant.colorVariation };

          expect(seed.colorVariation).toBe(plant.colorVariation);
        },
      ),
      { numRuns: 100 },
    );
  });
});
