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
  createEntry(content: string, primaryEmotion: Emotion, secondaryEmotions: Emotion[], userId: string, tier: Tier): Entry;
  editEntry(id: string, content: string, primaryEmotion: Emotion, secondaryEmotions: Emotion[], userId: string, tier: Tier): Entry;
  deleteEntry(id: string, userId: string): void;
  getEntries(options: { limit?: number; offset?: number; date?: string }): Entry[];
  getEntryCount(): number;
  getDailyEntryCount(date: string): number;
}

export { entryService } from './entry-service';
