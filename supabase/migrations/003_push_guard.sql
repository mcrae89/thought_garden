-- 003_push_guard.sql
-- Fix #5: Server-side timestamp guard + deleted as objects for PostgREST compatibility
-- Deleted arrays contain {id: "uuid"} objects (not bare strings) to avoid PostgREST JSON parse issues.
-- Deletes always apply (no timestamp guard). Updates only apply if server row is not newer.

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
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Deleted entries (deletes always win)
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
    INSERT INTO entries (id, user_id, content, primary_emotion, word_count,
                         created_at, modified_at, is_deleted, last_modified_at)
    VALUES (
      (_record->>'id')::UUID, _uid, _record->>'content', _record->>'primary_emotion',
      COALESCE((_record->>'word_count')::INT, 0),
      COALESCE(to_timestamp((_record->>'created_at')::BIGINT / 1000.0), _now),
      CASE WHEN _record->>'modified_at' IS NULL THEN NULL
           ELSE to_timestamp((_record->>'modified_at')::BIGINT / 1000.0) END,
      COALESCE((_record->>'is_deleted')::BOOLEAN, FALSE), _now
    )
    ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content, primary_emotion = EXCLUDED.primary_emotion,
      word_count = EXCLUDED.word_count, modified_at = EXCLUDED.modified_at,
      is_deleted = EXCLUDED.is_deleted, last_modified_at = _now
    WHERE entries.user_id = _uid AND entries.last_modified_at <= _since;
  END LOOP;

  -- Entry emotions
  FOR _record IN SELECT jsonb_array_elements(
    COALESCE(changes->'entry_emotions'->'created', '[]'::JSONB) ||
    COALESCE(changes->'entry_emotions'->'updated', '[]'::JSONB)
  )
  LOOP
    INSERT INTO entry_emotions (id, entry_id, emotion, type, "order", last_modified_at)
    VALUES ((_record->>'id')::UUID, (_record->>'entry_id')::UUID, _record->>'emotion',
            _record->>'type', COALESCE((_record->>'order')::INT, 0), _now)
    ON CONFLICT (id) DO UPDATE SET
      emotion = EXCLUDED.emotion, type = EXCLUDED.type,
      "order" = EXCLUDED."order", last_modified_at = _now
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
    INSERT INTO seeds (id, user_id, source_entry_id, source_achievement_id,
                       emotion, color_variation, earned_at, is_planted, last_modified_at)
    VALUES ((_record->>'id')::UUID, _uid, (_record->>'source_entry_id')::UUID,
            (_record->>'source_achievement_id')::UUID, _record->>'emotion',
            _record->>'color_variation',
            COALESCE(to_timestamp((_record->>'earned_at')::BIGINT / 1000.0), _now),
            COALESCE((_record->>'is_planted')::BOOLEAN, FALSE), _now)
    ON CONFLICT (id) DO UPDATE SET
      source_entry_id = EXCLUDED.source_entry_id, emotion = EXCLUDED.emotion,
      color_variation = EXCLUDED.color_variation, is_planted = EXCLUDED.is_planted,
      last_modified_at = _now
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
    INSERT INTO plants (id, user_id, seed_id, emotion, color_variation, growth_stage,
                        location, plot_position, planted_at, last_watered_at,
                        last_growth_date, last_modified_at)
    VALUES ((_record->>'id')::UUID, _uid, (_record->>'seed_id')::UUID,
            _record->>'emotion', _record->>'color_variation',
            COALESCE(_record->>'growth_stage', 'seed'), COALESCE(_record->>'location', 'garden'),
            (_record->>'plot_position')::INT,
            COALESCE(to_timestamp((_record->>'planted_at')::BIGINT / 1000.0), _now),
            CASE WHEN _record->>'last_watered_at' IS NULL THEN NULL
                 ELSE to_timestamp((_record->>'last_watered_at')::BIGINT / 1000.0) END,
            (_record->>'last_growth_date')::DATE, _now)
    ON CONFLICT (id) DO UPDATE SET
      emotion = EXCLUDED.emotion, color_variation = EXCLUDED.color_variation,
      growth_stage = EXCLUDED.growth_stage, location = EXCLUDED.location,
      plot_position = EXCLUDED.plot_position, last_watered_at = EXCLUDED.last_watered_at,
      last_growth_date = EXCLUDED.last_growth_date, last_modified_at = _now
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
    INSERT INTO achievement_records (id, user_id, achievement_type, achievement_key,
                                     trigger_entry_id, earned_at, is_active, last_modified_at)
    VALUES ((_record->>'id')::UUID, _uid, _record->>'achievement_type',
            _record->>'achievement_key', (_record->>'trigger_entry_id')::UUID,
            COALESCE(to_timestamp((_record->>'earned_at')::BIGINT / 1000.0), _now),
            COALESCE((_record->>'is_active')::BOOLEAN, TRUE), _now)
    ON CONFLICT (id) DO UPDATE SET
      achievement_type = EXCLUDED.achievement_type, trigger_entry_id = EXCLUDED.trigger_entry_id,
      is_active = EXCLUDED.is_active, last_modified_at = _now
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
    INSERT INTO user_stats (id, user_id, total_entries, current_streak, last_entry_date,
                            consecutive_same_emotion, last_emotion, tier, last_modified_at)
    VALUES ((_record->>'id')::UUID, _uid, COALESCE((_record->>'total_entries')::INT, 0),
            COALESCE((_record->>'current_streak')::INT, 0), _record->>'last_entry_date',
            COALESCE((_record->>'consecutive_same_emotion')::INT, 0),
            _record->>'last_emotion', COALESCE(_record->>'tier', 'free'), _now)
    ON CONFLICT (id) DO UPDATE SET
      total_entries = EXCLUDED.total_entries, current_streak = EXCLUDED.current_streak,
      last_entry_date = EXCLUDED.last_entry_date,
      consecutive_same_emotion = EXCLUDED.consecutive_same_emotion,
      last_emotion = EXCLUDED.last_emotion, tier = EXCLUDED.tier, last_modified_at = _now
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
