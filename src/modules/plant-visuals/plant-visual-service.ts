import type { Emotion, GrowthStage } from '@/shared/types';
import { EMOTION_TO_PLANT } from '@/shared/constants';
import { EMOTION_PALETTES } from './emotion-palettes';
import type { ColorPalette, PlantVisualService, SpriteData } from './index';

export function getSpritePath(emotion: Emotion, _location: 'garden' | 'greenhouse' = 'garden'): string {
  const plant = EMOTION_TO_PLANT[emotion];
  return `assets/sprites/objects/${plant.category === 'tree' ? 'trees' : 'items'}/${plant.spriteKey}.png`;
}

export function getFrameIndex(stage: GrowthStage): number {
  const map: Record<GrowthStage, number> = { seed: 0, sprout: 1, full: 2, bloom: 3 };
  return map[stage];
}

export function resolveColorVariation(colorVariation: Emotion | null): Emotion | null {
  return colorVariation;
}

class PlantVisualServiceImpl implements PlantVisualService {
  getPlantSprite(emotion: Emotion, stage: GrowthStage, _colorVariation: Emotion | null, location: 'garden' | 'greenhouse' = 'garden'): SpriteData {
    return {
      uri: getSpritePath(emotion, location),
      frameIndex: getFrameIndex(stage),
      width: 32,
      height: 32,
    };
  }

  getPalette(emotion: Emotion): ColorPalette {
    return EMOTION_PALETTES[emotion];
  }

  getDefaultPalette(emotion: Emotion): ColorPalette {
    return EMOTION_PALETTES[emotion];
  }
}

export const plantVisualService: PlantVisualService = new PlantVisualServiceImpl();
