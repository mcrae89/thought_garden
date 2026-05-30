// Feature: thought-garden, Property 24: Greenhouse stasis
jest.mock('@/database', () => ({ database: {} }));

import fc from 'fast-check';
import { canAdvanceGrowth } from '@/modules/garden/garden-service';

describe('Property 24: Greenhouse stasis', () => {
  it('should return true for any non-bloom stage with different dates', () => {
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

  it('should return false for bloom regardless of dates', () => {
    expect(canAdvanceGrowth('bloom', '2024-01-01', '2024-01-02')).toBe(false);
  });
});
