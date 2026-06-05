import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useNotificationStore } from '@/stores/notification-store';
import { colors, spacing, radii } from '@/theme/tokens';

export function AchievementToast() {
  const notifications = useNotificationStore((s) => s.notifications);
  const dismissCurrent = useNotificationStore((s) => s.dismissCurrent);
  const opacity = useRef(new Animated.Value(0)).current;

  const current = notifications[0] ?? null;

  useEffect(() => {
    if (!current) return;

    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => dismissCurrent());
  }, [current?.achievementKey]);

  if (!current) return null;

  const seedImageUri = `assets/sprites/seeds/${current.seedEmotion}-seeds.png`;

  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Image
        source={{ uri: seedImageUri }}
        style={styles.seedImage}
        contentFit="contain"
        accessibilityLabel={`${current.seedEmotion} seed`}
      />
      <View style={styles.textContainer}>
        <Text style={styles.achievementType}>{current.achievementType}</Text>
        <Text style={styles.seedEmotion}>{current.seedEmotion}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  seedImage: {
    width: 48,
    height: 48,
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  achievementType: {
    fontWeight: 'bold',
    color: colors.text,
    fontSize: 14,
  },
  seedEmotion: {
    color: colors.primary,
    fontSize: 12,
  },
});
