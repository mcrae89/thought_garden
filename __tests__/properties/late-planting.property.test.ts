// Feature: thought-garden, Property 20: Late-planted seeds wait for next watering
jest.mock('@/database', () => ({ database: {} }));

import fc from 'fast-check';
import { canAdvanceGrowth } from '@/modules/garden/garden-service';

describe('Property 20: Late-planted seeds wait for next watering', () => {
  it('should not advance seed planted after today watering (lastGrowthDate = today)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 10 }),
        (today) => {
          expect(canAdvanceGrowth('seed', today, today)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should advance seed on next day', () => {
    expect(canAdvanceGrowth('seed', '2024-01-01', '2024-01-02')).toBe(true);
  });

  it('should advance seed with null lastGrowthDate (never watered)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 10 }),
        (today) => {
          expect(canAdvanceGrowth('seed', null, today)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
