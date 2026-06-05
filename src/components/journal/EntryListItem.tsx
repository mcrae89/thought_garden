import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radii } from '@/theme/tokens';
import type { Entry } from '@/modules/entries';

interface EntryListItemProps {
  entry: Entry;
  onPress: () => void;
  onDelete: () => void;
}

export function EntryListItem({ entry, onPress, onDelete }: EntryListItemProps) {
  const date = new Date(entry.createdAt).toLocaleDateString();
  const preview = entry.content.length > 80 ? entry.content.slice(0, 80) + '…' : entry.content;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} accessibilityLabel={`Journal entry from ${date}`}>
      <View style={styles.row}>
        <View style={styles.emotionChip}>
          <Text style={styles.emotionText}>{entry.primaryEmotion}</Text>
        </View>
        <Text style={styles.date}>{date}</Text>
        <TouchableOpacity onPress={onDelete} accessibilityLabel="Delete entry" style={styles.deleteBtn}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.preview}>{preview}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emotionChip: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  emotionText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  deleteText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  preview: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
