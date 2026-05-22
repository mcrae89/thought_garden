import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@tg/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_KEY = 'tg_onboarding_complete';

export default function OnboardingScreen() {
  async function handleContinue() {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    router.replace('/(auth)/login');
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.inner}>
      <Text style={styles.emoji}>🌱</Text>
      <Text style={styles.title}>Welcome to Thought Garden</Text>
      <Text style={styles.body}>
        This app is a journaling companion. Writing about your thoughts and feelings can be a
        meaningful part of self-care — and here, every entry helps your garden grow.
      </Text>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Important</Text>
        <Text style={styles.disclaimerBody}>
          Thought Garden is not a substitute for professional mental health care. If you are
          struggling, please reach out to a qualified professional.
        </Text>
        <Text style={styles.disclaimerBody}>
          If you are in crisis, help is available 24/7 — call or text{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('tel:988')}>988</Text>
          {' '}(Suicide & Crisis Lifeline).
        </Text>
      </View>

      <Button label="I understand — let's begin" onPress={handleContinue} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#1a2e1a' },
  inner:            { padding: 32, gap: 20, justifyContent: 'center', minHeight: '100%' },
  emoji:            { fontSize: 56, textAlign: 'center' },
  title:            { color: '#e8f5e9', fontSize: 26, fontWeight: '700', textAlign: 'center' },
  body:             { color: '#a5d6a7', fontSize: 16, lineHeight: 24, textAlign: 'center' },
  disclaimer:       { backgroundColor: '#243824', borderRadius: 12, padding: 20, gap: 10 },
  disclaimerTitle:  { color: '#e8f5e9', fontWeight: '700', fontSize: 15 },
  disclaimerBody:   { color: '#a5d6a7', fontSize: 14, lineHeight: 22 },
  link:             { color: '#4CAF82', fontWeight: '700', textDecorationLine: 'underline' },
});
