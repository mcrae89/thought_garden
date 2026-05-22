import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useGardenStore, type GardenConfig } from '@tg/core';
import type { Plant, Seed } from '@tg/core';
import { PlantSprite } from '../../src/components/garden/PlantSprite';
import type { GrowthStage } from '@tg/core';

export default function GreenhouseScreen() {
  const { config, plants, seeds, moveToGarden } = useGardenStore();

  const greenhousePlants = plants.filter((p) => p.location === 'greenhouse');
  const inventorySeeds = seeds.filter((s) => s.location === 'inventory');
  const capacity = config?.greenhouseCapacity ?? 10;

  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Greenhouse</Text>
      <Text style={styles.sub}>
        {greenhousePlants.length}/{capacity} plants · {inventorySeeds.length} seeds in inventory
      </Text>

      {greenhousePlants.length > 0 && (
        <>
          <Text style={styles.section}>Potted Plants</Text>
          <FlatList
            data={greenhousePlants}
            keyExtractor={(p) => p.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.plantCell}
                onPress={() => setSelectedPlant(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.species}, stage ${item.growthStage}`}
              >
                <PlantSprite stage={item.growthStage as GrowthStage} color={item.colorPrimary} />
                <Text style={styles.cellLabel}>{item.species.replace('_', ' ')}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {inventorySeeds.length > 0 && (
        <>
          <Text style={styles.section}>Seeds</Text>
          <FlatList
            data={inventorySeeds}
            keyExtractor={(s) => s.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => <SeedCell seed={item} />}
          />
        </>
      )}

      {greenhousePlants.length === 0 && inventorySeeds.length === 0 && (
        <Text style={styles.empty}>Nothing here yet. Write entries to earn seeds!</Text>
      )}

      <PlantActionModal
        plant={selectedPlant}
        config={config}
        plants={plants}
        onMoveToGarden={moveToGarden}
        onClose={() => setSelectedPlant(null)}
      />
    </View>
  );
}

function SeedCell({ seed }: { seed: Seed }) {
  return (
    <View style={styles.plantCell}>
      <View style={[styles.seedDot, { backgroundColor: seed.colorPrimary }]} />
      <Text style={styles.cellLabel}>{seed.plantSpecies.replace('_', ' ')}</Text>
      {seed.isRare && <Text style={styles.rare}>✦</Text>}
    </View>
  );
}

function PlantActionModal({ plant, config, plants, onMoveToGarden, onClose }: {
  plant: Plant | null;
  config: GardenConfig | null;
  plants: Plant[];
  onMoveToGarden: (id: string, x: number, y: number) => void;
  onClose: () => void;
}) {
  if (!plant) return null;

  // Find first empty plot in garden
  const gridSize = config?.gardenGridSize ?? '4x4';
  const [cols, rows] = gridSize.split('x').map(Number);
  const occupied = new Set(
    plants
      .filter((p) => p.location === 'garden' && p.gardenPositionX != null)
      .map((p) => `${p.gardenPositionX},${p.gardenPositionY}`)
  );
  let emptyPlot: { x: number; y: number } | null = null;
  outer: for (let r = 0; r < (rows ?? 4); r++) {
    for (let c = 0; c < (cols ?? 4); c++) {
      if (!occupied.has(`${c},${r}`)) { emptyPlot = { x: c, y: r }; break outer; }
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>{plant.species.replace('_', ' ')}</Text>
        <Text style={styles.sheetSub}>Stage {plant.growthStage} · {plant.wateringCount} waterings</Text>
        {emptyPlot ? (
          <TouchableOpacity
            style={styles.option}
            onPress={() => { onMoveToGarden(plant.id, emptyPlot!.x, emptyPlot!.y); onClose(); }}
            accessibilityRole="button"
          >
            <Text style={styles.optionText}>🌿  Move to garden</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noSpace}>Garden is full — move a plant to greenhouse first.</Text>
        )}
        <TouchableOpacity style={styles.cancel} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#1a2e1a', paddingTop: 56, paddingHorizontal: 16 },
  title:      { color: '#e8f5e9', fontSize: 26, fontWeight: '700' },
  sub:        { color: '#6a8f6a', fontSize: 13, marginTop: 4, marginBottom: 8 },
  section:    { color: '#a5d6a7', fontSize: 14, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  grid:       { gap: 8 },
  plantCell:  { flex: 1, margin: 4, backgroundColor: '#243824', borderRadius: 12, padding: 12, alignItems: 'center', gap: 6, minHeight: 90 },
  cellLabel:  { color: '#a5d6a7', fontSize: 11, textAlign: 'center', textTransform: 'capitalize' },
  seedDot:    { width: 36, height: 36, borderRadius: 18 },
  rare:       { color: '#ffd700', fontSize: 11 },
  empty:      { color: '#6a8f6a', textAlign: 'center', marginTop: 60, fontSize: 15 },
  backdrop:   { flex: 1, backgroundColor: '#00000066' },
  sheet:      { backgroundColor: '#1a2e1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  sheetTitle: { color: '#e8f5e9', fontSize: 18, fontWeight: '700', textTransform: 'capitalize' },
  sheetSub:   { color: '#6a8f6a', fontSize: 13, marginTop: 4, marginBottom: 20 },
  option:     { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2d4a2d' },
  optionText: { color: '#e8f5e9', fontSize: 16 },
  noSpace:    { color: '#ef9a9a', fontSize: 14, paddingVertical: 16 },
  cancel:     { paddingVertical: 16 },
  cancelText: { color: '#6a8f6a', fontSize: 16 },
});
