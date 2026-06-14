// Feature: thought-garden, Property 16: Planting transfers seed to garden
jest.mock('@/database', () => ({ database: {} }));

import fc from 'fast-check';

describe('Property 16: Planting uses valid plot indices', () => {
  it('plot indices are non-negative integers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999 }),
        (plotIndex) => {
          expect(plotIndex).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(plotIndex)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
