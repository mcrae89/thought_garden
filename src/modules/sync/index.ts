export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncResult {
  readonly pushed: number;
  readonly pulled: number;
  readonly conflicts: number;
}

export interface SyncService {
  startSync(): Promise<SyncResult>;
  getStatus(): SyncStatus;
  onConnectivityChange(connected: boolean): void;
  onSyncComplete: (() => void) | null;
}

export { syncService } from './sync-service';
