// PlantOptions — action sheet shown on long-press of a planted plant.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import type { Plant } from '@tg/core';

interface PlantOptionsProps {
  plant: Plant | null;
  onMoveToGreenhouse: (plant: Plant) => void;
  onClose: () => void;
}

export function PlantOptions({ plant, onMoveToGreenhouse, onClose }: PlantOptionsProps) {
  if (!plant) return null;
  return (
    <Modal visible={!!plant} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{plant.species.replace('_', ' ')}</Text>
        <Text style={styles.sub}>Stage {plant.growthStage} · {plant.wateringCount} waterings</Text>
        <TouchableOpacity
          style={styles.option}
          onPress={() => { onMoveToGreenhouse(plant); onClose(); }}
          accessibilityRole="button"
          accessibilityLabel="Move to greenhouse"
        >
          <Text style={styles.optionText}>🏡  Move to greenhouse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.option, styles.cancel]} onPress={onClose}>
          <Text style={[styles.optionText, { color: '#6a8f6a' }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000066' },
  sheet:    { backgroundColor: '#1a2e1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  title:    { color: '#e8f5e9', fontSize: 18, fontWeight: '700', textTransform: 'capitalize' },
  sub:      { color: '#6a8f6a', fontSize: 13, marginTop: 4, marginBottom: 20 },
  option:   { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2d4a2d' },
  cancel:   { borderBottomWidth: 0, marginTop: 4 },
  optionText: { color: '#e8f5e9', fontSize: 16 },
});
