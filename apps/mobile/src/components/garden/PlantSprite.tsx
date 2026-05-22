import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
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
  /** Pass true when this render is the moment of bloom (stage just became 3+) */
  justBloomed?: boolean;
}

export function PlantSprite({ stage, color, size, justBloomed }: PlantSpriteProps) {
  const fontSize = size ?? STAGE_SIZE[stage];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!justBloomed) return;
    // Bloom: scale up then spring back, with a fade-in from 0
    opacity.value = 0;
    scale.value = 0.5;
    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withSequence(
      withTiming(1.4, { duration: 300 }),
      withSpring(1, { damping: 6, stiffness: 120 }),
    );
  }, [justBloomed]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.root, { backgroundColor: color + '33' }, animStyle]}>
      <Animated.Text style={{ fontSize }} accessibilityLabel={`Growth stage ${stage}`}>
        {STAGE_EMOJI[stage]}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: 8, alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
});
