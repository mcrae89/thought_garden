// Feature: thought-garden, Property 5: Entry edit preserves creation timestamp
jest.mock('@/database', () => ({ database: {} }));

import fc from 'fast-check';
import { mapToEntry } from '@/modules/entries/entry-service';
import { EMOTIONS } from '@/shared/types';

describe('mapToEntry edit timestamp preservation', () => {
  it('should preserve createdAt after edit (modifiedAt set to after createdAt)', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          userId: fc.uuid(),
          content: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          primaryEmotion: fc.constantFrom(...EMOTIONS),
          wordCount: fc.integer({ min: 1, max: 500 }),
          createdAtMs: fc.integer({ min: 0, max: 1_000_000_000_000 }),
          modifiedAtOffset: fc.integer({ min: 1, max: 1_000_000_000 }),
          isDeleted: fc.constant(false),
        }).map(({ createdAtMs, modifiedAtOffset, ...rest }) => ({
          ...rest,
          createdAt: new Date(createdAtMs),
          modifiedAt: new Date(createdAtMs + modifiedAtOffset),
        })),
        (model) => {
          const entry = mapToEntry(model as any);

          expect(entry.createdAt.getTime()).toBe(model.createdAt.getTime());
          expect(entry.modifiedAt).not.toBeNull();
          expect(entry.modifiedAt!.getTime()).toBeGreaterThan(entry.createdAt.getTime());
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should have null modifiedAt for entries that have never been edited', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          userId: fc.uuid(),
          content: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          primaryEmotion: fc.constantFrom(...EMOTIONS),
          wordCount: fc.integer({ min: 1, max: 500 }),
          createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-01-01') }),
          modifiedAt: fc.constant(null),
          isDeleted: fc.constant(false),
        }),
        (model) => {
          const entry = mapToEntry(model as any);

          expect(entry.modifiedAt).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should never change createdAt regardless of modifiedAt value', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          userId: fc.uuid(),
          content: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          primaryEmotion: fc.constantFrom(...EMOTIONS),
          wordCount: fc.integer({ min: 1, max: 500 }),
          createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
          modifiedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }), { nil: null }),
          isDeleted: fc.boolean(),
        }),
        (model) => {
          const entry = mapToEntry(model as any);

          expect(entry.createdAt.getTime()).toBe(model.createdAt.getTime());
        },
      ),
      { numRuns: 100 },
    );
  });
});
