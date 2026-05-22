import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useGardenStore } from '@tg/core';
import type { Plant, Seed } from '@tg/core';
import { GardenPlot } from '../../src/components/garden/GardenGrid';
import { SeedPicker } from '../../src/components/garden/SeedPicker';
import { PlantOptions } from '../../src/components/garden/PlantOptions';

// Parse "4x4" → { cols: 4, rows: 4 }
function parseGrid(size: string): { cols: number; rows: number } {
  const [cols, rows] = size.split('x').map(Number);
  return { cols: cols ?? 4, rows: rows ?? 4 };
}

export default function GardenScreen() {
  const { width } = useWindowDimensions();
  const { config, plants, seeds, plantSeed, movePlant, moveToGreenhouse } = useGardenStore();

  const gridSize = config?.gardenGridSize ?? '4x4';
  const { cols, rows } = parseGrid(gridSize);
  // Cell size fits grid with padding
  const cellSize = Math.floor((width - 32 - cols * 6) / cols);

  const [pendingPlot, setPendingPlot] = useState<{ x: number; y: number } | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  // Build a lookup: "x,y" → Plant
  const plotMap = new Map<string, Plant>(
    plants
      .filter((p) => p.location === 'garden' && p.gardenPositionX != null)
      .map((p) => [`${p.gardenPositionX},${p.gardenPositionY}`, p])
  );

  const handlePressEmpty = useCallback((x: number, y: number) => {
    setPendingPlot({ x, y });
  }, []);

  const handleSeedSelect = useCallback((seed: Seed) => {
    if (!pendingPlot) return;
    plantSeed(seed.id, pendingPlot.x, pendingPlot.y);
    setPendingPlot(null);
  }, [pendingPlot, plantSeed]);

  const handleMoveToGreenhouse = useCallback((plant: Plant) => {
    moveToGreenhouse(plant.id);
  }, [moveToGreenhouse]);

  const inventorySeeds = seeds.filter((s) => s.location === 'inventory');

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Your Garden</Text>
      <Text style={styles.sub}>{gridSize} · {plants.filter(p => p.location === 'garden').length} plants</Text>

      <ScrollView contentContainerStyle={styles.gridWrap}>
        {Array.from({ length: rows }, (_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: cols }, (_, col) => {
              const plant = plotMap.get(`${col},${row}`) ?? null;
              return (
                <GardenPlot
                  key={`${col},${row}`}
                  plant={plant}
                  cellSize={cellSize}
                  onPressEmpty={() => handlePressEmpty(col, row)}
                  onLongPressPlant={setSelectedPlant}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>

      <SeedPicker
        seeds={inventorySeeds}
        visible={!!pendingPlot}
        onSelect={handleSeedSelect}
        onClose={() => setPendingPlot(null)}
      />

      <PlantOptions
        plant={selectedPlant}
        onMoveToGreenhouse={handleMoveToGreenhouse}
        onClose={() => setSelectedPlant(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#1a2e1a', paddingTop: 56 },
  title:    { color: '#e8f5e9', fontSize: 26, fontWeight: '700', paddingHorizontal: 16 },
  sub:      { color: '#6a8f6a', fontSize: 13, marginTop: 4, marginBottom: 16, paddingHorizontal: 16 },
  gridWrap: { paddingHorizontal: 16, paddingBottom: 32 },
  row:      { flexDirection: 'row' },
});
