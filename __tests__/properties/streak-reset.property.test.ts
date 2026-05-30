// Feature: thought-garden, Property 11: Streak reset after inactivity
import fc from 'fast-check';

jest.mock('@/database', () => ({ database: {} }));

import { calendarDayDiff } from '@/modules/achievements/achievement-engine';

describe('Property 11: Streak reset after inactivity', () => {
  it('should indicate reset needed when gap >= 30 days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 30, max: 365 }),
        (gap) => {
          const lastEntryDate = new Date(2024, 0, 1);
          const today = new Date(lastEntryDate.getTime() + gap * 86_400_000);
          const lastEntryString = lastEntryDate.toISOString();

          expect(calendarDayDiff(lastEntryString, today)).toBeGreaterThanOrEqual(30);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not indicate reset when gap < 30 days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 29 }),
        (gap) => {
          const lastEntryDate = new Date(2024, 0, 1);
          const today = new Date(lastEntryDate.getTime() + gap * 86_400_000);
          const lastEntryString = lastEntryDate.toISOString();

          expect(calendarDayDiff(lastEntryString, today)).toBeLessThan(30);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle gap of exactly 30 days', () => {
    const lastEntryDate = new Date(2024, 0, 1);
    const today = new Date(lastEntryDate.getTime() + 30 * 86_400_000);
    const lastEntryString = lastEntryDate.toISOString();

    expect(calendarDayDiff(lastEntryString, today)).toBe(30);
  });
});
