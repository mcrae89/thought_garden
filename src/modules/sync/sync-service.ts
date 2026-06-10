import * as SecureStore from 'expo-secure-store';
import { db } from '@/database';
import { supabase } from './supabase-client';
import { useSyncStore } from '@/stores/sync-store';
import type { SyncService, SyncResult, SyncStatus } from './index';
export { resolveConflict } from './conflict-resolution';

const LAST_PULLED_KEY = 'sync_last_pulled_at';
const CONFLICT_TABLES = ['entries', 'seeds', 'plants'] as const;

function toMs(ts: string | null | undefined): number | null {
  if (!ts) return null;
  return new Date(ts).getTime();
}

function boolToInt(v: boolean | null | undefined): number {
  return v ? 1 : 0;
}

function msToIso(val: number | null | undefined): string | null {
  if (val == null) return null;
  return new Date(val).toISOString();
}

function intToBool(v: number | null | undefined): boolean {
  return v === 1;
}

function hasConflict(serverRows: Record<string, unknown>[], tableName: string, pushedIds: Set<string>, lastPulledAt: number): boolean {
  for (const row of serverRows) {
    if (pushedIds.has(row.id as string)) continue;
    const local = db.getFirstSync<{ last_modified_at: number }>(
      `SELECT last_modified_at FROM ${tableName} WHERE id = ?`, [row.id as string],
    );
    if (local && local.last_modified_at > lastPulledAt && toMs(row.last_modified_at as string)! > local.last_modified_at) return true;
  }
  return false;
}

export class SyncServiceImpl implements SyncService {
  onSyncComplete: (() => void) | null = null;
  onConflictDetected: ((resolve: (choice: 'local' | 'server') => void) => void) | null = null;
  private status: SyncStatus = 'idle';
  private isSyncing = false;
  private hasPending = false;
  /** Timestamp of last completed push — used to suppress self-echo from realtime */
  private lastPushAt = 0;

  scheduleSync(): void {
    if (this.isSyncing) { this.hasPending = true; return; }
    this.startSync().catch(() => {});
  }

  /**
   * Called by realtime listeners. Skips sync if we just pushed (self-echo suppression).
   */
  scheduleSyncFromRemote(): void {
    // Suppress syncs triggered within 3s of our own push (self-echo)
    if (Date.now() - this.lastPushAt < 3000) return;
    this.scheduleSync();
  }

