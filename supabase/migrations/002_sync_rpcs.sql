-- 002_sync_rpcs.sql
-- Sync RPC functions for WatermelonDB synchronize() protocol
-- Also creates user_stats table and last_modified_at triggers

-- =============================================================================
-- User Stats table (needed for sync, not in 001)
-- =============================================================================

CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  total_entries INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_entry_date TEXT,
  consecutive_same_emotion INTEGER NOT NULL DEFAULT 0,
  last_emotion TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'paid')),
  last_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX idx_user_stats_last_modified ON user_stats(last_modified_at);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own stats"
  ON user_stats FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- Trigger: auto-update last_modified_at on UPDATE
-- =============================================================================

CREATE OR REPLACE FUNCTION update_last_modified_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entries_last_modified
  BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION update_last_modified_at();

CREATE TRIGGER entry_emotions_last_modified
  BEFORE UPDATE ON entry_emotions
  FOR EACH ROW EXECUTE FUNCTION update_last_modified_at();

CREATE TRIGGER seeds_last_modified
  BEFORE UPDATE ON seeds
  FOR EACH ROW EXECUTE FUNCTION update_last_modified_at();

CREATE TRIGGER plants_last_modified
  BEFORE UPDATE ON plants
  FOR EACH ROW EXECUTE FUNCTION update_last_modified_at();

CREATE TRIGGER achievement_records_last_modified
  BEFORE UPDATE ON achievement_records
  FOR EACH ROW EXECUTE FUNCTION update_last_modified_at();

CREATE TRIGGER user_stats_last_modified
  BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_last_modified_at();

-- =============================================================================
-- pull_changes: returns all rows modified since last_pulled_at for the authed user
-- =============================================================================

