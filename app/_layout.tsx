import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { useAuthInit } from '@/hooks/use-auth-init';
import { useSyncOnLogin } from '@/hooks/use-sync';

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [debugInfo, setDebugInfo] = useState('init');

  useAuthInit();
  useSyncOnLogin();

  useEffect(() => {
    setDebugInfo(`auth=${isAuthenticated} loading=${isLoading} nav=${!!navigationState?.key} seg=${segments.join('/')}`);
    if (isLoading || !navigationState?.key) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(garden)');
    }
  }, [isAuthenticated, isLoading, segments, navigationState?.key]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ position: 'absolute', top: 50, left: 10, zIndex: 9999, backgroundColor: 'yellow', padding: 5 }}>
        <Text style={{ fontSize: 12 }}>{debugInfo}</Text>
      </View>
      <Slot />
    </View>
  );
}
