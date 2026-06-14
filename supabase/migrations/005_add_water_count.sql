-- 005_add_water_count.sql
-- Add water_count to plants for tracking watering progress toward growth stages.

ALTER TABLE plants ADD COLUMN IF NOT EXISTS water_count INTEGER NOT NULL DEFAULT 0;

-- Update pull_changes to include water_count
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

  _since := CASE WHEN last_pulled_at = 0
    THEN '1970-01-01'::TIMESTAMPTZ
    ELSE to_timestamp(last_pulled_at / 1000.0)
  END;

  _ts := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;

  RETURN jsonb_build_object(
    'changes', jsonb_build_object(
      'entries', jsonb_build_object(
        'created', '[]'::JSONB,
        'updated', COALESCE((
          SELECT jsonb_agg(to_jsonb(r))
          FROM (
            SELECT id, user_id, content, primary_emotion, word_count,
                   created_at, modified_at, is_deleted, last_modified_at
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
            SELECT ee.id, ee.entry_id, ee.emotion, ee.type, ee."order", ee.last_modified_at
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
                   last_growth_date, water_count, last_modified_at
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

-- Update push_changes to handle water_count
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
  _since TIMESTAMPTZ := CASE WHEN last_pulled_at = 0
    THEN '1970-01-01'::TIMESTAMPTZ
    ELSE to_timestamp(last_pulled_at / 1000.0)
  END;
  _record JSONB;
  _client_ts TIMESTAMPTZ;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Deleted entries
  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'entries'->'deleted', '[]'::JSONB)
  )
  LOOP
    UPDATE entries SET is_deleted = TRUE, last_modified_at = _now
    WHERE id = (_record->>'id')::UUID AND user_id = _uid;
  END LOOP;

  -- Updated/created entries
  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'entries'->'created', '[]'::JSONB) ||
    COALESCE(changes->'entries'->'updated', '[]'::JSONB)
  )
  LOOP
    _client_ts := CASE WHEN _record->>'last_modified_at' IS NOT NULL
      THEN to_timestamp((_record->>'last_modified_at')::BIGINT / 1000.0)
      ELSE _now END;
    INSERT INTO entries (id, user_id, content, primary_emotion, word_count,
                         created_at, modified_at, is_deleted, last_modified_at)
    VALUES (
      (_record->>'id')::UUID, _uid, _record->>'content', _record->>'primary_emotion',
      COALESCE((_record->>'word_count')::INT, 0),
      COALESCE(to_timestamp((_record->>'created_at')::BIGINT / 1000.0), _now),
      CASE WHEN _record->>'modified_at' IS NULL THEN NULL
           ELSE to_timestamp((_record->>'modified_at')::BIGINT / 1000.0) END,
      COALESCE((_record->>'is_deleted')::BOOLEAN, FALSE), _client_ts
    )
    ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content, primary_emotion = EXCLUDED.primary_emotion,
      word_count = EXCLUDED.word_count, modified_at = EXCLUDED.modified_at,
      is_deleted = EXCLUDED.is_deleted, last_modified_at = EXCLUDED.last_modified_at
    WHERE entries.user_id = _uid AND entries.last_modified_at <= _since;
  END LOOP;

  -- Entry emotions
  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'entry_emotions'->'created', '[]'::JSONB) ||
    COALESCE(changes->'entry_emotions'->'updated', '[]'::JSONB)
  )
  LOOP
    _client_ts := CASE WHEN _record->>'last_modified_at' IS NOT NULL
      THEN to_timestamp((_record->>'last_modified_at')::BIGINT / 1000.0)
      ELSE _now END;
    INSERT INTO entry_emotions (id, entry_id, emotion, type, "order", last_modified_at)
    VALUES ((_record->>'id')::UUID, (_record->>'entry_id')::UUID, _record->>'emotion',
            _record->>'type', COALESCE((_record->>'order')::INT, 0), _client_ts)
    ON CONFLICT (id) DO UPDATE SET
      emotion = EXCLUDED.emotion, type = EXCLUDED.type,
      "order" = EXCLUDED."order", last_modified_at = EXCLUDED.last_modified_at
    WHERE entry_emotions.last_modified_at <= _since;
  END LOOP;

  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'entry_emotions'->'deleted', '[]'::JSONB)
  )
  LOOP
    DELETE FROM entry_emotions WHERE id = (_record->>'id')::UUID
      AND entry_id IN (SELECT id FROM entries WHERE user_id = _uid);
  END LOOP;

  -- Seeds
  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'seeds'->'created', '[]'::JSONB) ||
    COALESCE(changes->'seeds'->'updated', '[]'::JSONB)
  )
  LOOP
    _client_ts := CASE WHEN _record->>'last_modified_at' IS NOT NULL
      THEN to_timestamp((_record->>'last_modified_at')::BIGINT / 1000.0)
      ELSE _now END;
    INSERT INTO seeds (id, user_id, source_entry_id, source_achievement_id,
                       emotion, color_variation, earned_at, is_planted, last_modified_at)
    VALUES ((_record->>'id')::UUID, _uid, (_record->>'source_entry_id')::UUID,
            (_record->>'source_achievement_id')::UUID, _record->>'emotion',
            _record->>'color_variation',
            COALESCE(to_timestamp((_record->>'earned_at')::BIGINT / 1000.0), _now),
            COALESCE((_record->>'is_planted')::BOOLEAN, FALSE), _client_ts)
    ON CONFLICT (id) DO UPDATE SET
      source_entry_id = EXCLUDED.source_entry_id, emotion = EXCLUDED.emotion,
      color_variation = EXCLUDED.color_variation, is_planted = EXCLUDED.is_planted,
      last_modified_at = EXCLUDED.last_modified_at
    WHERE seeds.user_id = _uid AND seeds.last_modified_at <= _since;
  END LOOP;

  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'seeds'->'deleted', '[]'::JSONB)
  )
  LOOP
    DELETE FROM seeds WHERE id = (_record->>'id')::UUID AND user_id = _uid;
  END LOOP;

  -- Plants
  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'plants'->'created', '[]'::JSONB) ||
    COALESCE(changes->'plants'->'updated', '[]'::JSONB)
  )
  LOOP
    _client_ts := CASE WHEN _record->>'last_modified_at' IS NOT NULL
      THEN to_timestamp((_record->>'last_modified_at')::BIGINT / 1000.0)
      ELSE _now END;
    INSERT INTO plants (id, user_id, seed_id, emotion, color_variation, growth_stage,
                        location, plot_position, planted_at, last_watered_at,
                        last_growth_date, water_count, last_modified_at)
    VALUES ((_record->>'id')::UUID, _uid, (_record->>'seed_id')::UUID,
            _record->>'emotion', _record->>'color_variation',
            COALESCE(_record->>'growth_stage', 'seed'), COALESCE(_record->>'location', 'garden'),
            (_record->>'plot_position')::INT,
            COALESCE(to_timestamp((_record->>'planted_at')::BIGINT / 1000.0), _now),
            CASE WHEN _record->>'last_watered_at' IS NULL THEN NULL
                 ELSE to_timestamp((_record->>'last_watered_at')::BIGINT / 1000.0) END,
            (_record->>'last_growth_date')::DATE,
            COALESCE((_record->>'water_count')::INT, 0), _client_ts)
    ON CONFLICT (id) DO UPDATE SET
      emotion = EXCLUDED.emotion, color_variation = EXCLUDED.color_variation,
      growth_stage = EXCLUDED.growth_stage, location = EXCLUDED.location,
      plot_position = EXCLUDED.plot_position, last_watered_at = EXCLUDED.last_watered_at,
      last_growth_date = EXCLUDED.last_growth_date, water_count = EXCLUDED.water_count,
      last_modified_at = EXCLUDED.last_modified_at
    WHERE plants.user_id = _uid AND plants.last_modified_at <= _since;
  END LOOP;

  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'plants'->'deleted', '[]'::JSONB)
  )
  LOOP
    DELETE FROM plants WHERE id = (_record->>'id')::UUID AND user_id = _uid;
  END LOOP;

  -- Achievement records
  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'achievement_records'->'created', '[]'::JSONB) ||
    COALESCE(changes->'achievement_records'->'updated', '[]'::JSONB)
  )
  LOOP
    _client_ts := CASE WHEN _record->>'last_modified_at' IS NOT NULL
      THEN to_timestamp((_record->>'last_modified_at')::BIGINT / 1000.0)
      ELSE _now END;
    INSERT INTO achievement_records (id, user_id, achievement_type, achievement_key,
                                     trigger_entry_id, earned_at, is_active, last_modified_at)
    VALUES ((_record->>'id')::UUID, _uid, _record->>'achievement_type',
            _record->>'achievement_key', (_record->>'trigger_entry_id')::UUID,
            COALESCE(to_timestamp((_record->>'earned_at')::BIGINT / 1000.0), _now),
            COALESCE((_record->>'is_active')::BOOLEAN, TRUE), _client_ts)
    ON CONFLICT (id) DO UPDATE SET
      achievement_type = EXCLUDED.achievement_type, trigger_entry_id = EXCLUDED.trigger_entry_id,
      is_active = EXCLUDED.is_active, last_modified_at = EXCLUDED.last_modified_at
    WHERE achievement_records.user_id = _uid AND achievement_records.last_modified_at <= _since;
  END LOOP;

  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'achievement_records'->'deleted', '[]'::JSONB)
  )
  LOOP
    DELETE FROM achievement_records WHERE id = (_record->>'id')::UUID AND user_id = _uid;
  END LOOP;

  -- User stats
  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'user_stats'->'created', '[]'::JSONB) ||
    COALESCE(changes->'user_stats'->'updated', '[]'::JSONB)
  )
  LOOP
    _client_ts := CASE WHEN _record->>'last_modified_at' IS NOT NULL
      THEN to_timestamp((_record->>'last_modified_at')::BIGINT / 1000.0)
      ELSE _now END;
    INSERT INTO user_stats (id, user_id, total_entries, current_streak, last_entry_date,
                            consecutive_same_emotion, last_emotion, tier, last_modified_at)
    VALUES ((_record->>'id')::UUID, _uid, COALESCE((_record->>'total_entries')::INT, 0),
            COALESCE((_record->>'current_streak')::INT, 0), _record->>'last_entry_date',
            COALESCE((_record->>'consecutive_same_emotion')::INT, 0),
            _record->>'last_emotion', COALESCE(_record->>'tier', 'free'), _client_ts)
    ON CONFLICT (id) DO UPDATE SET
      total_entries = EXCLUDED.total_entries, current_streak = EXCLUDED.current_streak,
      last_entry_date = EXCLUDED.last_entry_date,
      consecutive_same_emotion = EXCLUDED.consecutive_same_emotion,
      last_emotion = EXCLUDED.last_emotion, tier = EXCLUDED.tier, last_modified_at = EXCLUDED.last_modified_at
    WHERE user_stats.user_id = _uid AND user_stats.last_modified_at <= _since;
  END LOOP;

  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'user_stats'->'deleted', '[]'::JSONB)
  )
  LOOP
    DELETE FROM user_stats WHERE id = (_record->>'id')::UUID AND user_id = _uid;
  END LOOP;
END;
$$;
