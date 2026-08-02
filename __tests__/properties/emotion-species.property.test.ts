import * as fc from 'fast-check';
import { getSpritePath } from '@/modules/plant-visuals/plant-visual-service';
import { EMOTIONS } from '@/shared/types';
import { EMOTION_TO_PLANT } from '@/shared/constants';

/**
 * Feature: thought-garden, Property 21: Emotion-to-species bijection
 */
describe('Property 21: Emotion-to-species bijection', () => {
  it('should map each emotion to a distinct sprite path', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.constantFrom(...EMOTIONS), { minLength: 2, maxLength: 2 }),
        (emotions) => {
          return getSpritePath(emotions[0], 'garden') !== getSpritePath(emotions[1], 'garden');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should produce deterministic paths (same emotion always same path)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        (e) => {
          return getSpritePath(e, 'garden') === getSpritePath(e, 'garden');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should include the spriteKey in path', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EMOTIONS),
        (e) => {
          const plantInfo = EMOTION_TO_PLANT[e];
          return getSpritePath(e, 'garden').includes(plantInfo.spriteKey);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should map each emotion to a unique plant name', () => {
    const names = EMOTIONS.map((e) => EMOTION_TO_PLANT[e].name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(EMOTIONS.length);
  });
});
