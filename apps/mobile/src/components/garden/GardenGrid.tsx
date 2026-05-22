// GardenPlot — a single cell in the grid.
// Empty: tappable to open seed picker. Occupied: shows plant, long-press for options.
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import type { Plant, GrowthStage } from '@tg/core';
import { PlantSprite } from './PlantSprite';

interface GardenPlotProps {
  plant: Plant | null;
  onPressEmpty: () => void;
  onLongPressPlant: (plant: Plant) => void;
  cellSize: number;
}

export function GardenPlot({ plant, onPressEmpty, onLongPressPlant, cellSize }: GardenPlotProps) {
  return (
    <TouchableOpacity
      style={[styles.cell, { width: cellSize, height: cellSize }]}
      onPress={plant ? undefined : onPressEmpty}
      onLongPress={plant ? () => onLongPressPlant(plant) : undefined}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={plant ? `${plant.species}, stage ${plant.growthStage}` : 'Empty plot'}
    >
      {plant && (
        <PlantSprite
          stage={plant.growthStage as GrowthStage}
          color={plant.colorPrimary}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderWidth: 1,
    borderColor: '#2d4a2d',
    borderRadius: 8,
    backgroundColor: '#1e3a1e',
    margin: 3,
    overflow: 'hidden',
  },
});
