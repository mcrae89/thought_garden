// PlantSprite — renders a plant as a colored emoji placeholder.
// Post-MVP: swap View+Text for an <Image> sprite sheet.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { GrowthStage } from '@tg/core';

const STAGE_EMOJI: Record<GrowthStage, string> = {
  1: '🌱',
  2: '🌿',
  3: '🌸',
  4: '✨',
};

const STAGE_SIZE: Record<GrowthStage, number> = {
  1: 18,
  2: 22,
  3: 28,
  4: 32,
};

interface PlantSpriteProps {
  stage: GrowthStage;
  color: string;
  size?: number;
}

export function PlantSprite({ stage, color, size }: PlantSpriteProps) {
  const fontSize = size ?? STAGE_SIZE[stage];
  return (
    <View style={[styles.root, { backgroundColor: color + '33' }]}>
      <Text style={{ fontSize }} accessibilityLabel={`Growth stage ${stage}`}>
        {STAGE_EMOJI[stage]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: 8, alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
});
