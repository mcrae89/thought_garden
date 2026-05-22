// GardenPlot — a single cell in the grid.
// States: empty (tap to plant/drop), occupied-normal (long-press for options),
//         occupied-dragging (highlighted as the plant being moved),
//         empty-droppable (highlighted as a valid drop target).
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import type { Plant, GrowthStage } from '@tg/core';
import { PlantSprite } from './PlantSprite';

interface GardenPlotProps {
  plant: Plant | null;
  onPressEmpty: () => void;
  onLongPressPlant: (plant: Plant) => void;
  cellSize: number;
  isDragging?: boolean;   // this cell's plant is being dragged
  isDropTarget?: boolean; // this empty cell is a valid drop target
}

export function GardenPlot({
  plant,
  onPressEmpty,
  onLongPressPlant,
  cellSize,
  isDragging,
  isDropTarget,
}: GardenPlotProps) {
  const cellStyle = [
    styles.cell,
    { width: cellSize, height: cellSize },
    isDragging && styles.dragging,
    isDropTarget && styles.dropTarget,
  ];

  return (
    <TouchableOpacity
      style={cellStyle}
      onPress={plant ? undefined : onPressEmpty}
      onLongPress={plant ? () => onLongPressPlant(plant) : undefined}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={plant ? `${plant.species}, stage ${plant.growthStage}` : 'Empty plot'}
    >
      {plant && !isDragging && (
        <PlantSprite stage={plant.growthStage as GrowthStage} color={plant.colorPrimary} />
      )}
      {isDragging && <View style={styles.dragPlaceholder} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell:            { borderWidth: 1, borderColor: '#2d4a2d', borderRadius: 8, backgroundColor: '#1e3a1e', margin: 3, overflow: 'hidden' },
  dragging:        { borderColor: '#4CAF82', borderWidth: 2, backgroundColor: '#243824', opacity: 0.5 },
  dropTarget:      { borderColor: '#4CAF82', borderWidth: 2, borderStyle: 'dashed', backgroundColor: '#1e3a2e' },
  dragPlaceholder: { flex: 1, margin: 8, borderRadius: 6, backgroundColor: '#4CAF8244' },
});
