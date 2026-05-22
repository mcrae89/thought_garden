// Entry persistence service.
// Orchestrates: save entry → streak log → theme counts → milestone checks → seed awards.

import { supabase } from './client';
import type { EntryAnalysis } from '@tg/core';
import type { Mood, Theme } from '@tg/core';
import { checkMilestone, PLANT_BY_THEME, MOODS } from '@tg/core';
import type { MilestoneType } from '@tg/core';

interface SaveEntryParams {
  userId: string;
  body: string;
  moodPrimary: Mood;
  moodSecondary: Mood | null;
  themes: Theme[];
  rawAnalysis: EntryAnalysis;
  isCrisis: boolean;
}

export async function saveEntry(params: SaveEntryParams) {
  const { userId, body, moodPrimary, moodSecondary, themes, rawAnalysis, isCrisis } = params;
  const today = new Date().toISOString().slice(0, 10);

  // 1. Save entry
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .insert({
      user_id: userId,
      body,
      mood_primary: moodPrimary,
      mood_secondary: moodSecondary,
      themes,
      analysis_status: 'complete',
      raw_analysis: rawAnalysis as unknown as import('./types').Json,
    })
    .select('id')
    .single();

  if (entryError || !entry) throw entryError;

  // Crisis entries skip all reward mechanics
  if (isCrisis) return { entryId: entry.id, seedsAwarded: [] };

  // 2. Upsert streak log (one row per day)
  await supabase.from('streak_logs').upsert({ user_id: userId, date: today });

  // 3. Count total entries for this user
  const { count: totalEntries } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  // 4. Update theme counts + check milestones
  const seedsAwarded: string[] = [];

  // If NLP produced no themes, derive one from the primary mood
  const moodDef = MOODS.find((m) => m.mood === moodPrimary);
  const effectiveThemes: Theme[] = themes.length > 0
    ? themes
    : (moodDef ? [moodPrimary as unknown as Theme] : []);

  for (const theme of effectiveThemes) {
    // Upsert theme count
    const { data: existing } = await supabase
      .from('entry_theme_counts')
      .select('count')
      .eq('user_id', userId)
      .eq('theme', theme)
      .single();

    const newCount = (existing?.count ?? 0) + 1;
    await supabase
      .from('entry_theme_counts')
      .upsert({ user_id: userId, theme, count: newCount });

    // Check theme-based milestones
    const themeChecks: MilestoneType[] = [
      'first_entry_theme',
      'third_entry_theme',
      'seventh_entry_theme',
      'fifteenth_entry_theme',
    ];

    for (const milestoneType of themeChecks) {
      const result = checkMilestone({ type: milestoneType, themeCount: newCount });
      if (!result?.earned) continue;

      // Dedup — skip if already awarded
      const { data: existing } = await supabase
        .from('seed_milestones')
        .select('id')
        .eq('user_id', userId)
        .eq('theme', theme)
        .eq('milestone_type', milestoneType)
        .maybeSingle();

      if (existing) continue;

      await supabase.from('seed_milestones').insert({ user_id: userId, theme, milestone_type: milestoneType });
      const seedId = await awardSeed({ userId, entryId: entry.id, theme, isRare: result.isRare, moodPrimary });
      if (seedId) seedsAwarded.push(seedId);
    }
  }

  // 5. First entry ever
  const firstTheme = effectiveThemes[0];
  if (totalEntries === 1 && firstTheme) {
    const result = checkMilestone({ type: 'first_entry_ever' });
    if (result?.earned) {
      const { data: existing } = await supabase
        .from('seed_milestones')
        .select('id')
        .eq('user_id', userId)
        .eq('milestone_type', 'first_entry_ever')
        .maybeSingle();

      if (!existing) {
        await supabase.from('seed_milestones').insert({ user_id: userId, milestone_type: 'first_entry_ever' });
        const seedId = await awardSeed({ userId, entryId: entry.id, theme: firstTheme, isRare: false, moodPrimary });
        if (seedId) seedsAwarded.push(seedId);
      }
    }
  }

  // 6. Update profile streak + last_entry_date
  const { data: streakDates } = await supabase
    .from('streak_logs')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(31);

  const { computeStreak } = await import('@tg/core');
  const streakCount = computeStreak((streakDates ?? []).map((r) => r.date));

  await supabase
    .from('profiles')
    .update({ streak_count: streakCount, last_entry_date: today })
    .eq('id', userId);

  return { entryId: entry.id, seedsAwarded };
}

async function awardSeed(params: {
  userId: string;
  entryId: string;
  theme: Theme;
  isRare: boolean;
  moodPrimary: Mood;
}): Promise<string | null> {
  const { userId, entryId, theme, isRare, moodPrimary } = params;
  const plant = PLANT_BY_THEME[theme] ?? Object.values(PLANT_BY_THEME)[0];

  // Derive colors from mood family (simple mapping for MVP)
  const colorPrimary = MOOD_COLORS[moodPrimary] ?? '#4CAF82';
  const colorSecondary = colorPrimary + '99';

  const { data } = await supabase
    .from('seeds')
    .insert({
      user_id: userId,
      entry_id: entryId,
      plant_species: plant.species,
      color_primary: colorPrimary,
      color_secondary: colorSecondary,
      is_rare: isRare,
      location: 'inventory',
    })
    .select('id')
    .single();

  return data?.id ?? null;
}

const MOOD_COLORS: Record<string, string> = {
  joy: '#FFD700', love: '#FF6B6B', gratitude: '#FFA500',
  peace: '#6BB5FF', calm: '#87CEEB', acceptance: '#B39DDB',
  grief: '#78909C', loneliness: '#90A4AE', sadness: '#5C6BC0',
  anxiety: '#80CBC4', overwhelm: '#CE93D8',
  resilience: '#FFCA28', courage: '#FF8F00',
  creativity: '#26C6DA', wonder: '#EC407A',
};
