export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncResult {
  readonly pushed: number;
  readonly pulled: number;
  readonly conflicts: number;
}

export interface SyncService {
  startSync(): Promise<SyncResult>;
  scheduleSync(): void;
  getStatus(): SyncStatus;
  onConnectivityChange(connected: boolean): void;
  onSyncComplete: (() => void) | null;
  onConflictDetected: ((resolve: (choice: 'local' | 'server') => void) => void) | null;
}

export { syncService } from './sync-service';
