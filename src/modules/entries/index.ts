import type { Observable } from 'rxjs';
import type { Emotion, Tier } from '@/shared/types';

export interface Entry {
  readonly id: string;
  readonly userId: string;
  readonly content: string;
  readonly primaryEmotion: Emotion;
  readonly secondaryEmotions: readonly Emotion[];
  readonly wordCount: number;
  readonly createdAt: Date;
  readonly modifiedAt: Date | null;
  readonly isDeleted: boolean;
}

export interface EntryEmotion {
  readonly id: string;
  readonly entryId: string;
  readonly emotion: Emotion;
  readonly type: 'primary' | 'secondary';
  readonly order: number;
}

export interface EntryService {
  createEntry(content: string, primaryEmotion: Emotion, secondaryEmotions: Emotion[], userId: string, tier: Tier): Promise<Entry>;
  editEntry(id: string, content: string, primaryEmotion: Emotion, secondaryEmotions: Emotion[], userId: string, tier: Tier): Promise<Entry>;
  deleteEntry(id: string, userId: string): Promise<void>;
  getEntries(options: { limit?: number; offset?: number; date?: string }): Observable<Entry[]>;
  getEntryCount(): Promise<number>;
  getDailyEntryCount(date: string): Promise<number>;
}

export { entryService } from './entry-service';
