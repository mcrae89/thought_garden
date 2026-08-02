import type { Emotion } from './types';

export type PlantCategory = 'crop' | 'tree' | 'berry';

export interface PlantInfo {
  readonly name: string;
  readonly category: PlantCategory;
  readonly spriteKey: string;
}

export const EMOTION_TO_PLANT: Record<Emotion, PlantInfo> = {
  // Crops (14)
  happy: { name: 'Star Fruit', category: 'crop', spriteKey: 'star_fruit' },
  sad: { name: 'Eggplant', category: 'crop', spriteKey: 'eggplant' },
  angry: { name: 'Corn', category: 'crop', spriteKey: 'corn' },
  anxious: { name: 'Carrot', category: 'crop', spriteKey: 'carrot' },
  calm: { name: 'Wheat', category: 'crop', spriteKey: 'wheat' },
  grateful: { name: 'Cauliflower', category: 'crop', spriteKey: 'cauliflower' },
  love: { name: 'Tomato', category: 'crop', spriteKey: 'tomato' },
  excited: { name: 'Pumpkin', category: 'crop', spriteKey: 'pumpkin' },
  lonely: { name: 'Parsnip', category: 'crop', spriteKey: 'parsnip' },
  confused: { name: 'Blue Kale', category: 'crop', spriteKey: 'blue_kale' },
  inspired: { name: 'Leafy Greens', category: 'crop', spriteKey: 'leafy_greens' },
  frustrated: { name: 'Radish', category: 'crop', spriteKey: 'radish' },
  content: { name: 'Cucumber', category: 'crop', spriteKey: 'cucumber' },
  overwhelmed: { name: 'Purple Cabbage', category: 'crop', spriteKey: 'purple_cabbage' },
  // Fruit Trees (4)
  hope: { name: 'Apple Tree', category: 'tree', spriteKey: 'apple_tree' },
  proud: { name: 'Orange Tree', category: 'tree', spriteKey: 'orange_tree' },
  brave: { name: 'Peach Tree', category: 'tree', spriteKey: 'peach_tree' },
  determined: { name: 'Pear Tree', category: 'tree', spriteKey: 'pear_tree' },
  // Berry Bushes (3)
  peaceful: { name: 'Blueberry Bush', category: 'berry', spriteKey: 'blueberry' },
  curious: { name: 'Purple Berry Bush', category: 'berry', spriteKey: 'purple_berry' },
  compassionate: { name: 'Red Berry Bush', category: 'berry', spriteKey: 'red_berry' },
};
