import type { Emotion } from '@/shared/types';
import type { ColorPalette } from './index';

export const EMOTION_PALETTES: Record<Emotion, ColorPalette> = {
  happy: { primary: '#FFD700', secondary: '#FFA500', highlight: '#FFFACD', shadow: '#B8860B' },
  sad: { primary: '#4682B4', secondary: '#5F9EA0', highlight: '#B0C4DE', shadow: '#2F4F4F' },
  angry: { primary: '#DC143C', secondary: '#8B0000', highlight: '#FF6347', shadow: '#4B0000' },
  anxious: { primary: '#9370DB', secondary: '#6A5ACD', highlight: '#E6E6FA', shadow: '#483D8B' },
  calm: { primary: '#98D8C8', secondary: '#7FB3A0', highlight: '#E0F5EE', shadow: '#4A7A6A' },
  grateful: { primary: '#DDA0DD', secondary: '#BA55D3', highlight: '#F5E6F5', shadow: '#6B2D6B' },
  love: { primary: '#FF69B4', secondary: '#C71585', highlight: '#FFB6C1', shadow: '#8B0A50' },
  hope: { primary: '#FAFAD2', secondary: '#F0E68C', highlight: '#FFFFF0', shadow: '#BDB76B' },
  excited: { primary: '#FF4500', secondary: '#FF8C00', highlight: '#FFD700', shadow: '#B22222' },
  lonely: { primary: '#708090', secondary: '#778899', highlight: '#C0C0C0', shadow: '#2F4F4F' },
  proud: { primary: '#800080', secondary: '#9400D3', highlight: '#DA70D6', shadow: '#4B0082' },
  confused: { primary: '#BC8F8F', secondary: '#D2B48C', highlight: '#F5DEB3', shadow: '#8B7355' },
  peaceful: { primary: '#F0E6FF', secondary: '#D8BFD8', highlight: '#FFFFFF', shadow: '#9370DB' },
  inspired: { primary: '#4169E1', secondary: '#6495ED', highlight: '#87CEEB', shadow: '#191970' },
  curious: { primary: '#FF6F61', secondary: '#E55B50', highlight: '#FFAB91', shadow: '#B71C1C' },
  frustrated: { primary: '#8B4513', secondary: '#A0522D', highlight: '#D2691E', shadow: '#3E1A00' },
  content: { primary: '#F5DEB3', secondary: '#DEB887', highlight: '#FFFAF0', shadow: '#8B7D6B' },
  overwhelmed: { primary: '#2E8B57', secondary: '#3CB371', highlight: '#98FB98', shadow: '#004D25' },
  brave: { primary: '#DAA520', secondary: '#B8860B', highlight: '#FFD700', shadow: '#6B4E00' },
  determined: { primary: '#2E7D32', secondary: '#388E3C', highlight: '#81C784', shadow: '#1B5E20' },
  compassionate: { primary: '#66BB6A', secondary: '#4CAF50', highlight: '#A5D6A7', shadow: '#2E7D32' },
} as const;
