import { supabase } from './client';

export interface ProfileStats {
  streakCount: number;
  totalEntries: number;
  plantsGrown: number;
  seedsEarned: number;
}

export async function fetchProfileStats(userId: string): Promise<ProfileStats> {
  const [profileRes, entriesRes, plantsRes, seedsRes] = await Promise.all([
    supabase.from('profiles').select('streak_count').eq('id', userId).single(),
    supabase.from('entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('plants').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('seeds').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  return {
    streakCount: profileRes.data?.streak_count ?? 0,
    totalEntries: entriesRes.count ?? 0,
    plantsGrown: plantsRes.count ?? 0,
    seedsEarned: seedsRes.count ?? 0,
  };
}
