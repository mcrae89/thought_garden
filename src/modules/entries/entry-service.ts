import { db } from '@/database';
import { generateId, now, toDate } from '@/database/helpers';
import { EMOTIONS, type Emotion, type Tier } from '@/shared/types';
import type { AppError, Result } from '@/shared/result';
import type { Entry, EntryService } from './index';

interface EntryRow {
  id: string;
  user_id: string;
  content: string;
  primary_emotion: string;
  word_count: number;
  created_at: number;
  modified_at: number | null;
  is_deleted: number;
}

interface EntryEmotionRow {
  id: string;
  entry_id: string;
  emotion: string;
  type: string;
  order: number;
}

export function validateEntryContent(content: string): Result<string> {
  const trimmed = content.trim();
  if (trimmed.length < 1 || trimmed.length > 10000) {
    return { success: false, error: { type: 'validation', field: 'content', message: 'Content must be between 1 and 10000 characters' } };
  }
  return { success: true, data: trimmed };
}

export function validateEmotions(primaryEmotion: Emotion, secondaryEmotions: Emotion[]): Result<void> {
  if (!EMOTIONS.includes(primaryEmotion)) {
    return { success: false, error: { type: 'validation', field: 'primaryEmotion', message: 'Invalid primary emotion' } };
  }
  for (const emotion of secondaryEmotions) {
    if (!EMOTIONS.includes(emotion)) {
      return { success: false, error: { type: 'validation', field: 'secondaryEmotions', message: `Invalid secondary emotion: ${emotion}` } };
    }
    if (emotion === primaryEmotion) {
      return { success: false, error: { type: 'validation', field: 'secondaryEmotions', message: 'Secondary emotion cannot equal primary emotion' } };
    }
  }
  return { success: true, data: undefined };
}

export function checkDailyLimit(tier: Tier, existingTodayCount: number): Result<void> {
  if (tier === 'free' && existingTodayCount >= 1) {
    return { success: false, error: { type: 'validation', field: 'dailyLimit', message: 'Daily entry limit reached' } };
  }
  return { success: true, data: undefined };
}

export function mapToEntry(row: EntryRow, secondaryEmotions: readonly Emotion[] = []): Entry {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    primaryEmotion: row.primary_emotion as Emotion,
    secondaryEmotions,
    wordCount: row.word_count,
    createdAt: toDate(row.created_at)!,
    modifiedAt: toDate(row.modified_at),
    isDeleted: row.is_deleted === 1,
  };
}

function getTodayBounds(): { start: number; end: number } {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return { start, end: start + 86_400_000 };
}

function computeWordCount(content: string): number {
  return content.trim().split(/\s+/).filter(w => w.length > 0).length;
}

class EntryServiceImpl implements EntryService {
  createEntry(content: string, primaryEmotion: Emotion, secondaryEmotions: Emotion[], userId: string, tier: Tier): Entry {
    const contentResult = validateEntryContent(content);
    if (!contentResult.success) throw contentResult.error;

    const emotionsResult = validateEmotions(primaryEmotion, secondaryEmotions);
    if (!emotionsResult.success) throw emotionsResult.error;

    if (tier === 'free') {
      const { start, end } = getTodayBounds();
      const row = db.getFirstSync<{ count: number }>(
        'SELECT COUNT(*) as count FROM entries WHERE user_id = ? AND is_deleted = 0 AND created_at >= ? AND created_at < ?',
        [userId, start, end],
      );
      const limitResult = checkDailyLimit(tier, row?.count ?? 0);
      if (!limitResult.success) throw limitResult.error;
    }

    const trimmedContent = contentResult.data;
    const wordCount = computeWordCount(trimmedContent);
    const entryId = generateId();
    const createdAt = now();

    db.withTransactionSync(() => {
      db.runSync(
        'INSERT INTO entries (id, user_id, content, primary_emotion, word_count, created_at, is_deleted, last_modified_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
        [entryId, userId, trimmedContent, primaryEmotion, wordCount, createdAt, createdAt],
      );
      db.runSync(
        'INSERT INTO entry_emotions (id, entry_id, emotion, type, "order", last_modified_at) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), entryId, primaryEmotion, 'primary', 0, createdAt],
      );
      secondaryEmotions.forEach((emotion, i) => {
        db.runSync(
          'INSERT INTO entry_emotions (id, entry_id, emotion, type, "order", last_modified_at) VALUES (?, ?, ?, ?, ?, ?)',
          [generateId(), entryId, emotion, 'secondary', i + 1, createdAt],
        );
      });
    });

    return {
      id: entryId,
      userId,
      content: trimmedContent,
      primaryEmotion,
      secondaryEmotions,
      wordCount,
      createdAt: toDate(createdAt)!,
      modifiedAt: null,
      isDeleted: false,
    };
  }

