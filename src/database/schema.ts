import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'entries',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'content', type: 'string' },
        { name: 'primary_emotion', type: 'string' },
        { name: 'word_count', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'modified_at', type: 'number', isOptional: true },
        { name: 'is_deleted', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'entry_emotions',
      columns: [
        { name: 'entry_id', type: 'string', isIndexed: true },
        { name: 'emotion', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'order', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'seeds',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'source_entry_id', type: 'string', isOptional: true },
        { name: 'source_achievement_id', type: 'string' },
        { name: 'emotion', type: 'string' },
        { name: 'color_variation', type: 'string', isOptional: true },
        { name: 'earned_at', type: 'number' },
        { name: 'is_planted', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'plants',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'seed_id', type: 'string' },
        { name: 'emotion', type: 'string' },
        { name: 'color_variation', type: 'string', isOptional: true },
        { name: 'growth_stage', type: 'string' },
        { name: 'location', type: 'string' },
        { name: 'plot_position', type: 'number', isOptional: true },
        { name: 'planted_at', type: 'number' },
        { name: 'last_watered_at', type: 'number', isOptional: true },
        { name: 'last_growth_date', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'achievement_records',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'achievement_type', type: 'string' },
        { name: 'achievement_key', type: 'string', isIndexed: true },
        { name: 'trigger_entry_id', type: 'string', isOptional: true },
        { name: 'earned_at', type: 'number' },
        { name: 'is_active', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'user_stats',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'total_entries', type: 'number' },
        { name: 'current_streak', type: 'number' },
        { name: 'last_entry_date', type: 'string', isOptional: true },
        { name: 'consecutive_same_emotion', type: 'number' },
        { name: 'last_emotion', type: 'string', isOptional: true },
        { name: 'tier', type: 'string' },
      ],
    }),
  ],
});
