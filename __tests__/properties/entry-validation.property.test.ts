// Feature: thought-garden, Property 1: Entry content validation
import fc from 'fast-check';

jest.mock('@/database', () => ({ database: {} }));

import { validateEntryContent } from '@/modules/entries/entry-service';

describe('validateEntryContent', () => {
  it('should accept any string with at least one non-whitespace char and length <= 10000', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10000 }).filter((s) => s.trim().length > 0),
        (content) => {
          const result = validateEntryContent(content);

          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should reject empty string', () => {
    const result = validateEntryContent('');

    expect(result.success).toBe(false);
  });

  it('should reject whitespace-only strings', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 100 }).map((a) => a.join('')),
        (content) => {
          const result = validateEntryContent(content);

          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should reject strings exceeding 10000 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10001, maxLength: 15000 }),
        (content) => {
          const result = validateEntryContent(content);

          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should accept strings of exactly 10000 characters with non-whitespace content', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 9999, maxLength: 9999 }).map((s) => s + 'x'),
        (content) => {
          const result = validateEntryContent(content);

          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
