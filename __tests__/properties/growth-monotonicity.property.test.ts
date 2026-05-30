// Feature: thought-garden, Property 19: Growth stage monotonicity
jest.mock('@/database', () => ({ database: {} }));

import fc from 'fast-check';
import { NEXT_STAGE, GROWTH_STAGE_ORDER } from '@/shared/types';
import type { GrowthStage } from '@/shared/types';

describe('Property 19: Growth stage monotonicity', () => {
  it('should never decrease growth stage', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('seed' as const, 'sprout' as const, 'full' as const, 'bloom' as const),
        (stage: GrowthStage) => {
          const next = NEXT_STAGE[stage];

          if (next !== null) {
            expect(GROWTH_STAGE_ORDER[next]).toBeGreaterThan(GROWTH_STAGE_ORDER[stage]);
          } else {
            expect(next).toBeNull();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should have null next stage for bloom', () => {
    expect(NEXT_STAGE['bloom']).toBeNull();
  });

  it('should advance through stages in order', () => {
    expect(NEXT_STAGE['seed']).toBe('sprout');
    expect(NEXT_STAGE['sprout']).toBe('full');
    expect(NEXT_STAGE['full']).toBe('bloom');
    expect(NEXT_STAGE['bloom']).toBeNull();
  });
});
