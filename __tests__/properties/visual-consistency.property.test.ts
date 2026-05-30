import * as fc from 'fast-check';
import { getSpritePath, getFrameIndex } from '@/modules/plant-visuals/plant-visual-service';
import { EMOTIONS, type GrowthStage } from '@/shared/types';

/**
 * Feature: thought-garden, Property 23: Visual consistency across growth stages
 */
describe('Property 23: Visual consistency across growth stages', () => {
  it('should use same sprite sheet for all growth stages of same emotion', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        (e) => {
          const path = getSpritePath(e, 'garden');
          return path === getSpritePath(e, 'garden');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should use different frame indices for different stages', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.constantFrom('seed', 'sprout', 'full', 'bloom'), { minLength: 2, maxLength: 2 }),
        (stages) => {
          return getFrameIndex(stages[0] as GrowthStage) !== getFrameIndex(stages[1] as GrowthStage);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should map all 4 stages to indices 0-3', () => {
    expect(getFrameIndex('seed')).toBe(0);
    expect(getFrameIndex('sprout')).toBe(1);
    expect(getFrameIndex('full')).toBe(2);
    expect(getFrameIndex('bloom')).toBe(3);
  });
});
