import { Model, type Query } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';
import type { EntryEmotion } from './entry-emotion.model';

export class Entry extends Model {
  static table = 'entries';
  static associations = {
    entry_emotions: { type: 'has_many' as const, foreignKey: 'entry_id' },
  };

  @field('user_id') userId!: string;
  @field('content') content!: string;
  @field('primary_emotion') primaryEmotion!: string;
  @field('word_count') wordCount!: number;
  @readonly @date('created_at') createdAt!: Date;
  @date('modified_at') modifiedAt!: Date | null;
  @field('is_deleted') isDeleted!: boolean;
  @children('entry_emotions') emotions!: Query<EntryEmotion>;
}
