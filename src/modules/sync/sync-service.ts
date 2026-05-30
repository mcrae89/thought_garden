import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '@/database';
import { supabase } from './supabase-client';
import type { SyncService, SyncResult, SyncStatus } from './index';
export { resolveConflict } from './conflict-resolution';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const RECONNECT_DELAY_MS = 30_000;

async function checkConnectivity(): Promise<boolean> {
  try {
    const { error } = await supabase.from('_health').select('*').limit(0);
    return !error;
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SyncServiceImpl implements SyncService {
  private status: SyncStatus = 'idle';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  async startSync(): Promise<SyncResult> {
    this.status = 'syncing';

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // TODO: synchronize() doesn't return conflict counts directly.
        // Return placeholder counts until we instrument the pull/push handlers.
        await synchronize({
          database,
          pullChanges: async ({ lastPulledAt, schemaVersion }) => {
            // TODO: Implement pull_changes Postgres function in a future migration
            const { data, error } = await supabase.rpc('pull_changes', {
              last_pulled_at: lastPulledAt,
              schema_version: schemaVersion,
            });
            if (error) throw error;
            return data as { changes: Record<string, unknown>; timestamp: number };
          },
          pushChanges: async ({ changes, lastPulledAt }) => {
            // TODO: Implement push_changes Postgres function in a future migration
            const { error } = await supabase.rpc('push_changes', {
              changes,
              last_pulled_at: lastPulledAt,
            });
            if (error) throw error;
          },
        });

        this.status = 'idle';
        return { pushed: 0, pulled: 0, conflicts: 0 };
      } catch {
        if (attempt < MAX_RETRIES - 1) {
          await delay(BASE_DELAY_MS * Math.pow(2, attempt));
        }
      }
    }

    this.status = 'error';
    return { pushed: 0, pulled: 0, conflicts: 0 };
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  onConnectivityChange(connected: boolean): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (connected) {
      this.reconnectTimer = setTimeout(() => {
        void this.startSync();
      }, RECONNECT_DELAY_MS);
    } else {
      this.status = 'offline';
    }
  }
}

export { checkConnectivity };
