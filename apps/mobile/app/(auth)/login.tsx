import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@tg/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    // session listener in _layout handles redirect
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Thought Garden</Text>
      <Text style={styles.sub}>Sign in to your garden</Text>
      <Text style={styles.hint}>Make sure you've confirmed your email before signing in.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#6a8f6a"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        accessibilityLabel="Email"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#6a8f6a"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        accessibilityLabel="Password"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading
        ? <ActivityIndicator color="#4CAF82" />
        : <TouchableOpacity style={styles.btn} onPress={handleLogin} accessibilityRole="button">
            <Text style={styles.btnText}>Sign In</Text>
          </TouchableOpacity>
      }

      <TouchableOpacity onPress={() => router.push('/(auth)/register')} accessibilityRole="link">
        <Text style={styles.link}>No account? Create one</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#1a2e1a', padding: 32, justifyContent: 'center', gap: 12 },
  title:   { color: '#e8f5e9', fontSize: 32, fontWeight: '700', textAlign: 'center' },
  sub:     { color: '#6a8f6a', fontSize: 15, textAlign: 'center', marginBottom: 4 },
  hint:    { color: '#6a8f6a', fontSize: 12, textAlign: 'center', marginBottom: 8 },
  input:   { backgroundColor: '#243824', color: '#e8f5e9', borderRadius: 12, padding: 14, fontSize: 16 },
  btn:     { backgroundColor: '#4CAF82', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error:   { color: '#ef9a9a', fontSize: 14 },
  link:    { color: '#4CAF82', textAlign: 'center', marginTop: 8 },
});
