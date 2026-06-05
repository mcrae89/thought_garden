import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { EMOTIONS } from '@/shared/types';
import { colors, spacing, radii } from '@/theme/tokens';
import type { Emotion, Tier } from '@/shared/types';
import type { Entry } from '@/modules/entries';

const MAX_CHARS = 10_000;

interface EntryFormProps {
  initialEntry?: Entry;
  tier: Tier;
  dailyCount: number;
  dailyLimit: number;
  onSubmit: (content: string, primaryEmotion: Emotion, secondaryEmotions: Emotion[]) => void;
  onCancel: () => void;
}

export function EntryForm({ initialEntry, tier, dailyCount, dailyLimit, onSubmit, onCancel }: EntryFormProps) {
  const [content, setContent] = useState(initialEntry?.content ?? '');
  const [primaryEmotion, setPrimaryEmotion] = useState<Emotion | null>(initialEntry?.primaryEmotion ?? null);
  const [secondaryEmotions, setSecondaryEmotions] = useState<Emotion[]>(
    initialEntry ? [...initialEntry.secondaryEmotions] : [],
  );

  const atDailyLimit = tier === 'free' && dailyCount >= dailyLimit && !initialEntry;
  const canSubmit = content.trim().length > 0 && primaryEmotion !== null && !atDailyLimit;

  function toggleSecondary(emotion: Emotion) {
    if (emotion === primaryEmotion) return;
    setSecondaryEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion],
    );
  }

  function handleSubmit() {
    if (!canSubmit || !primaryEmotion) return;
    onSubmit(content, primaryEmotion, secondaryEmotions);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {atDailyLimit && (
        <Text style={styles.limitMessage}>
          You've reached your daily entry limit ({dailyLimit}). Upgrade to continue writing.
        </Text>
      )}

      <TextInput
        style={styles.textInput}
        value={content}
        onChangeText={(t) => setContent(t.slice(0, MAX_CHARS))}
        placeholder="What's on your mind?"
        multiline
        maxLength={MAX_CHARS}
        accessibilityLabel="Journal entry content"
      />
      <Text style={styles.charCount}>{content.length}/{MAX_CHARS}</Text>

      <Text style={styles.sectionLabel}>Primary Emotion (required)</Text>
      <View style={styles.emotionGrid}>
        {EMOTIONS.map((emotion) => (
          <TouchableOpacity
            key={emotion}
            style={[styles.emotionButton, primaryEmotion === emotion && styles.emotionButtonSelected]}
            onPress={() => {
              setPrimaryEmotion(emotion);
              setSecondaryEmotions((prev) => prev.filter((e) => e !== emotion));
            }}
            accessibilityLabel={`Select ${emotion} as primary emotion`}
          >
            <Text style={[styles.emotionButtonText, primaryEmotion === emotion && styles.emotionButtonTextSelected]}>
              {emotion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {primaryEmotion && (
        <>
          <Text style={styles.sectionLabel}>Secondary Emotions (optional)</Text>
          <View style={styles.emotionGrid}>
            {EMOTIONS.filter((e) => e !== primaryEmotion).map((emotion) => (
              <TouchableOpacity
                key={emotion}
                style={[styles.emotionButton, secondaryEmotions.includes(emotion) && styles.emotionButtonSecondary]}
                onPress={() => toggleSecondary(emotion)}
                accessibilityLabel={`Toggle ${emotion} secondary emotion`}
              >
                <Text style={[styles.emotionButtonText, secondaryEmotions.includes(emotion) && styles.emotionButtonTextSelected]}>
                  {emotion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} accessibilityLabel="Cancel">
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityLabel="Save entry"
        >
          <Text style={styles.submitText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  limitMessage: {
    color: colors.error,
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: radii.md,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 120,
    color: colors.text,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: -spacing.sm,
  },
  sectionLabel: {
    fontWeight: '600',
    color: colors.text,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  emotionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  emotionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emotionButtonSecondary: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  emotionButtonText: {
    fontSize: 12,
    color: colors.text,
  },
  emotionButtonTextSelected: {
    color: colors.surface,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelButton: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.text,
  },
  submitButton: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.surface,
    fontWeight: '600',
  },
});
