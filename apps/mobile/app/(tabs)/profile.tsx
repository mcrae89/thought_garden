import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@tg/core';
import { supabase, fetchProfileStats, type ProfileStats } from '@tg/supabase';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<ProfileStats | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchProfileStats(user.id).then(setStats);
  }, [user?.id]);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.email}>{user?.email}</Text>

      {stats ? (
        <>
          <View style={styles.streakCard}>
            <Text style={styles.streakNum}>{stats.streakCount}</Text>
            <Text style={styles.streakLabel}>day streak 🔥</Text>
          </View>

          <View style={styles.statsRow}>
            <StatBox value={stats.totalEntries} label="entries" />
            <StatBox value={stats.plantsGrown} label="plants" />
            <StatBox value={stats.seedsEarned} label="seeds" />
          </View>
        </>
      ) : (
        <ActivityIndicator color="#4CAF82" style={{ marginTop: 32 }} />
      )}

      <TouchableOpacity
        style={styles.signOut}
        onPress={() => supabase.auth.signOut()}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#1a2e1a', padding: 24, paddingTop: 56 },
  title:       { color: '#e8f5e9', fontSize: 26, fontWeight: '700' },
  email:       { color: '#6a8f6a', fontSize: 14, marginTop: 4, marginBottom: 24 },
  streakCard:  { backgroundColor: '#243824', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  streakNum:   { color: '#4CAF82', fontSize: 56, fontWeight: '800' },
  streakLabel: { color: '#a5d6a7', fontSize: 16, marginTop: 4 },
  statsRow:    { flexDirection: 'row', gap: 12 },
  statBox:     { flex: 1, backgroundColor: '#243824', borderRadius: 12, padding: 16, alignItems: 'center' },
  statNum:     { color: '#e8f5e9', fontSize: 28, fontWeight: '700' },
  statLabel:   { color: '#6a8f6a', fontSize: 13, marginTop: 2 },
  signOut:     { marginTop: 'auto', borderWidth: 1, borderColor: '#4CAF82', borderRadius: 12, padding: 14, alignItems: 'center' },
  signOutText: { color: '#4CAF82', fontWeight: '600', fontSize: 16 },
});
