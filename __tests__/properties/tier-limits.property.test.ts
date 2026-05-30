// Feature: thought-garden, Property 3: Free tier daily entry limit
jest.mock('@/database', () => ({ database: {} }));

import fc from 'fast-check';
import { checkDailyLimit } from '@/modules/entries/entry-service';

describe('checkDailyLimit', () => {
  it('should allow free-tier user when no entries exist today', () => {
    fc.assert(
      fc.property(
        fc.constant(0),
        (count) => {
          const result = checkDailyLimit('free', count);

          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should block free-tier user when 1 or more entries exist today', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (count) => {
          const result = checkDailyLimit('free', count);

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.type).toBe('validation');
            expect(result.error).toHaveProperty('field', 'dailyLimit');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should allow paid-tier user regardless of existing entry count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (count) => {
          const result = checkDailyLimit('paid', count);

          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should never block paid-tier user (exhaustive over large counts)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        (count) => {
          const result = checkDailyLimit('paid', count);

          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
