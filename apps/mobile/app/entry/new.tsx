import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Linking } from 'react-native';
import { router } from 'expo-router';
import { Button, MoodPicker } from '@tg/ui';
import { analyzeEntry, detectCrisisLanguage } from '@tg/core';
import type { Mood } from '@tg/core';

export default function NewEntryScreen() {
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [step, setStep] = useState<'write' | 'mood' | 'crisis'>('write');
  const [analyzing, setAnalyzing] = useState(false);

  async function handleAnalyze() {
    if (detectCrisisLanguage(body)) {
      setStep('crisis');
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analyzeEntry(body);
      setMood(result.moodPrimary);
    } catch {
      // Analysis failed — let user pick manually
    } finally {
      setAnalyzing(false);
      setStep('mood');
    }
  }

  function handleSave() {
    // TODO: persist entry, run milestone checks, award seeds
    router.back();
  }

  if (step === 'crisis') {
    return (
      <View style={styles.root}>
        <View style={styles.inner}>
          <Text style={styles.crisisHeading}>We see you.</Text>
          <Text style={styles.crisisBody}>
            It sounds like you might be going through something really hard. You don't have to face it alone.
          </Text>
          <Text style={styles.crisisBody}>
            If you're in crisis, please reach out to the 988 Suicide & Crisis Lifeline — call or text{' '}
            <Text style={styles.crisisLink} onPress={() => Linking.openURL('tel:988')}>988</Text>.
          </Text>
          <View style={[styles.actions, { marginTop: 32 }]}>
            <Button label="Go back" onPress={() => setStep('write')} variant="ghost" />
            <Button label="Save entry" onPress={handleSave} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>{step === 'write' ? "What's on your mind?" : 'How are you feeling?'}</Text>

        {step === 'write' && (
          <>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Write freely…"
              placeholderTextColor="#6a8f6a"
              value={body}
              onChangeText={setBody}
              autoFocus
              accessibilityLabel="Journal entry text"
            />
            {analyzing
              ? <ActivityIndicator color="#4CAF82" style={{ marginTop: 16 }} />
              : <Button label="Continue" onPress={handleAnalyze} disabled={body.trim().length === 0} />
            }
          </>
        )}

        {step === 'mood' && (
          <>
            <Text style={styles.hint}>We detected a mood — confirm or adjust:</Text>
            <MoodPicker selected={mood} onSelect={setMood} />
            <View style={styles.actions}>
              <Button label="Back" onPress={() => setStep('write')} variant="ghost" />
              <Button label="Save Entry" onPress={handleSave} disabled={mood === null} />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#1a2e1a' },
  inner:          { padding: 24, gap: 16 },
  heading:        { color: '#e8f5e9', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  hint:           { color: '#a5d6a7', fontSize: 14, marginBottom: 4 },
  input:          { backgroundColor: '#243824', color: '#e8f5e9', borderRadius: 12, padding: 16, fontSize: 16, minHeight: 180, textAlignVertical: 'top' },
  actions:        { flexDirection: 'row', gap: 12, marginTop: 8 },
  crisisHeading:  { color: '#e8f5e9', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  crisisBody:     { color: '#a5d6a7', fontSize: 16, lineHeight: 24, marginBottom: 12 },
  crisisLink:     { color: '#4CAF82', fontWeight: '700', textDecorationLine: 'underline' },
});
