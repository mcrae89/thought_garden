import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GreenhouseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Greenhouse</Text>
      <Text style={styles.sub}>Seeds and resting plants live here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a2e1a', alignItems: 'center', justifyContent: 'center' },
  title:     { color: '#e8f5e9', fontSize: 28, fontWeight: '700' },
  sub:       { color: '#a5d6a7', marginTop: 8, fontSize: 15 },
});
