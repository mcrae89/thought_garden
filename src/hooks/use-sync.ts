import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useSeedStore } from '@/stores/seed-store';
import { useGardenStore } from '@/stores/garden-store';
import { useEntryStore } from '@/stores/entry-store';
import { useSyncStore } from '@/stores/sync-store';
import { gardenService } from '@/modules/garden';
import { entryService } from '@/modules/entries';
import { syncService } from '@/modules/sync';
import { supabase } from '@/modules/sync/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useSyncOnLogin() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.session?.userId ?? '');
  const synced = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      synced.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }
    if (synced.current) return;
    synced.current = true;

    syncService.onSyncComplete = () => {
      useSeedStore.getState().refreshSeeds();
      useGardenStore.getState().setPlants(gardenService.getGarden(userId));
      useEntryStore.getState().setEntries(entryService.getEntries({}));
    };

    syncService.onConflictDetected = (resolve) => {
      useSyncStore.getState().showConflict(resolve);
    };

    syncService.startSync().catch((err) => console.warn('[Sync] initial sync failed:', err));

    channelRef.current = supabase
      .channel(`realtime:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries', filter: `user_id=eq.${userId}` }, () => syncService.scheduleSync())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seeds', filter: `user_id=eq.${userId}` }, () => syncService.scheduleSync())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plants', filter: `user_id=eq.${userId}` }, () => syncService.scheduleSync())
      .subscribe();
  }, [isAuthenticated, userId]);
}
