// Feature: thought-garden, Property 4: Entry persistence round-trip
jest.mock('@/database', () => ({ database: {} }));

import fc from 'fast-check';
import { mapToEntry } from '@/modules/entries/entry-service';
import { EMOTIONS } from '@/shared/types';
import type { Emotion } from '@/shared/types';

const modelArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
  primaryEmotion: fc.constantFrom(...EMOTIONS),
  wordCount: fc.integer({ min: 1, max: 1000 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
  modifiedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }), { nil: null }),
  isDeleted: fc.boolean(),
});

describe('mapToEntry', () => {
  it('should preserve all fields exactly when mapping model to Entry', () => {
    fc.assert(
      fc.property(modelArb, (model) => {
        const entry = mapToEntry(model as any);

        expect(entry.id).toBe(model.id);
        expect(entry.userId).toBe(model.userId);
        expect(entry.content).toBe(model.content);
        expect(entry.primaryEmotion).toBe(model.primaryEmotion);
        expect(entry.wordCount).toBe(model.wordCount);
        expect(entry.createdAt).toBe(model.createdAt);
        expect(entry.modifiedAt).toBe(model.modifiedAt);
        expect(entry.isDeleted).toBe(model.isDeleted);
      }),
      { numRuns: 100 },
    );
  });

  it('should always produce a valid Emotion type for primaryEmotion', () => {
    fc.assert(
      fc.property(modelArb, (model) => {
        const entry = mapToEntry(model as any);

        expect((EMOTIONS as readonly string[]).includes(entry.primaryEmotion)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('should never mutate the source model fields', () => {
    fc.assert(
      fc.property(modelArb, (model) => {
        const snapshot = { ...model };

        mapToEntry(model as any);

        expect(model.id).toBe(snapshot.id);
        expect(model.userId).toBe(snapshot.userId);
        expect(model.content).toBe(snapshot.content);
        expect(model.primaryEmotion).toBe(snapshot.primaryEmotion);
        expect(model.wordCount).toBe(snapshot.wordCount);
        expect(model.createdAt).toBe(snapshot.createdAt);
        expect(model.modifiedAt).toBe(snapshot.modifiedAt);
        expect(model.isDeleted).toBe(snapshot.isDeleted);
      }),
      { numRuns: 100 },
    );
  });
});
