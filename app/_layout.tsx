import { useEffect } from 'react';
import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { useAuthInit } from '@/hooks/use-auth-init';

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useAuthInit();

  useEffect(() => {
    if (!navigationState?.key) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(garden)');
    }
  }, [isAuthenticated, segments, navigationState?.key]);

  return <Slot />;
}
