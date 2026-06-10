import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Pressable } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useEntryStore } from '@/stores/entry-store';
import { entryService } from '@/modules/entries';
import { EntryListItem } from './EntryListItem';
import { EntryForm } from './EntryForm';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { colors, spacing, radii } from '@/theme/tokens';
import { TIER_LIMITS } from '@/shared/types';
import type { Entry } from '@/modules/entries';
import type { Emotion } from '@/shared/types';

interface JournalPanelProps {
  onClose: () => void;
}

type PanelView = 'list' | 'create' | 'edit';

export function JournalPanel({ onClose }: JournalPanelProps) {
  const session = useAuthStore((s) => s.session);
  const tier = useAuthStore((s) => s.tier);
  const entries = useEntryStore((s) => s.entries);
  const createEntry = useEntryStore((s) => s.createEntry);
  const editEntry = useEntryStore((s) => s.editEntry);
  const deleteEntry = useEntryStore((s) => s.deleteEntry);

  const [view, setView] = useState<PanelView>('list');
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [dailyCount, setDailyCount] = useState(0);

  const userId = session?.userId ?? '';
  const dailyLimit = TIER_LIMITS[tier].dailyEntryLimit;

  useEffect(() => {
    setDailyCount(entryService.getDailyEntryCount(new Date().toISOString().split('T')[0]));
  }, []);

  async function handleSubmit(content: string, primaryEmotion: Emotion, secondaryEmotions: Emotion[]) {
    try {
      if (editingEntry) {
        await editEntry(editingEntry.id, content, primaryEmotion, secondaryEmotions, userId, tier);
      } else {
        await createEntry(content, primaryEmotion, secondaryEmotions, userId, tier);
        setDailyCount((c) => c + 1);
      }
      setView('list');
      setEditingEntry(null);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong');
    }
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    try {
      await deleteEntry(deleteTargetId, userId);
      setDeleteTargetId(null);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete entry');
    }
  }

  if (view === 'create' || view === 'edit') {
    return (
      <Pressable style={styles.backdrop} onPress={() => { setView('list'); setEditingEntry(null); }}>
        <Pressable style={styles.sheet}>
          <Text style={styles.title}>{editingEntry ? 'Edit Entry' : 'New Entry'}</Text>
          <EntryForm
            initialEntry={editingEntry ?? undefined}
            tier={tier}
            dailyCount={dailyCount}
            dailyLimit={dailyLimit}
            onSubmit={handleSubmit}
            onCancel={() => { setView('list'); setEditingEntry(null); }}
          />
        </Pressable>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Journal</Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close journal">
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {entries.length === 0 && <Text style={styles.emptyText}>No entries yet. Start writing!</Text>}
          {entries.map((entry) => (
            <EntryListItem
              key={entry.id}
              entry={entry}
              onPress={() => { setEditingEntry(entry); setView('edit'); }}
              onDelete={() => setDeleteTargetId(entry.id)}
            />
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => { setEditingEntry(null); setView('create'); }}
          accessibilityLabel="Create new entry"
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        <DeleteConfirmDialog
          visible={deleteTargetId !== null}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTargetId(null)}
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    maxHeight: '90%',
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeText: {
    fontSize: 20,
    color: colors.textSecondary,
    padding: spacing.xs,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: colors.surface,
    fontSize: 28,
    lineHeight: 32,
  },
});
