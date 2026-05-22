// SeedPicker — bottom sheet listing inventory seeds to plant in a chosen plot.
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import type { Seed } from '@tg/core';

interface SeedPickerProps {
  seeds: Seed[];
  visible: boolean;
  onSelect: (seed: Seed) => void;
  onClose: () => void;
}

export function SeedPicker({ seeds, visible, onSelect, onClose }: SeedPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <Text style={styles.title}>Choose a seed to plant</Text>
        {seeds.length === 0 && (
          <Text style={styles.empty}>No seeds in inventory yet. Write journal entries to earn seeds!</Text>
        )}
        <FlatList
          data={seeds}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => onSelect(item)}
              accessibilityRole="button"
              accessibilityLabel={`Plant ${item.plantSpecies} seed`}
            >
              <View style={[styles.dot, { backgroundColor: item.colorPrimary }]} />
              <View>
                <Text style={styles.species}>{item.plantSpecies.replace('_', ' ')}</Text>
                {item.isRare && <Text style={styles.rare}>✦ Rare</Text>}
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000066' },
  sheet:    { backgroundColor: '#1a2e1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '60%' },
  title:    { color: '#e8f5e9', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  empty:    { color: '#6a8f6a', fontSize: 14, lineHeight: 20 },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2d4a2d' },
  dot:      { width: 20, height: 20, borderRadius: 10 },
  species:  { color: '#e8f5e9', fontSize: 15, textTransform: 'capitalize' },
  rare:     { color: '#ffd700', fontSize: 12, marginTop: 2 },
});