  editEntry(id: string, content: string, primaryEmotion: Emotion, secondaryEmotions: Emotion[], userId: string, _tier: Tier): Entry {
    const contentResult = validateEntryContent(content);
    if (!contentResult.success) throw contentResult.error;

    const emotionsResult = validateEmotions(primaryEmotion, secondaryEmotions);
    if (!emotionsResult.success) throw emotionsResult.error;

    const entry = db.getFirstSync<EntryRow>('SELECT * FROM entries WHERE id = ?', [id]);
    const notFoundError: AppError = { type: 'validation', field: 'id', message: 'Entry not found' };
    if (!entry || entry.user_id !== userId || entry.is_deleted === 1) throw notFoundError;

    const trimmedContent = contentResult.data;
    const wordCount = computeWordCount(trimmedContent);
    const modifiedAt = now();

    db.withTransactionSync(() => {
      db.runSync(
        'UPDATE entries SET content = ?, primary_emotion = ?, word_count = ?, modified_at = ?, last_modified_at = ? WHERE id = ?',
        [trimmedContent, primaryEmotion, wordCount, modifiedAt, modifiedAt, id],
      );
      db.runSync('DELETE FROM entry_emotions WHERE entry_id = ?', [id]);
      db.runSync(
        'INSERT INTO entry_emotions (id, entry_id, emotion, type, "order", last_modified_at) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), id, primaryEmotion, 'primary', 0, modifiedAt],
      );
      secondaryEmotions.forEach((emotion, i) => {
        db.runSync(
          'INSERT INTO entry_emotions (id, entry_id, emotion, type, "order", last_modified_at) VALUES (?, ?, ?, ?, ?, ?)',
          [generateId(), id, emotion, 'secondary', i + 1, modifiedAt],
        );
      });
    });

    return {
      id,
      userId,
      content: trimmedContent,
      primaryEmotion,
      secondaryEmotions,
      wordCount,
      createdAt: toDate(entry.created_at)!,
      modifiedAt: toDate(modifiedAt),
      isDeleted: false,
    };
  }

  deleteEntry(id: string, userId: string): void {
    const entry = db.getFirstSync<EntryRow>('SELECT * FROM entries WHERE id = ?', [id]);
    const notFoundError: AppError = { type: 'validation', field: 'id', message: 'Entry not found' };
    if (!entry || entry.user_id !== userId || entry.is_deleted === 1) throw notFoundError;

    db.runSync('UPDATE entries SET is_deleted = 1, last_modified_at = ? WHERE id = ?', [now(), id]);
  }

  getEntries(options: { userId: string; limit?: number; offset?: number; date?: string }): Entry[] {
    let sql = 'SELECT * FROM entries WHERE is_deleted = 0 AND user_id = ?';
    const params: (string | number)[] = [options.userId];

    if (options.date) {
      const dayStart = new Date(options.date).getTime();
      sql += ' AND created_at >= ? AND created_at < ?';
      params.push(dayStart, dayStart + 86_400_000);
    }

    sql += ' ORDER BY created_at DESC';

    if (options.limit !== undefined) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options.offset !== undefined) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    const rows = db.getAllSync<EntryRow>(sql, params);
    return rows.map(row => mapToEntry(row));
  }

  getEntryCount(): number {
    const row = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM entries WHERE is_deleted = 0');
    return row?.count ?? 0;
  }

  getDailyEntryCount(date: string): number {
    const dayStart = new Date(date).getTime();
    const row = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM entries WHERE is_deleted = 0 AND created_at >= ? AND created_at < ?',
      [dayStart, dayStart + 86_400_000],
    );
    return row?.count ?? 0;
  }
}

export const entryService: EntryService = new EntryServiceImpl();
