import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@tg/core';
import type { Entry } from '@tg/core';
import { fetchEntries } from '@tg/supabase';

export default function JournalScreen() {
  const userId = useAuthStore((s) => s.user?.id);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchEntries(userId).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [userId]);

  // Refetch when screen comes back into focus (e.g. after saving a new entry)
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      fetchEntries(userId).then(setEntries);
    }, [userId])
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/entry/new')}
          accessibilityRole="button"
          accessibilityLabel="New entry"
        >
          <Text style={styles.fabLabel}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <ActivityIndicator color="#4CAF82" style={{ marginTop: 40 }} />
        : <FlatList
            data={entries}
            keyExtractor={(e) => e.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>No entries yet. Write your first one!</Text>}
            renderItem={({ item }) => <EntryRow entry={item} />}
          />
      }
    </View>
  );
}

function EntryRow({ entry }: { entry: Entry }) {
  const date = new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const preview = entry.body.slice(0, 100) + (entry.body.length > 100 ? '…' : '');

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/entry/${entry.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Entry from ${date}`}
    >
      <View style={styles.rowTop}>
        <Text style={styles.date}>{date}</Text>
        {entry.moodPrimary && (
          <Text style={styles.mood}>{entry.moodPrimary.replace('_', ' ')}</Text>
        )}
      </View>
      <Text style={styles.preview}>{preview}</Text>
      {entry.themes.length > 0 && (
        <View style={styles.themes}>
          {entry.themes.slice(0, 3).map((t) => (
            <Text key={t} style={styles.tag}>{t.replace('_', ' ')}</Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#1a2e1a', paddingTop: 56 },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  title:   { color: '#e8f5e9', fontSize: 26, fontWeight: '700' },
  fab:     { backgroundColor: '#4CAF82', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  fabLabel:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  list:    { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  empty:   { color: '#6a8f6a', textAlign: 'center', marginTop: 40, fontSize: 15 },
  row:     { backgroundColor: '#243824', borderRadius: 12, padding: 16, gap: 8 },
  rowTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date:    { color: '#6a8f6a', fontSize: 13 },
  mood:    { color: '#a5d6a7', fontSize: 13, textTransform: 'capitalize' },
  preview: { color: '#e8f5e9', fontSize: 15, lineHeight: 22 },
  themes:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag:     { backgroundColor: '#1a2e1a', color: '#6a8f6a', fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, textTransform: 'capitalize' },
});
