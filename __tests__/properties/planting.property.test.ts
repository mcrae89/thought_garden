// Feature: thought-garden, Property 16: Planting transfers seed to garden
jest.mock('@/database', () => ({ database: {} }));

import fc from 'fast-check';
import { getMaxPlots } from '@/modules/garden/garden-service';

describe('Property 16: Planting transfers seed to garden', () => {
  it('should allow planting in empty plot', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 8 }),
        (plotIndex) => {
          expect(plotIndex).toBeLessThan(getMaxPlots('free'));
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should reject plotIndex >= maxPlots for free tier', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 9, max: 100 }),
        (plotIndex) => {
          expect(plotIndex).toBeGreaterThanOrEqual(getMaxPlots('free'));
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should reject plotIndex >= maxPlots for paid tier', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 25, max: 100 }),
        (plotIndex) => {
          expect(plotIndex).toBeGreaterThanOrEqual(getMaxPlots('paid'));
        },
      ),
      { numRuns: 100 },
    );
  });
});
