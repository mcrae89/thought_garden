import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'thought_garden',
  slug: config.slug ?? 'thought_garden',
  scheme: 'thought-garden',
  plugins: config.plugins ?? [],
  extra: {
    ...config.extra,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '',
  },
});