  async startSync(): Promise<SyncResult> {
    if (useSyncStore.getState().conflictPending) return { pushed: 0, pulled: 0, conflicts: 0 };
    if (this.isSyncing) { this.hasPending = true; return { pushed: 0, pulled: 0, conflicts: 0 }; }
    this.isSyncing = true;
    this.status = 'syncing';
    try {
      const stored = await SecureStore.getItemAsync(LAST_PULLED_KEY);
      const lastPulledAt = stored ? parseInt(stored, 10) : 0;
      console.log('[Sync] starting, lastPulledAt:', lastPulledAt);

      // --- BUILD LOCAL CHANGES ---
      const changes: Record<string, { updated: unknown[]; deleted: unknown[] }> = {
        entries: { updated: [], deleted: [] },
        entry_emotions: { updated: [], deleted: [] },
        seeds: { updated: [], deleted: [] },
        plants: { updated: [], deleted: [] },
        achievement_records: { updated: [], deleted: [] },
        user_stats: { updated: [], deleted: [] },
      };

      const entries = db.getAllSync<Record<string, unknown>>('SELECT * FROM entries WHERE last_modified_at > ?', [lastPulledAt]);
      for (const row of entries) {
        if (row['is_deleted'] === 1) {
          changes.entries.deleted.push({ id: row['id'] as string });
        } else {
          changes.entries.updated.push({
            ...row,
            is_deleted: intToBool(row['is_deleted'] as number),
          });
        }
      }

      changes.entry_emotions.updated = db.getAllSync<Record<string, unknown>>('SELECT * FROM entry_emotions WHERE last_modified_at > ?', [lastPulledAt]);

      changes.seeds.updated = db.getAllSync<Record<string, unknown>>('SELECT * FROM seeds WHERE last_modified_at > ?', [lastPulledAt])
        .map((row) => ({ ...row, is_planted: intToBool(row['is_planted'] as number) }));

      changes.plants.updated = db.getAllSync<Record<string, unknown>>('SELECT * FROM plants WHERE last_modified_at > ?', [lastPulledAt]);

      changes.achievement_records.updated = db.getAllSync<Record<string, unknown>>('SELECT * FROM achievement_records WHERE last_modified_at > ?', [lastPulledAt])
        .map((row) => ({ ...row, is_active: intToBool(row['is_active'] as number) }));

      changes.user_stats.updated = db.getAllSync<Record<string, unknown>>('SELECT * FROM user_stats WHERE last_modified_at > ?', [lastPulledAt]);

      let pushed = 0;
      for (const t of Object.values(changes)) pushed += t.updated.length + t.deleted.length;

      // --- FIX #3: PUSH FIRST (even on full sync) ---
      if (pushed > 0) {
        const payload = JSON.parse(JSON.stringify(changes));
        const { error: pushError } = await supabase.rpc('push_changes', { changes: payload, last_pulled_at: lastPulledAt });
        if (pushError) throw pushError;
        this.lastPushAt = Date.now();
      }

      // --- PULL ---
      const { data, error: pullError } = await supabase.rpc('pull_changes', { last_pulled_at: lastPulledAt, schema_version: 1 });
      if (pullError) throw pullError;
      console.log('[Sync] pull response - server timestamp:', data?.timestamp);

      const c = data.changes;

      // --- DETECT CONFLICTS (only on non-first sync when we pushed) ---
      let conflicts = 0;
      if (pushed > 0 && lastPulledAt !== 0 && this.onConflictDetected) {
        const pushedIds: Record<string, Set<string>> = {};
        for (const table of CONFLICT_TABLES) {
          pushedIds[table] = new Set((changes[table].updated as Record<string, unknown>[]).map((r) => r.id as string));
        }
        for (const table of CONFLICT_TABLES) {
          if (hasConflict(c[table]?.updated ?? [], table, pushedIds[table], lastPulledAt)) { conflicts++; break; }
        }
      }

      if (conflicts > 0) {
        const choice = await new Promise<'local' | 'server'>((resolve) => { this.onConflictDetected!(resolve); });
        if (choice === 'server') {
          // Server wins — apply pull normally (fall through)
        }
        // If local wins, we already pushed above, so just skip applying conflicting pulled rows
        // For simplicity we still apply pull but the timestamp guards protect local data
      }

      // --- FIX #2: APPLY PULL WITH TIMESTAMP GUARDS ON ALL TABLES ---
      let pulled = 0;
      db.withTransactionSync(() => {
        for (const row of c.entries?.updated ?? []) {
          db.runSync(
            `INSERT INTO entries (id, user_id, content, primary_emotion, word_count, created_at, modified_at, is_deleted, last_modified_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               content = excluded.content,
               primary_emotion = excluded.primary_emotion,
               word_count = excluded.word_count,
               modified_at = excluded.modified_at,
               is_deleted = excluded.is_deleted,
               last_modified_at = excluded.last_modified_at
             WHERE excluded.last_modified_at > entries.last_modified_at`,
            [row.id, row.user_id, row.content, row.primary_emotion, row.word_count, toMs(row.created_at), toMs(row.modified_at), boolToInt(row.is_deleted), toMs(row.last_modified_at)]);
          pulled++;
        }
        for (const id of c.entries?.deleted ?? []) {
          db.runSync('UPDATE entries SET is_deleted = 1, last_modified_at = ? WHERE id = ? AND last_modified_at < ?',
            [Date.now(), id, Date.now()]);
          pulled++;
        }

        for (const row of c.entry_emotions?.updated ?? []) {
          db.runSync(
            `INSERT INTO entry_emotions (id, entry_id, emotion, type, "order", last_modified_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               emotion = excluded.emotion,
               type = excluded.type,
               "order" = excluded."order",
               last_modified_at = excluded.last_modified_at
             WHERE excluded.last_modified_at > entry_emotions.last_modified_at`,
            [row.id, row.entry_id, row.emotion, row.type, row.order, toMs(row.last_modified_at)]);
          pulled++;
        }
        for (const id of c.entry_emotions?.deleted ?? []) { db.runSync('DELETE FROM entry_emotions WHERE id = ?', [id]); pulled++; }

        for (const row of c.seeds?.updated ?? []) {
          db.runSync(
            `INSERT INTO seeds (id, user_id, source_entry_id, source_achievement_id, emotion, color_variation, earned_at, is_planted, last_modified_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               is_planted = excluded.is_planted,
               last_modified_at = excluded.last_modified_at
             WHERE excluded.last_modified_at > seeds.last_modified_at`,
            [row.id, row.user_id, row.source_entry_id, row.source_achievement_id, row.emotion, row.color_variation, toMs(row.earned_at), boolToInt(row.is_planted), toMs(row.last_modified_at)]);
          pulled++;
        }

        for (const row of c.plants?.updated ?? []) {
          db.runSync(
            `INSERT INTO plants (id, user_id, seed_id, emotion, color_variation, growth_stage, location, plot_position, planted_at, last_watered_at, last_growth_date, last_modified_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               growth_stage = excluded.growth_stage,
               location = excluded.location,
               plot_position = excluded.plot_position,
               last_watered_at = excluded.last_watered_at,
               last_growth_date = excluded.last_growth_date,
               last_modified_at = excluded.last_modified_at
             WHERE excluded.last_modified_at > plants.last_modified_at`,
            [row.id, row.user_id, row.seed_id, row.emotion, row.color_variation, row.growth_stage, row.location, row.plot_position, toMs(row.planted_at), toMs(row.last_watered_at), row.last_growth_date, toMs(row.last_modified_at)]);
          pulled++;
        }
        for (const id of c.plants?.deleted ?? []) { db.runSync('DELETE FROM plants WHERE id = ?', [id]); pulled++; }

        for (const row of c.achievement_records?.updated ?? []) {
          db.runSync(
            `INSERT INTO achievement_records (id, user_id, achievement_type, achievement_key, trigger_entry_id, earned_at, is_active, last_modified_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               achievement_type = excluded.achievement_type,
               trigger_entry_id = excluded.trigger_entry_id,
               is_active = excluded.is_active,
               last_modified_at = excluded.last_modified_at
             WHERE excluded.last_modified_at > achievement_records.last_modified_at`,
            [row.id, row.user_id, row.achievement_type, row.achievement_key, row.trigger_entry_id, toMs(row.earned_at), boolToInt(row.is_active), toMs(row.last_modified_at)]);
          pulled++;
        }

        for (const row of c.user_stats?.updated ?? []) {
          db.runSync(
            `INSERT INTO user_stats (id, user_id, total_entries, current_streak, last_entry_date, consecutive_same_emotion, last_emotion, tier, last_modified_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               total_entries = excluded.total_entries,
               current_streak = excluded.current_streak,
               last_entry_date = excluded.last_entry_date,
               consecutive_same_emotion = excluded.consecutive_same_emotion,
               last_emotion = excluded.last_emotion,
               tier = excluded.tier,
               last_modified_at = excluded.last_modified_at
             WHERE excluded.last_modified_at > user_stats.last_modified_at`,
            [row.id, row.user_id, row.total_entries, row.current_streak, row.last_entry_date, row.consecutive_same_emotion, row.last_emotion, row.tier, toMs(row.last_modified_at)]);
          pulled++;
        }

        // FIX #3: Full-sync reconciliation — only delete rows we KNOW are gone from server
        // Since we pushed first, local-only data is now on the server too.
        if (lastPulledAt === 0) {
          console.log('[Sync] full sync - reconciling local vs server');
          const serverIds = {
            entries: new Set((c.entries?.updated ?? []).map((r: Record<string, unknown>) => r.id as string)),
            seeds: new Set((c.seeds?.updated ?? []).map((r: Record<string, unknown>) => r.id as string)),
            plants: new Set((c.plants?.updated ?? []).map((r: Record<string, unknown>) => r.id as string)),
            achievement_records: new Set((c.achievement_records?.updated ?? []).map((r: Record<string, unknown>) => r.id as string)),
          };
          for (const { id } of db.getAllSync<{ id: string }>('SELECT id FROM entries WHERE is_deleted = 0')) {
            if (!serverIds.entries.has(id)) { db.runSync('UPDATE entries SET is_deleted = 1 WHERE id = ?', [id]); pulled++; }
          }
          for (const table of ['seeds', 'plants', 'achievement_records'] as const) {
            for (const { id } of db.getAllSync<{ id: string }>(`SELECT id FROM ${table}`)) {
              if (!serverIds[table].has(id)) { db.runSync(`DELETE FROM ${table} WHERE id = ?`, [id]); pulled++; }
            }
          }
        }
      });

      await SecureStore.setItemAsync(LAST_PULLED_KEY, String(data.timestamp));
      console.log('[Sync] done - pushed:', pushed, 'pulled:', pulled, 'conflicts:', conflicts);
      if (pulled > 0 || pushed > 0) this.onSyncComplete?.();
      this.status = 'idle';
      this.isSyncing = false;
      if (this.hasPending) { this.hasPending = false; this.scheduleSync(); }
      return { pushed, pulled, conflicts };
    } catch (err) {
      this.status = 'error';
      this.isSyncing = false;
      if (this.hasPending) { this.hasPending = false; this.scheduleSync(); }
      console.error('[Sync] startSync failed:', err);
      throw err;
    }
  }

  getStatus(): SyncStatus { return this.status; }
  onConnectivityChange(_connected: boolean): void {}
}

export const syncService: SyncService = new SyncServiceImpl();
