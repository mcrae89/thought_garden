import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Plant extends Model {
  static table = 'plants';

  @field('user_id') userId!: string;
  @field('seed_id') seedId!: string;
  @field('emotion') emotion!: string;
  @field('color_variation') colorVariation!: string | null;
  @field('growth_stage') growthStage!: string;
  @field('location') location!: string;
  @field('plot_position') plotPosition!: number | null;
  @readonly @date('planted_at') plantedAt!: Date;
  @date('last_watered_at') lastWateredAt!: Date | null;
  @field('last_growth_date') lastGrowthDate!: string | null;
}
