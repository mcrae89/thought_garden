// Feature: thought-garden, Property 18: Watering advances all garden plants
jest.mock('@/database', () => ({ database: {} }));

import fc from 'fast-check';
import { canAdvanceGrowth } from '@/modules/garden/garden-service';

describe('Property 18: Watering advances all garden plants', () => {
  it('should advance seed, sprout, full stages when not watered today', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('seed' as const, 'sprout' as const, 'full' as const),
        (stage) => {
          expect(canAdvanceGrowth(stage, '2024-01-01', '2024-01-02')).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should never advance bloom', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: null }),
        fc.string({ minLength: 1 }),
        (lastGrowthDate, today) => {
          expect(canAdvanceGrowth('bloom', lastGrowthDate, today)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not advance if lastGrowthDate equals today', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('seed' as const, 'sprout' as const, 'full' as const),
        fc.string({ minLength: 1, maxLength: 10 }),
        (stage, today) => {
          expect(canAdvanceGrowth(stage, today, today)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
