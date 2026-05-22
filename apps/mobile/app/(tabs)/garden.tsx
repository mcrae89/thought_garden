import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useGardenStore, useAuthStore } from '@tg/core';
import type { Plant, Seed } from '@tg/core';
import { loadGardenState } from '@tg/supabase';
import { GardenPlot } from '../../src/components/garden/GardenGrid';
import { SeedPicker } from '../../src/components/garden/SeedPicker';
import { PlantOptions } from '../../src/components/garden/PlantOptions';

function parseGrid(size: string): { cols: number; rows: number } {
  const [cols, rows] = size.split('x').map(Number);
  return { cols: cols ?? 4, rows: rows ?? 4 };
}

export default function GardenScreen() {
  const { width } = useWindowDimensions();
  const { config, plants, seeds, plantSeed, movePlant, moveToGreenhouse, setConfig, setPlants, setSeeds } = useGardenStore();
  const userId = useAuthStore((s) => s.user?.id);
  const [loading, setLoading] = useState(true);

  // Seed picker
  const [pendingPlot, setPendingPlot] = useState<{ x: number; y: number } | null>(null);
  // Plant options (long-press menu)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  // Drag state: plant being repositioned
  const [draggingPlant, setDraggingPlant] = useState<Plant | null>(null);
  // Bloom tracking: set of plant IDs that just bloomed this session
  const justBloomedIds = useRef<Set<string>>(new Set());
  const prevStages = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!userId) return;
    loadGardenState(userId).then(({ config, plants, seeds }) => {
      setConfig(config);
      setPlants(plants);
      setSeeds(seeds);
      setLoading(false);
    });
  }, [userId]);

  // Detect bloom transitions
  useEffect(() => {
    plants.forEach((p) => {
      const prev = prevStages.current.get(p.id);
      if (prev !== undefined && prev < 3 && p.growthStage >= 3) {
        justBloomedIds.current.add(p.id);
        // Clear after animation completes
        setTimeout(() => justBloomedIds.current.delete(p.id), 1000);
      }
      prevStages.current.set(p.id, p.growthStage);
    });
  }, [plants]);

  const gridSize = config?.gardenGridSize ?? '4x4';
  const { cols, rows } = parseGrid(gridSize);
  const cellSize = Math.floor((width - 32 - cols * 6) / cols);

  const plotMap = new Map<string, Plant>(
    plants
      .filter((p) => p.location === 'garden' && p.gardenPositionX != null)
      .map((p) => [`${p.gardenPositionX},${p.gardenPositionY}`, p])
  );

  const handlePressEmpty = useCallback((x: number, y: number) => {
    if (draggingPlant) {
      // Drop dragged plant here
      movePlant(draggingPlant.id, x, y);
      setDraggingPlant(null);
    } else {
      setPendingPlot({ x, y });
    }
  }, [draggingPlant, movePlant]);

  const handleLongPress = useCallback((plant: Plant) => {
    if (draggingPlant) {
      setDraggingPlant(null); // cancel drag
    } else {
      setSelectedPlant(plant);
    }
  }, [draggingPlant]);

  const handleSeedSelect = useCallback((seed: Seed) => {
    if (!pendingPlot) return;
    plantSeed(seed.id, pendingPlot.x, pendingPlot.y);
    setPendingPlot(null);
  }, [pendingPlot, plantSeed]);

  const inventorySeeds = seeds.filter((s) => s.location === 'inventory');

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#4CAF82" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Your Garden</Text>
      <Text style={styles.sub}>
        {gridSize} · {plants.filter(p => p.location === 'garden').length} plants
        {draggingPlant ? '  ·  Tap a plot to move' : ''}
      </Text>

      <ScrollView contentContainerStyle={styles.gridWrap}>
        {Array.from({ length: rows }, (_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: cols }, (_, col) => {
              const plant = plotMap.get(`${col},${row}`) ?? null;
              const isDragging = draggingPlant?.id === plant?.id;
              const isDropTarget = !!draggingPlant && !plant;
              return (
                <GardenPlot
                  key={`${col},${row}`}
                  plant={plant}
                  cellSize={cellSize}
                  isDragging={isDragging}
                  isDropTarget={isDropTarget}
                  onPressEmpty={() => handlePressEmpty(col, row)}
                  onLongPressPlant={handleLongPress}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>

      <SeedPicker
        seeds={inventorySeeds}
        visible={!!pendingPlot && !draggingPlant}
        onSelect={handleSeedSelect}
        onClose={() => setPendingPlot(null)}
      />

      <PlantOptions
        plant={selectedPlant}
        onMoveToGreenhouse={(p) => { moveToGreenhouse(p.id); }}
        onStartDrag={(p) => { setDraggingPlant(p); setSelectedPlant(null); }}
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
