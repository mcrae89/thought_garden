import { Q } from '@nozbe/watermelondb';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { database } from '@/database';
import { Entry as EntryModel } from '@/database/models/entry.model';
import { EntryEmotion as EntryEmotionModel } from '@/database/models/entry-emotion.model';
import { EMOTIONS, type Emotion, type Tier } from '@/shared/types';
import type { AppError, Result } from '@/shared/result';
import type { Entry, EntryService } from './index';

export function validateEntryContent(content: string): Result<string> {
  const trimmed = content.trim();
  if (trimmed.length < 1 || content.length > 10000) {
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

export function mapToEntry(model: EntryModel, secondaryEmotions: readonly Emotion[] = []): Entry {
  return {
    id: model.id,
    userId: model.userId,
    content: model.content,
    primaryEmotion: model.primaryEmotion as Emotion,
    secondaryEmotions,
    wordCount: model.wordCount,
    createdAt: model.createdAt,
    modifiedAt: model.modifiedAt,
    isDeleted: model.isDeleted,
  };
}

function getTodayBounds(): { start: number; end: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = start + 86_400_000;
  return { start, end };
}

function computeWordCount(content: string): number {
  return content.trim().split(/\s+/).filter(w => w.length > 0).length;
}

class EntryServiceImpl implements EntryService {
  async createEntry(content: string, primaryEmotion: Emotion, secondaryEmotions: Emotion[], userId: string, tier: Tier): Promise<Entry> {
    const contentResult = validateEntryContent(content);
    if (!contentResult.success) throw contentResult.error;

    const emotionsResult = validateEmotions(primaryEmotion, secondaryEmotions);
    if (!emotionsResult.success) throw emotionsResult.error;

    if (tier === 'free') {
      const { start, end } = getTodayBounds();
      const todayCount = await database.get<EntryModel>('entries')
        .query(
          Q.where('user_id', userId),
          Q.where('is_deleted', false),
          Q.where('created_at', Q.gte(start)),
          Q.where('created_at', Q.lt(end)),
        )
        .fetchCount();
      const limitResult = checkDailyLimit(tier, todayCount);
      if (!limitResult.success) throw limitResult.error;
    }

    const wordCount = computeWordCount(content);
    let createdEntry: EntryModel | undefined;

    await database.write(async () => {
      const entries = database.get<EntryModel>('entries');
      const entryEmotions = database.get<EntryEmotionModel>('entry_emotions');

      const newEntry = entries.prepareCreate((e) => {
        e.userId = userId;
        e.content = content;
        e.primaryEmotion = primaryEmotion;
        e.wordCount = wordCount;
        e.isDeleted = false;
      });

      const primaryRecord = entryEmotions.prepareCreate((em) => {
        em.entryId = newEntry.id;
        em.emotion = primaryEmotion;
        em.type = 'primary';
        em.order = 0;
      });

      const secondaryRecords = secondaryEmotions.map((emotion, index) =>
        entryEmotions.prepareCreate((em) => {
          em.entryId = newEntry.id;
          em.emotion = emotion;
          em.type = 'secondary';
          em.order = index + 1;
        }),
      );

      await database.batch(newEntry, primaryRecord, ...secondaryRecords);
      createdEntry = newEntry;
    });

    return mapToEntry(createdEntry!, secondaryEmotions);
  }

  async editEntry(id: string, content: string, primaryEmotion: Emotion, secondaryEmotions: Emotion[], userId: string, _tier: Tier): Promise<Entry> {
    const contentResult = validateEntryContent(content);
    if (!contentResult.success) throw contentResult.error;

    const emotionsResult = validateEmotions(primaryEmotion, secondaryEmotions);
    if (!emotionsResult.success) throw emotionsResult.error;

    const entry = await database.get<EntryModel>('entries').find(id);
    const notFoundError: AppError = { type: 'validation', field: 'id', message: 'Entry not found' };
    if (entry.userId !== userId) throw notFoundError;
    if (entry.isDeleted) throw notFoundError;

    const wordCount = computeWordCount(content);

    await database.write(async () => {
      const existingEmotions = await entry.emotions.fetch();
      const deletions = existingEmotions.map(em => em.prepareDestroyPermanently());

      const entryEmotions = database.get<EntryEmotionModel>('entry_emotions');
      const primaryRecord = entryEmotions.prepareCreate((em) => {
        em.entryId = entry.id;
        em.emotion = primaryEmotion;
        em.type = 'primary';
        em.order = 0;
      });
      const secondaryRecords = secondaryEmotions.map((emotion, index) =>
        entryEmotions.prepareCreate((em) => {
          em.entryId = entry.id;
          em.emotion = emotion;
          em.type = 'secondary';
          em.order = index + 1;
        }),
      );

      const updatedEntry = entry.prepareUpdate((e) => {
        e.content = content;
        e.primaryEmotion = primaryEmotion;
        e.wordCount = wordCount;
        e.modifiedAt = new Date();
      });

      await database.batch(updatedEntry, ...deletions, primaryRecord, ...secondaryRecords);
    });

    return mapToEntry(entry, secondaryEmotions);
  }

  async deleteEntry(id: string, userId: string): Promise<void> {
    const entry = await database.get<EntryModel>('entries').find(id);
    const notFoundError: AppError = { type: 'validation', field: 'id', message: 'Entry not found' };
    if (entry.userId !== userId) throw notFoundError;
    if (entry.isDeleted) throw notFoundError;

    await database.write(async () => {
      await entry.update((e) => {
        e.isDeleted = true;
      });
    });
  }

  getEntries(options: { limit?: number; offset?: number; date?: string }): Observable<Entry[]> {
    let query = database.get<EntryModel>('entries').query(
      Q.where('is_deleted', false),
      Q.sortBy('created_at', Q.desc),
    );

    if (options.date) {
      const dayStart = new Date(options.date).getTime();
      const dayEnd = dayStart + 86_400_000;
      query = query.extend(
        Q.where('created_at', Q.gte(dayStart)),
        Q.where('created_at', Q.lt(dayEnd)),
      );
    }
    if (options.limit !== undefined) {
      query = query.extend(Q.take(options.limit));
    }
    if (options.offset !== undefined) {
      query = query.extend(Q.skip(options.offset));
    }

    return (query.observe() as Observable<EntryModel[]>).pipe(
      map(entries => entries.map(e => mapToEntry(e))),
    );
  }

  async getEntryCount(): Promise<number> {
    return database.get<EntryModel>('entries')
      .query(Q.where('is_deleted', false))
      .fetchCount();
  }

  async getDailyEntryCount(date: string): Promise<number> {
    const dayStart = new Date(date).getTime();
    const dayEnd = dayStart + 86_400_000;
    return database.get<EntryModel>('entries')
      .query(
        Q.where('is_deleted', false),
        Q.where('created_at', Q.gte(dayStart)),
        Q.where('created_at', Q.lt(dayEnd)),
      )
      .fetchCount();
  }
}

export const entryService: EntryService = new EntryServiceImpl();
