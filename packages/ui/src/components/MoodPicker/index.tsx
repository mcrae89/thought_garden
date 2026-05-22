import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Mood } from '@tg/core';
import { MOODS } from '@tg/core';

interface MoodPickerProps {
  selected: Mood | null;
  onSelect: (mood: Mood) => void;
}

export function MoodPicker({ selected, onSelect }: MoodPickerProps) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Mood picker">
      {MOODS.map(({ mood }) => (
        <TouchableOpacity
          key={mood}
          onPress={() => onSelect(mood)}
          style={[styles.chip, selected === mood && styles.selected]}
          accessibilityRole="radio"
          accessibilityLabel={mood}
          accessibilityState={{ checked: selected === mood }}
        >
          <Text style={[styles.label, selected === mood && styles.selectedLabel]}>
            {mood.replace('_', ' ')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#f5f5f5' },
  selected:      { backgroundColor: '#4CAF82', borderColor: '#4CAF82' },
  label:         { fontSize: 13, color: '#444', textTransform: 'capitalize' },
  selectedLabel: { color: '#fff', fontWeight: '600' },
});
