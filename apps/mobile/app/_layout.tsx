import '../src/setup/analysis';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="entry/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="entry/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
