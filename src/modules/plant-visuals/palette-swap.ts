import type { ColorPalette } from './index';

export function applyPaletteSwap(
  basePalette: ColorPalette,
  targetPalette: ColorPalette,
): Record<string, string> {
  return {
    [basePalette.primary]: targetPalette.primary,
    [basePalette.secondary]: targetPalette.secondary,
    [basePalette.highlight]: targetPalette.highlight,
    [basePalette.shadow]: targetPalette.shadow,
  };
}

export function isSamePalette(a: ColorPalette, b: ColorPalette): boolean {
  return a.primary === b.primary
    && a.secondary === b.secondary
    && a.highlight === b.highlight
    && a.shadow === b.shadow;
}
