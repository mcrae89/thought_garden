import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useSeedStore } from '@/stores/seed-store';
import { useGardenStore } from '@/stores/garden-store';
import { useEntryStore } from '@/stores/entry-store';
import { useSyncStore } from '@/stores/sync-store';
import { gardenService } from '@/modules/garden';
import { entryService } from '@/modules/entries';
import { syncService } from '@/modules/sync';
import { db } from '@/database';

export function useSyncOnLogin() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.session?.userId ?? '');
  const synced = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      synced.current = false;
      return;
    }
    if (synced.current) return;
    synced.current = true;

    syncService.onSyncComplete = () => {
      useSeedStore.getState().refreshSeeds();
      useGardenStore.getState().setPlants(gardenService.getGarden(userId));
      useEntryStore.getState().setEntries(entryService.getEntries({ userId }));
      const stats = db.getFirstSync<{ tier: string }>('SELECT tier FROM user_stats WHERE user_id = ?', [userId]);
      if (stats?.tier) useAuthStore.getState().setTier(stats.tier as 'free' | 'paid');
    };

    syncService.onConflictDetected = (resolve) => {
      useSyncStore.getState().showConflict(resolve);
    };

    // Sync on login
    syncService.startSync().catch((err) => console.warn('[Sync] initial sync failed:', err));

    // Sync on app resume (replaces Realtime subscription)
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncService.scheduleSync();
    });

    return () => subscription.remove();
  }, [isAuthenticated, userId]);
}
