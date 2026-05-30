import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import type { Entry } from './entry.model';
import type { Relation } from '@nozbe/watermelondb';

export class EntryEmotion extends Model {
  static table = 'entry_emotions';
  static associations = {
    entries: { type: 'belongs_to' as const, key: 'entry_id' },
  };

  @field('entry_id') entryId!: string;
  @field('emotion') emotion!: string;
  @field('type') type!: string;
  @field('order') order!: number;
  @relation('entries', 'entry_id') entry!: Relation<Entry>;
}
