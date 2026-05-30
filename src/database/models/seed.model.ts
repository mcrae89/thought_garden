import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export class Seed extends Model {
  static table = 'seeds';

  @field('user_id') userId!: string;
  @field('source_entry_id') sourceEntryId!: string | null;
  @field('source_achievement_id') sourceAchievementId!: string;
  @field('emotion') emotion!: string;
  @field('color_variation') colorVariation!: string | null;
  @readonly @date('earned_at') earnedAt!: Date;
  @field('is_planted') isPlanted!: boolean;
}
