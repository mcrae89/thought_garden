import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'thought_garden',
  slug: config.slug ?? 'thought_garden',
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '',
  },
});
