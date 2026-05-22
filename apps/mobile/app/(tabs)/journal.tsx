import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function JournalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Journal</Text>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/entry/new')}
        accessibilityRole="button"
        accessibilityLabel="New entry"
      >
        <Text style={styles.fabLabel}>+ New Entry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a2e1a', alignItems: 'center', justifyContent: 'center' },
  title:     { color: '#e8f5e9', fontSize: 28, fontWeight: '700' },
  fab:       { marginTop: 24, backgroundColor: '#4CAF82', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 32 },
  fabLabel:  { color: '#fff', fontWeight: '700', fontSize: 16 },
});
