import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import type { Entry } from '@tg/core';
import { fetchEntry } from '@tg/supabase';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchEntry(id).then((data) => {
      setEntry(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#4CAF82" size="large" />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.root}>
        <Text style={styles.error}>Entry not found.</Text>
      </View>
    );
  }

  const date = new Date(entry.createdAt).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.inner}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.date}>{date}</Text>

      {entry.moodPrimary && (
        <View style={styles.moodRow}>
          <Text style={styles.moodLabel}>Mood</Text>
          <Text style={styles.mood}>{entry.moodPrimary.replace('_', ' ')}</Text>
          {entry.moodSecondary && (
            <Text style={styles.moodSecondary}> · {entry.moodSecondary.replace('_', ' ')}</Text>
          )}
        </View>
      )}

      {entry.themes.length > 0 && (
        <View style={styles.themes}>
          {entry.themes.map((t) => (
            <Text key={t} style={styles.tag}>{t.replace('_', ' ')}</Text>
          ))}
        </View>
      )}

      <Text style={styles.body}>{entry.body}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#1a2e1a' },
  inner:         { padding: 24, gap: 16 },
  back:          { marginBottom: 8 },
  backText:      { color: '#4CAF82', fontSize: 15 },
  date:          { color: '#6a8f6a', fontSize: 14 },
  moodRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  moodLabel:     { color: '#6a8f6a', fontSize: 13 },
  mood:          { color: '#a5d6a7', fontSize: 14, textTransform: 'capitalize', fontWeight: '600' },
  moodSecondary: { color: '#6a8f6a', fontSize: 13, textTransform: 'capitalize' },
  themes:        { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag:           { backgroundColor: '#243824', color: '#6a8f6a', fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, textTransform: 'capitalize' },
  body:          { color: '#e8f5e9', fontSize: 16, lineHeight: 26 },
  error:         { color: '#ef9a9a', padding: 24 },
});
