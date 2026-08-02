import { View, Image } from 'react-native';
import type { Plant } from '@/modules/garden';
import { EMOTION_TO_PLANT } from '@/shared/constants';

const CROP_FRAME = 16;
const CROP_SHEET_WIDTH = 64; // 4 columns × 16px
const CROP_SHEET_HEIGHT = 240;

const TREES_SHEET_WIDTH = 192;
const TREES_SHEET_HEIGHT = 112;

const STAGE_COL: Record<string, number> = { seed: 0, sprout: 1, full: 2, bloom: 3 };

const FARMING_PLANTS_SHEET = require('../../../assets/sprites/objects/items/Farming Plants.png');
const TREES_BUSHES_SHEET = require('../../../assets/sprites/objects/trees/Trees, stumps and bushes.png');

// Row index in Farming Plants.png (16px per row, corn uses rows 0-1 = 32px)
const CROP_ROW: Record<string, { row: number; tall?: boolean }> = {
  corn: { row: 0, tall: true },
  carrot: { row: 2 },
  cauliflower: { row: 3 },
  tomato: { row: 4 },
  eggplant: { row: 5 },
  blue_kale: { row: 6 },
  leafy_greens: { row: 7 },
  wheat: { row: 8 },
  pumpkin: { row: 9 },
  parsnip: { row: 10 },
  purple_cabbage: { row: 11 },
  radish: { row: 12 },
  star_fruit: { row: 13 },
  cucumber: { row: 14 },
};

// Trees and bushes from "Trees, stumps and bushes.png" (192x112, 16px grid: 12 cols × 7 rows)
// Trees are 2×2 tiles (32×32px), bushes are 1×1 tiles (16×16px)
// Bare tree: row 0-1, col 1-2. Fruited trees at col 3-4, 5-6, 7-8, 9-10
// Bare bush: row 3, col 1. Berry bushes at row 3, cols 2-4
const TILE = 16;
const TREE_BUSH_SPRITES: Record<string, { bareX: number; bareY: number; fruitX: number; fruitY: number; width: number; height: number }> = {
  apple_tree:   { bareX: 1 * TILE, bareY: 0, fruitX: 3 * TILE, fruitY: 0, width: 32, height: 32 },
  orange_tree:  { bareX: 1 * TILE, bareY: 0, fruitX: 5 * TILE, fruitY: 0, width: 32, height: 32 },
  pear_tree:    { bareX: 1 * TILE, bareY: 0, fruitX: 7 * TILE, fruitY: 0, width: 32, height: 32 },
  peach_tree:   { bareX: 1 * TILE, bareY: 0, fruitX: 9 * TILE, fruitY: 0, width: 32, height: 32 },
  red_berry:    { bareX: 1 * TILE, bareY: 3 * TILE, fruitX: 2 * TILE, fruitY: 3 * TILE, width: 16, height: 16 },
  purple_berry: { bareX: 1 * TILE, bareY: 3 * TILE, fruitX: 3 * TILE, fruitY: 3 * TILE, width: 16, height: 16 },
  blueberry:    { bareX: 1 * TILE, bareY: 3 * TILE, fruitX: 4 * TILE, fruitY: 3 * TILE, width: 16, height: 16 },
};

export function PlantSprite({ plant }: { plant: Plant }) {
  const plantInfo = EMOTION_TO_PLANT[plant.emotion];

  // Guard against plants with old/removed emotion values in local DB
  if (!plantInfo) return null;

  // Trees and berry bushes: bare until bloom, then fruited
  if (plantInfo.category === 'tree' || plantInfo.category === 'berry') {
    const sprites = TREE_BUSH_SPRITES[plantInfo.spriteKey];
    if (!sprites) return null;

    const isFruited = plant.growthStage === 'bloom';
    const sx = isFruited ? sprites.fruitX : sprites.bareX;
    const sy = isFruited ? sprites.fruitY : sprites.bareY;

    return (
      <View style={{ width: sprites.width, height: sprites.height, overflow: 'hidden' }} accessibilityLabel={`${plant.emotion} ${plantInfo.name}, ${plant.growthStage} stage`}>
        <Image
          source={TREES_BUSHES_SHEET}
          style={{
            width: TREES_SHEET_WIDTH,
            height: TREES_SHEET_HEIGHT,
            marginLeft: -sx,
            marginTop: -sy,
          }}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Crops use the Farming Plants spritesheet
  const cropInfo = CROP_ROW[plantInfo.spriteKey];
  if (!cropInfo) return null;

  const col = STAGE_COL[plant.growthStage] ?? 0;
  const isTall = cropInfo.tall === true;
  const frameHeight = isTall ? CROP_FRAME * 2 : CROP_FRAME;

  return (
    <View style={{ width: CROP_FRAME, height: frameHeight, overflow: 'hidden' }} accessibilityLabel={`${plant.emotion} ${plantInfo.name}, ${plant.growthStage} stage`}>
      <Image
        source={FARMING_PLANTS_SHEET}
        style={{
          width: CROP_SHEET_WIDTH,
          height: CROP_SHEET_HEIGHT,
          marginLeft: -col * CROP_FRAME,
          marginTop: -cropInfo.row * CROP_FRAME,
        }}
        resizeMode="cover"
      />
    </View>
  );
}
