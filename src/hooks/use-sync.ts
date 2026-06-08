import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useSeedStore } from '@/stores/seed-store';
import { useGardenStore } from '@/stores/garden-store';
import { useEntryStore } from '@/stores/entry-store';
import { gardenService } from '@/modules/garden';
import { entryService } from '@/modules/entries';
import { syncService } from '@/modules/sync';

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
      useEntryStore.getState().setEntries(entryService.getEntries({}));
    };

    syncService.startSync().catch((err) => console.warn('[Sync] initial sync failed:', err));
  }, [isAuthenticated, userId]);
}
