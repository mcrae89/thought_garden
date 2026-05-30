import type { Emotion, GrowthStage } from '@/shared/types';

export interface ColorPalette {
  readonly primary: string;
  readonly secondary: string;
  readonly highlight: string;
  readonly shadow: string;
}

export interface SpriteData {
  readonly uri: string;
  readonly frameIndex: number;
  readonly width: 32;
  readonly height: 32;
}

export interface PlantVisualService {
  getPlantSprite(emotion: Emotion, stage: GrowthStage, colorVariation: Emotion | null, location?: 'garden' | 'greenhouse'): SpriteData;
  getPalette(emotion: Emotion): ColorPalette;
  getDefaultPalette(emotion: Emotion): ColorPalette;
}

export { EMOTION_PALETTES } from './emotion-palettes';
export { getSpritePath, getFrameIndex, resolveColorVariation, plantVisualService } from './plant-visual-service';
export { applyPaletteSwap, isSamePalette } from './palette-swap';
