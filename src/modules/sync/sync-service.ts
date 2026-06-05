import { db } from '@/database';
import { supabase } from './supabase-client';
import type { SyncService, SyncResult, SyncStatus } from './index';
export { resolveConflict } from './conflict-resolution';

const TABLES = ['entries', 'entry_emotions', 'seeds', 'plants', 'achievement_records', 'user_stats'] as const;

export class SyncServiceImpl implements SyncService {
  private status: SyncStatus = 'idle';

  async startSync(): Promise<SyncResult> {
    // TODO: Enable once Supabase tables/RLS are ready
    console.warn('[Sync] Sync is disabled — backend not yet implemented.');
    return { pushed: 0, pulled: 0, conflicts: 0 };
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  onConnectivityChange(_connected: boolean): void {
    // No-op while sync is disabled
  }
}
