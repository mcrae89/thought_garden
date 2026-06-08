import * as SecureStore from 'expo-secure-store';
import { db } from '@/database';
import { supabase } from './supabase-client';
import type { SyncService, SyncResult, SyncStatus } from './index';
export { resolveConflict } from './conflict-resolution';

const LAST_PULLED_KEY = 'sync_last_pulled_at';

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

export class SyncServiceImpl implements SyncService {
  onSyncComplete: (() => void) | null = null;
  private status: SyncStatus = 'idle';

  async startSync(): Promise<SyncResult> {
    this.status = 'syncing';
    try {
      const stored = await SecureStore.getItemAsync(LAST_PULLED_KEY);
      const lastPulledAt = stored ? parseInt(stored, 10) : 0;
      console.log('[Sync] starting, lastPulledAt:', lastPulledAt);

      // --- PUSH ---
      const changes: Record<string, { updated: unknown[]; deleted: string[] }> = {
        entries: { updated: [], deleted: [] },
        entry_emotions: { updated: [], deleted: [] },
        seeds: { updated: [], deleted: [] },
        plants: { updated: [], deleted: [] },
        achievement_records: { updated: [], deleted: [] },
        user_stats: { updated: [], deleted: [] },
      };

      const entries = db.getAllSync<Record<string, unknown>>(
        'SELECT * FROM entries WHERE last_modified_at > ?', [lastPulledAt],
      );
      for (const row of entries) {
        if (row['is_deleted'] === 1) {
          changes.entries.deleted.push(row['id'] as string);
        } else {
          changes.entries.updated.push({
            ...row,
            created_at: msToIso(row['created_at'] as number),
            modified_at: msToIso(row['modified_at'] as number | null),
            last_modified_at: msToIso(row['last_modified_at'] as number),
            is_deleted: intToBool(row['is_deleted'] as number),
          });
        }
      }

      const entryEmotions = db.getAllSync<Record<string, unknown>>(
        'SELECT * FROM entry_emotions WHERE last_modified_at > ?', [lastPulledAt],
      );
      changes.entry_emotions.updated = entryEmotions.map((row) => ({
        ...row,
        last_modified_at: msToIso(row['last_modified_at'] as number),
      }));

      const seeds = db.getAllSync<Record<string, unknown>>(
        'SELECT * FROM seeds WHERE last_modified_at > ?', [lastPulledAt],
      );
      changes.seeds.updated = seeds.map((row) => ({
        ...row,
        earned_at: msToIso(row['earned_at'] as number),
        last_modified_at: msToIso(row['last_modified_at'] as number),
        is_planted: intToBool(row['is_planted'] as number),
      }));

      const plants = db.getAllSync<Record<string, unknown>>(
        'SELECT * FROM plants WHERE last_modified_at > ?', [lastPulledAt],
      );
      changes.plants.updated = plants.map((row) => ({
        ...row,
        planted_at: msToIso(row['planted_at'] as number),
        last_watered_at: msToIso(row['last_watered_at'] as number | null),
        last_modified_at: msToIso(row['last_modified_at'] as number),
      }));

      const achievementRecords = db.getAllSync<Record<string, unknown>>(
        'SELECT * FROM achievement_records WHERE last_modified_at > ?', [lastPulledAt],
      );
      changes.achievement_records.updated = achievementRecords.map((row) => ({
        ...row,
        earned_at: msToIso(row['earned_at'] as number),
        last_modified_at: msToIso(row['last_modified_at'] as number),
        is_active: intToBool(row['is_active'] as number),
      }));

      const userStats = db.getAllSync<Record<string, unknown>>(
        'SELECT * FROM user_stats WHERE last_modified_at > ?', [lastPulledAt],
      );
      changes.user_stats.updated = userStats.map((row) => ({
        ...row,
        last_modified_at: msToIso(row['last_modified_at'] as number),
      }));

      let pushed = 0;
      for (const t of Object.values(changes)) {
        pushed += t.updated.length + t.deleted.length;
      }

      if (pushed > 0 && lastPulledAt !== 0) {
        const { error: pushError } = await supabase.rpc('push_changes', {
          changes,
          last_pulled_at: lastPulledAt,
        });
        if (pushError) throw pushError;
      }

      // --- PULL ---
      const { data, error: pullError } = await supabase.rpc('pull_changes', {
        last_pulled_at: lastPulledAt,
        schema_version: 1,
      });
      if (pullError) throw pullError;
      console.log('[Sync] pull response - server timestamp:', data?.timestamp);
      console.log('[Sync] pull counts - entries updated:', data?.changes?.entries?.updated?.length, 'seeds updated:', data?.changes?.seeds?.updated?.length, 'plants updated:', data?.changes?.plants?.updated?.length);

      const c = data.changes;
      let pulled = 0;

      db.withTransactionSync(() => {
        for (const row of [...(c.entries?.updated ?? [])]) {
          db.runSync(
            `INSERT OR REPLACE INTO entries
              (id, user_id, content, primary_emotion, word_count, created_at, modified_at, is_deleted, last_modified_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.id, row.user_id, row.content, row.primary_emotion, row.word_count,
              toMs(row.created_at), toMs(row.modified_at),
              boolToInt(row.is_deleted), toMs(row.last_modified_at),
            ],
          );
          pulled++;
        }
        for (const id of c.entries?.deleted ?? []) {
          db.runSync('UPDATE entries SET is_deleted = 1 WHERE id = ?', [id]);
          pulled++;
        }

        for (const row of c.entry_emotions?.updated ?? []) {
          db.runSync(
            `INSERT OR REPLACE INTO entry_emotions (id, entry_id, emotion, type, "order", last_modified_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [row.id, row.entry_id, row.emotion, row.type, row.order, toMs(row.last_modified_at)],
          );
          pulled++;
        }
        for (const id of c.entry_emotions?.deleted ?? []) {
          db.runSync('DELETE FROM entry_emotions WHERE id = ?', [id]);
          pulled++;
        }

        for (const row of c.seeds?.updated ?? []) {
          db.runSync(
            `INSERT OR REPLACE INTO seeds
              (id, user_id, source_entry_id, source_achievement_id, emotion, color_variation, earned_at, is_planted, last_modified_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.id, row.user_id, row.source_entry_id, row.source_achievement_id,
              row.emotion, row.color_variation, toMs(row.earned_at),
              boolToInt(row.is_planted), toMs(row.last_modified_at),
            ],
          );
          pulled++;
        }

        for (const row of c.plants?.updated ?? []) {
          db.runSync(
            `INSERT OR REPLACE INTO plants
              (id, user_id, seed_id, emotion, color_variation, growth_stage, location,
               plot_position, planted_at, last_watered_at, last_growth_date, last_modified_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.id, row.user_id, row.seed_id, row.emotion, row.color_variation,
              row.growth_stage, row.location, row.plot_position,
              toMs(row.planted_at), toMs(row.last_watered_at),
              row.last_growth_date, toMs(row.last_modified_at),
            ],
          );
          pulled++;
        }
        for (const id of c.plants?.deleted ?? []) {
          db.runSync('DELETE FROM plants WHERE id = ?', [id]);
          pulled++;
        }

        for (const row of c.achievement_records?.updated ?? []) {
          db.runSync(
            `INSERT OR REPLACE INTO achievement_records
              (id, user_id, achievement_type, achievement_key, trigger_entry_id, earned_at, is_active, last_modified_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.id, row.user_id, row.achievement_type, row.achievement_key,
              row.trigger_entry_id, toMs(row.earned_at),
              boolToInt(row.is_active), toMs(row.last_modified_at),
            ],
          );
          pulled++;
        }

        for (const row of c.user_stats?.updated ?? []) {
          db.runSync(
            `INSERT OR REPLACE INTO user_stats
              (id, user_id, total_entries, current_streak, last_entry_date,
               consecutive_same_emotion, last_emotion, tier, last_modified_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.id, row.user_id, row.total_entries, row.current_streak,
              row.last_entry_date, row.consecutive_same_emotion, row.last_emotion,
              row.tier, toMs(row.last_modified_at),
            ],
          );
          pulled++;
        }

        if (lastPulledAt === 0) {
          console.log('[Sync] full sync - reconciling local vs server');
          const serverIds = {
            entries: new Set((c.entries?.updated ?? []).map((r: Record<string, unknown>) => r.id as string)),
            seeds: new Set((c.seeds?.updated ?? []).map((r: Record<string, unknown>) => r.id as string)),
            plants: new Set((c.plants?.updated ?? []).map((r: Record<string, unknown>) => r.id as string)),
            achievement_records: new Set((c.achievement_records?.updated ?? []).map((r: Record<string, unknown>) => r.id as string)),
          };

          const localEntries = db.getAllSync<{ id: string }>('SELECT id FROM entries WHERE is_deleted = 0');
          for (const { id } of localEntries) {
            if (!serverIds.entries.has(id)) {
              db.runSync('UPDATE entries SET is_deleted = 1 WHERE id = ?', [id]);
              pulled++;
            }
          }

          for (const table of ['seeds', 'plants', 'achievement_records'] as const) {
            const localRows = db.getAllSync<{ id: string }>(`SELECT id FROM ${table}`);
            for (const { id } of localRows) {
              if (!serverIds[table].has(id)) {
                db.runSync(`DELETE FROM ${table} WHERE id = ?`, [id]);
                pulled++;
              }
            }
          }
        }
      });

      await SecureStore.setItemAsync(LAST_PULLED_KEY, String(data.timestamp));
      console.log('[Sync] done - pushed:', pushed, 'pulled:', pulled);
      if (pulled > 0 || pushed > 0) this.onSyncComplete?.();
      this.status = 'idle';
      return { pushed, pulled, conflicts: 0 };
    } catch (err) {
      this.status = 'error';
      console.error('[Sync] startSync failed:', err);
      throw err;
    }
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  onConnectivityChange(_connected: boolean): void {}
}

export const syncService: SyncService = new SyncServiceImpl();

