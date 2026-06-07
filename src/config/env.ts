import Constants from 'expo-constants';

export const SUPABASE_URL: string =
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  '';

export const SUPABASE_ANON_KEY: string =
  (Constants.expoConfig?.extra?.supabaseKey as string | undefined) ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY ??
  '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in .env');
}