CREATE OR REPLACE FUNCTION pull_changes(
  last_pulled_at BIGINT DEFAULT 0,
  schema_version INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _since TIMESTAMPTZ;
  _uid UUID := auth.uid();
  _ts BIGINT;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Convert millisecond epoch to timestamptz; 0 means pull everything
  _since := CASE WHEN last_pulled_at = 0
    THEN '1970-01-01'::TIMESTAMPTZ
    ELSE to_timestamp(last_pulled_at / 1000.0)
  END;

  -- Current server time as millisecond epoch
  _ts := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;

  RETURN jsonb_build_object(
    'changes', jsonb_build_object(
      'entries', jsonb_build_object(
        'created', '[]'::JSONB,
        'updated', COALESCE((
          SELECT jsonb_agg(to_jsonb(r))
          FROM (
            SELECT id, user_id, content, primary_emotion, word_count,
                   created_at, modified_at, is_deleted, _status, _changed,
                   last_modified_at
            FROM entries
            WHERE user_id = _uid AND last_modified_at > _since
          ) r
        ), '[]'::JSONB),
        'deleted', COALESCE((
          SELECT jsonb_agg(id::TEXT)
          FROM entries
          WHERE user_id = _uid AND is_deleted = TRUE AND last_modified_at > _since
        ), '[]'::JSONB)
      ),
      'entry_emotions', jsonb_build_object(
        'created', '[]'::JSONB,
        'updated', COALESCE((
          SELECT jsonb_agg(to_jsonb(r))
          FROM (
            SELECT ee.id, ee.entry_id, ee.emotion, ee.type, ee."order",
                   ee.last_modified_at
            FROM entry_emotions ee
            INNER JOIN entries e ON e.id = ee.entry_id
            WHERE e.user_id = _uid AND ee.last_modified_at > _since
          ) r
        ), '[]'::JSONB),
        'deleted', '[]'::JSONB
      ),
      'seeds', jsonb_build_object(
        'created', '[]'::JSONB,
        'updated', COALESCE((
          SELECT jsonb_agg(to_jsonb(r))
          FROM (
            SELECT id, user_id, source_entry_id, source_achievement_id,
                   emotion, color_variation, earned_at, is_planted, last_modified_at
            FROM seeds
            WHERE user_id = _uid AND last_modified_at > _since
          ) r
        ), '[]'::JSONB),
        'deleted', '[]'::JSONB
      ),
      'plants', jsonb_build_object(
        'created', '[]'::JSONB,
        'updated', COALESCE((
          SELECT jsonb_agg(to_jsonb(r))
          FROM (
            SELECT id, user_id, seed_id, emotion, color_variation, growth_stage,
                   location, plot_position, planted_at, last_watered_at,
                   last_growth_date, last_modified_at
            FROM plants
            WHERE user_id = _uid AND last_modified_at > _since
          ) r
        ), '[]'::JSONB),
        'deleted', '[]'::JSONB
      ),
      'achievement_records', jsonb_build_object(
        'created', '[]'::JSONB,
        'updated', COALESCE((
          SELECT jsonb_agg(to_jsonb(r))
          FROM (
            SELECT id, user_id, achievement_type, achievement_key,
                   trigger_entry_id, earned_at, is_active, last_modified_at
            FROM achievement_records
            WHERE user_id = _uid AND last_modified_at > _since
          ) r
        ), '[]'::JSONB),
        'deleted', '[]'::JSONB
      ),
      'user_stats', jsonb_build_object(
        'created', '[]'::JSONB,
        'updated', COALESCE((
          SELECT jsonb_agg(to_jsonb(r))
          FROM (
            SELECT id, user_id, total_entries, current_streak, last_entry_date,
                   consecutive_same_emotion, last_emotion, tier, last_modified_at
            FROM user_stats
            WHERE user_id = _uid AND last_modified_at > _since
          ) r
        ), '[]'::JSONB),
        'deleted', '[]'::JSONB
      )
    ),
    'timestamp', _ts
  );
END;
$$;

-- =============================================================================
-- push_changes: upserts client changes into the database
-- =============================================================================

CREATE OR REPLACE FUNCTION push_changes(
  changes JSONB,
  last_pulled_at BIGINT DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _now TIMESTAMPTZ := NOW();
  _record JSONB;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- === ENTRIES ===
  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'entries'->'created', '[]'::JSONB) ||
    COALESCE(changes->'entries'->'updated', '[]'::JSONB)
  )
  LOOP
    INSERT INTO entries (id, user_id, content, primary_emotion, word_count,
                         created_at, modified_at, is_deleted, _status, _changed, last_modified_at)
    VALUES (
      (_record->>'id')::UUID,
      _uid,
      _record->>'content',
      _record->>'primary_emotion',
      COALESCE((_record->>'word_count')::INT, 0),
      COALESCE((_record->>'created_at')::TIMESTAMPTZ, _now),
      (_record->>'modified_at')::TIMESTAMPTZ,
      COALESCE((_record->>'is_deleted')::BOOLEAN, FALSE),
      _record->>'_status',
      _record->>'_changed',
      _now
    )
    ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content,
      primary_emotion = EXCLUDED.primary_emotion,
      word_count = EXCLUDED.word_count,
      modified_at = EXCLUDED.modified_at,
      is_deleted = EXCLUDED.is_deleted,
      _status = EXCLUDED._status,
      _changed = EXCLUDED._changed,
      last_modified_at = _now;
  END LOOP;

  -- Handle deleted entries
  FOR _record IN SELECT jsonb_array_elements_text(
    COALESCE(changes->'entries'->'deleted', '[]'::JSONB)
  )
  LOOP
    UPDATE entries SET is_deleted = TRUE, last_modified_at = _now
    WHERE id = _record::UUID AND user_id = _uid;
  END LOOP;

  -- === ENTRY_EMOTIONS ===
  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'entry_emotions'->'created', '[]'::JSONB) ||
    COALESCE(changes->'entry_emotions'->'updated', '[]'::JSONB)
  )
  LOOP
    INSERT INTO entry_emotions (id, entry_id, emotion, type, "order", last_modified_at)
    VALUES (
      (_record->>'id')::UUID,
      (_record->>'entry_id')::UUID,
      _record->>'emotion',
      _record->>'type',
      COALESCE((_record->>'order')::INT, 0),
      _now
    )
    ON CONFLICT (id) DO UPDATE SET
      emotion = EXCLUDED.emotion,
      type = EXCLUDED.type,
      "order" = EXCLUDED."order",
      last_modified_at = _now;
  END LOOP;

  -- Handle deleted entry_emotions
  FOR _record IN SELECT jsonb_array_elements_text(
    COALESCE(changes->'entry_emotions'->'deleted', '[]'::JSONB)
  )
  LOOP
    DELETE FROM entry_emotions WHERE id = _record::UUID
      AND entry_id IN (SELECT id FROM entries WHERE user_id = _uid);
  END LOOP;

  -- === SEEDS ===
  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'seeds'->'created', '[]'::JSONB) ||
    COALESCE(changes->'seeds'->'updated', '[]'::JSONB)
  )
  LOOP
    INSERT INTO seeds (id, user_id, source_entry_id, source_achievement_id,
                       emotion, color_variation, earned_at, is_planted, last_modified_at)
    VALUES (
      (_record->>'id')::UUID,
      _uid,
      (_record->>'source_entry_id')::UUID,
      (_record->>'source_achievement_id')::UUID,
      _record->>'emotion',
      _record->>'color_variation',
      COALESCE((_record->>'earned_at')::TIMESTAMPTZ, _now),
      COALESCE((_record->>'is_planted')::BOOLEAN, FALSE),
      _now
    )
    ON CONFLICT (id) DO UPDATE SET
      source_entry_id = EXCLUDED.source_entry_id,
      emotion = EXCLUDED.emotion,
      color_variation = EXCLUDED.color_variation,
      is_planted = EXCLUDED.is_planted,
      last_modified_at = _now;
  END LOOP;

  -- Handle deleted seeds
  FOR _record IN SELECT jsonb_array_elements_text(
    COALESCE(changes->'seeds'->'deleted', '[]'::JSONB)
  )
  LOOP
    DELETE FROM seeds WHERE id = _record::UUID AND user_id = _uid;
  END LOOP;

  -- === PLANTS ===
  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'plants'->'created', '[]'::JSONB) ||
    COALESCE(changes->'plants'->'updated', '[]'::JSONB)
  )
  LOOP
    INSERT INTO plants (id, user_id, seed_id, emotion, color_variation, growth_stage,
                        location, plot_position, planted_at, last_watered_at,
                        last_growth_date, last_modified_at)
    VALUES (
      (_record->>'id')::UUID,
      _uid,
      (_record->>'seed_id')::UUID,
      _record->>'emotion',
      _record->>'color_variation',
      COALESCE(_record->>'growth_stage', 'seed'),
      COALESCE(_record->>'location', 'garden'),
      (_record->>'plot_position')::INT,
      COALESCE((_record->>'planted_at')::TIMESTAMPTZ, _now),
      (_record->>'last_watered_at')::TIMESTAMPTZ,
      (_record->>'last_growth_date')::DATE,
      _now
    )
    ON CONFLICT (id) DO UPDATE SET
      emotion = EXCLUDED.emotion,
      color_variation = EXCLUDED.color_variation,
      growth_stage = EXCLUDED.growth_stage,
      location = EXCLUDED.location,
      plot_position = EXCLUDED.plot_position,
      last_watered_at = EXCLUDED.last_watered_at,
      last_growth_date = EXCLUDED.last_growth_date,
      last_modified_at = _now;
  END LOOP;

  -- Handle deleted plants
  FOR _record IN SELECT jsonb_array_elements_text(
    COALESCE(changes->'plants'->'deleted', '[]'::JSONB)
  )
  LOOP
    DELETE FROM plants WHERE id = _record::UUID AND user_id = _uid;
  END LOOP;

  -- === ACHIEVEMENT_RECORDS ===
  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'achievement_records'->'created', '[]'::JSONB) ||
    COALESCE(changes->'achievement_records'->'updated', '[]'::JSONB)
  )
  LOOP
    INSERT INTO achievement_records (id, user_id, achievement_type, achievement_key,
                                     trigger_entry_id, earned_at, is_active, last_modified_at)
    VALUES (
      (_record->>'id')::UUID,
      _uid,
      _record->>'achievement_type',
      _record->>'achievement_key',
      (_record->>'trigger_entry_id')::UUID,
      COALESCE((_record->>'earned_at')::TIMESTAMPTZ, _now),
      COALESCE((_record->>'is_active')::BOOLEAN, TRUE),
      _now
    )
    ON CONFLICT (id) DO UPDATE SET
      achievement_type = EXCLUDED.achievement_type,
      trigger_entry_id = EXCLUDED.trigger_entry_id,
      is_active = EXCLUDED.is_active,
      last_modified_at = _now;
  END LOOP;

  -- Handle deleted achievement_records
  FOR _record IN SELECT jsonb_array_elements_text(
    COALESCE(changes->'achievement_records'->'deleted', '[]'::JSONB)
  )
  LOOP
    DELETE FROM achievement_records WHERE id = _record::UUID AND user_id = _uid;
  END LOOP;

  -- === USER_STATS ===
  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'user_stats'->'created', '[]'::JSONB) ||
    COALESCE(changes->'user_stats'->'updated', '[]'::JSONB)
  )
  LOOP
    INSERT INTO user_stats (id, user_id, total_entries, current_streak, last_entry_date,
                            consecutive_same_emotion, last_emotion, tier, last_modified_at)
    VALUES (
      (_record->>'id')::UUID,
      _uid,
      COALESCE((_record->>'total_entries')::INT, 0),
      COALESCE((_record->>'current_streak')::INT, 0),
      _record->>'last_entry_date',
      COALESCE((_record->>'consecutive_same_emotion')::INT, 0),
      _record->>'last_emotion',
      COALESCE(_record->>'tier', 'free'),
      _now
    )
    ON CONFLICT (id) DO UPDATE SET
      total_entries = EXCLUDED.total_entries,
      current_streak = EXCLUDED.current_streak,
      last_entry_date = EXCLUDED.last_entry_date,
      consecutive_same_emotion = EXCLUDED.consecutive_same_emotion,
      last_emotion = EXCLUDED.last_emotion,
      tier = EXCLUDED.tier,
      last_modified_at = _now;
  END LOOP;

  -- Handle deleted user_stats
  FOR _record IN SELECT jsonb_array_elements_text(
    COALESCE(changes->'user_stats'->'deleted', '[]'::JSONB)
  )
  LOOP
    DELETE FROM user_stats WHERE id = _record::UUID AND user_id = _uid;
  END LOOP;
END;
$$;

-- =============================================================================
-- Grant execute to authenticated users
-- =============================================================================

GRANT EXECUTE ON FUNCTION pull_changes(BIGINT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION push_changes(JSONB, BIGINT) TO authenticated;
