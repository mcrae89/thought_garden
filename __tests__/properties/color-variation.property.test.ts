import * as fc from 'fast-check';
import { resolveColorVariation } from '@/modules/plant-visuals/plant-visual-service';
import { EMOTIONS } from '@/shared/types';

/**
 * Feature: thought-garden, Property 22: Color variation determination
 */
describe('Property 22: Color variation determination', () => {
  it('should return null when no secondary emotion', () => {
    expect(resolveColorVariation(null)).toBeNull();
  });

  it('should return the secondary emotion as color variation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        (e) => {
          return resolveColorVariation(e) === e;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should preserve any valid emotion as color variation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        (e) => {
          return resolveColorVariation(e) !== undefined;
        },
      ),
      { numRuns: 100 },
    );
  });
});
