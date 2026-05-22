import { supabase } from './client';
import type { Entry } from '@tg/core';

export async function fetchEntries(userId: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    body: r.body,
    createdAt: r.created_at,
    moodPrimary: r.mood_primary as Entry['moodPrimary'],
    moodSecondary: r.mood_secondary as Entry['moodSecondary'],
    themes: r.themes as Entry['themes'],
    analysisStatus: r.analysis_status as Entry['analysisStatus'],
    rawAnalysis: r.raw_analysis as Entry['rawAnalysis'],
  }));
}

export async function fetchEntry(id: string): Promise<Entry | null> {
  const { data } = await supabase.from('entries').select('*').eq('id', id).single();
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    body: data.body,
    createdAt: data.created_at,
    moodPrimary: data.mood_primary as Entry['moodPrimary'],
    moodSecondary: data.mood_secondary as Entry['moodSecondary'],
    themes: data.themes as Entry['themes'],
    analysisStatus: data.analysis_status as Entry['analysisStatus'],
    rawAnalysis: data.raw_analysis as Entry['rawAnalysis'],
  };
}
