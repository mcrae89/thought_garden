import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@tg/supabase';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleRegister() {
    setError('');
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      await supabase.from('profiles').insert({ id: userId });
      await supabase.from('garden_configs').insert({ user_id: userId });
    }

    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.body}>
          We sent a confirmation link to <Text style={styles.email}>{email}</Text>.
          {'\n\n'}Open it to activate your account, then sign in.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')} accessibilityRole="button">
          <Text style={styles.btnText}>Go to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Thought Garden</Text>
      <Text style={styles.sub}>Create your garden</Text>

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
        : <TouchableOpacity style={styles.btn} onPress={handleRegister} accessibilityRole="button">
            <Text style={styles.btnText}>Create Account</Text>
          </TouchableOpacity>
      }

      <TouchableOpacity onPress={() => router.back()} accessibilityRole="link">
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#1a2e1a', padding: 32, justifyContent: 'center', gap: 12 },
  title:   { color: '#e8f5e9', fontSize: 32, fontWeight: '700', textAlign: 'center' },
  sub:     { color: '#6a8f6a', fontSize: 15, textAlign: 'center', marginBottom: 8 },
  body:    { color: '#a5d6a7', fontSize: 16, lineHeight: 24, textAlign: 'center' },
  email:   { color: '#e8f5e9', fontWeight: '600' },
  input:   { backgroundColor: '#243824', color: '#e8f5e9', borderRadius: 12, padding: 14, fontSize: 16 },
  btn:     { backgroundColor: '#4CAF82', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error:   { color: '#ef9a9a', fontSize: 14 },
  link:    { color: '#4CAF82', textAlign: 'center', marginTop: 8 },
});
