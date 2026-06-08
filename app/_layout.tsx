import { useEffect } from 'react';
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

  useAuthInit();
  useSyncOnLogin();

  useEffect(() => {
    if (isLoading || !navigationState?.key) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(garden)');
    }
  }, [isAuthenticated, isLoading, segments, navigationState?.key]);

  return <Slot />;
}
