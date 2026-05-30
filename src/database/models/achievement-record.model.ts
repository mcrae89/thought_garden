import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class AchievementRecord extends Model {
  static table = 'achievement_records';

  @field('user_id') userId!: string;
  @field('achievement_type') achievementType!: string;
  @field('achievement_key') achievementKey!: string;
  @field('trigger_entry_id') triggerEntryId!: string | null;
  @readonly @date('earned_at') earnedAt!: Date;
  @field('is_active') isActive!: boolean;
}
