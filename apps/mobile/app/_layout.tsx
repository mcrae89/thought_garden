import '../src/setup/analysis';
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@tg/supabase';
import { useAuthStore } from '@tg/core';
import { ONBOARDING_KEY } from './onboarding';

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    async function init() {
      const onboarded = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!onboarded) {
        router.replace('/onboarding');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      router.replace(session ? '/(tabs)/garden' : '/(auth)/login');
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      router.replace(session ? '/(tabs)/garden' : '/(auth)/login');
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="entry/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="entry/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
