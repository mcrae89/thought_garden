import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class UserStats extends Model {
  static table = 'user_stats';

  @field('user_id') userId!: string;
  @field('total_entries') totalEntries!: number;
  @field('current_streak') currentStreak!: number;
  @field('last_entry_date') lastEntryDate!: string | null;
  @field('consecutive_same_emotion') consecutiveSameEmotion!: number;
  @field('last_emotion') lastEmotion!: string | null;
  @field('tier') tier!: string;
}
