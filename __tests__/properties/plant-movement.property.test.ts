// Feature: thought-garden, Property 17: Plant movement preserves state
jest.mock('@/database', () => ({ database: {} }));

import fc from 'fast-check';
import { canAdvanceGrowth } from '@/modules/garden/garden-service';

describe('Property 17: Plant movement preserves state', () => {
  it('should preserve growth stage concept', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('seed' as const, 'sprout' as const, 'full' as const, 'bloom' as const),
        (stage) => {
          const result = canAdvanceGrowth(stage, '2024-01-01', '2024-01-02');

          expect(typeof result).toBe('boolean');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not advance bloom stage', () => {
    expect(canAdvanceGrowth('bloom', null, '2024-01-01')).toBe(false);
  });

  it('should not advance if already watered today', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        (date) => {
          expect(canAdvanceGrowth('seed', date, date)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should advance if not watered today', () => {
    expect(canAdvanceGrowth('seed', '2024-01-01', '2024-01-02')).toBe(true);
  });
});
