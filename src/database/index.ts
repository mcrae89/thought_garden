import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

const db: SQLiteDatabase = openDatabaseSync('thought_garden.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    primary_emotion TEXT NOT NULL,
    word_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    modified_at INTEGER,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    last_modified_at INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS entry_emotions (
    id TEXT PRIMARY KEY,
    entry_id TEXT NOT NULL,
    emotion TEXT NOT NULL,
    type TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    last_modified_at INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS seeds (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    source_entry_id TEXT,
    source_achievement_id TEXT NOT NULL,
    emotion TEXT NOT NULL,
    color_variation TEXT,
    earned_at INTEGER NOT NULL,
    is_planted INTEGER NOT NULL DEFAULT 0,
    last_modified_at INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS plants (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    seed_id TEXT NOT NULL,
    emotion TEXT NOT NULL,
    color_variation TEXT,
    growth_stage TEXT NOT NULL DEFAULT 'seed',
    location TEXT NOT NULL DEFAULT 'garden',
    plot_position INTEGER,
    planted_at INTEGER NOT NULL,
    last_watered_at INTEGER,
    last_growth_date TEXT,
    last_modified_at INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS achievement_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_type TEXT NOT NULL,
    achievement_key TEXT NOT NULL,
    trigger_entry_id TEXT,
    earned_at INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    last_modified_at INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS user_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    total_entries INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    last_entry_date TEXT,
    consecutive_same_emotion INTEGER NOT NULL DEFAULT 0,
    last_emotion TEXT,
    tier TEXT NOT NULL DEFAULT 'free',
    last_modified_at INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
  CREATE INDEX IF NOT EXISTS idx_entries_user_created ON entries(user_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_seeds_user_planted ON seeds(user_id, is_planted);
  CREATE INDEX IF NOT EXISTS idx_plants_user_location ON plants(user_id, location);
  CREATE INDEX IF NOT EXISTS idx_entry_emotions_entry_id ON entry_emotions(entry_id);
  CREATE INDEX IF NOT EXISTS idx_achievement_records_user ON achievement_records(user_id);
`);

export { db };
