-- 001_initial_schema.sql
-- Thought Garden initial database schema

-- Users table (extends Supabase Auth)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Entries
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL CHECK (char_length(content) <= 10000),
  primary_emotion TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modified_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  _status TEXT,
  _changed TEXT,
  last_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Entry emotions
CREATE TABLE entry_emotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  emotion TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('primary', 'secondary')),
  "order" INTEGER NOT NULL DEFAULT 0,
  last_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seeds
CREATE TABLE seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  source_entry_id UUID REFERENCES entries(id),
  source_achievement_id UUID NOT NULL,
  emotion TEXT NOT NULL,
  color_variation TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_planted BOOLEAN NOT NULL DEFAULT FALSE,
  last_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plants
CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  seed_id UUID NOT NULL REFERENCES seeds(id),
  emotion TEXT NOT NULL,
  color_variation TEXT,
  growth_stage TEXT NOT NULL DEFAULT 'seed'
    CHECK (growth_stage IN ('seed', 'sprout', 'full', 'bloom')),
  location TEXT NOT NULL DEFAULT 'garden'
    CHECK (location IN ('garden', 'greenhouse')),
  plot_position INTEGER,
  planted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_watered_at TIMESTAMPTZ,
  last_growth_date DATE,
  last_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Achievement records
CREATE TABLE achievement_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  achievement_type TEXT NOT NULL,
  achievement_key TEXT NOT NULL,
  trigger_entry_id UUID REFERENCES entries(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

-- Indexes on foreign keys and sync columns
CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_last_modified ON entries(last_modified_at);

CREATE INDEX idx_entry_emotions_entry_id ON entry_emotions(entry_id);
CREATE INDEX idx_entry_emotions_last_modified ON entry_emotions(last_modified_at);

CREATE INDEX idx_seeds_user_id ON seeds(user_id);
CREATE INDEX idx_seeds_last_modified ON seeds(last_modified_at);

CREATE INDEX idx_plants_user_id ON plants(user_id);
CREATE INDEX idx_plants_last_modified ON plants(last_modified_at);

CREATE INDEX idx_achievement_records_user_id ON achievement_records(user_id);
CREATE INDEX idx_achievement_records_key ON achievement_records(achievement_key);
CREATE INDEX idx_achievement_records_last_modified ON achievement_records(last_modified_at);

CREATE INDEX idx_user_profiles_last_modified ON user_profiles(last_modified_at);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_emotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access own profile"
  ON user_profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access own entries"
  ON entries FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own entry_emotions"
  ON entry_emotions FOR ALL USING (
    entry_id IN (SELECT id FROM entries WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can only access own seeds"
  ON seeds FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own plants"
  ON plants FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own achievements"
  ON achievement_records FOR ALL USING (auth.uid() = user_id);
