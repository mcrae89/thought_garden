/**
 * Feature: thought-garden, Property 2: Emotion selection validation
 */
import fc from 'fast-check';
import { validateEmotions } from '@/modules/entries/entry-service';
import { EMOTIONS } from '@/shared/types';

jest.mock('@/database', () => ({ database: {} }));

describe('validateEmotions property tests', () => {
  it('should accept valid primary emotion with no secondaries', () => {
    fc.assert(
      fc.property(fc.constantFrom(...EMOTIONS), (primary) => {
        expect(validateEmotions(primary, []).success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('should accept valid primary with valid secondaries that exclude primary', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS).chain((primary) =>
          fc
            .array(fc.constantFrom(...EMOTIONS.filter((e) => e !== primary)), { minLength: 1, maxLength: 5 })
            .map((secondaries) => ({ primary, secondaries })),
        ),
        ({ primary, secondaries }) => {
          expect(validateEmotions(primary, secondaries).success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should reject when secondary emotion equals primary', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS).map((e) => ({ primary: e, secondaries: [e] })),
        ({ primary, secondaries }) => {
          expect(validateEmotions(primary, secondaries).success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should reject invalid primary emotion (not in EMOTIONS set)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !(EMOTIONS as readonly string[]).includes(s)),
        (s) => {
          expect(validateEmotions(s as any, []).success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should reject when any secondary is not in EMOTIONS set', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS).chain((primary) =>
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => !(EMOTIONS as readonly string[]).includes(s))
            .map((invalid) => ({ primary, invalid })),
        ),
        ({ primary, invalid }) => {
          expect(validateEmotions(primary, [invalid] as any).success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
