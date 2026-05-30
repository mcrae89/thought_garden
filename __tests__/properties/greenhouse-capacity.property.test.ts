// Feature: thought-garden, Property 25: Greenhouse capacity by tier
jest.mock('@/database', () => ({ database: {} }));

import fc from 'fast-check';
import { getMaxGreenhouse } from '@/modules/garden/garden-service';

describe('Property 25: Greenhouse capacity by tier', () => {
  it('should allow storage when count < max for free tier', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),
        (count) => {
          expect(count).toBeLessThan(getMaxGreenhouse('free'));
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should block storage when count >= max for free tier', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 20 }),
        (count) => {
          expect(count).toBeGreaterThanOrEqual(getMaxGreenhouse('free'));
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should allow storage when count < max for paid tier', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9 }),
        (count) => {
          expect(count).toBeLessThan(getMaxGreenhouse('paid'));
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should block storage when count >= max for paid tier', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 20 }),
        (count) => {
          expect(count).toBeGreaterThanOrEqual(getMaxGreenhouse('paid'));
        },
      ),
      { numRuns: 100 },
    );
  });
});
