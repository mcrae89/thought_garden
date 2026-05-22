import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#4CAF82' }}>
      <Tabs.Screen name="garden"     options={{ title: 'Garden',     tabBarIcon: () => <Text>🌿</Text> }} />
      <Tabs.Screen name="journal"    options={{ title: 'Journal',    tabBarIcon: () => <Text>📓</Text> }} />
      <Tabs.Screen name="greenhouse" options={{ title: 'Greenhouse', tabBarIcon: () => <Text>🏡</Text> }} />
      <Tabs.Screen name="profile"    options={{ title: 'Profile',    tabBarIcon: () => <Text>👤</Text> }} />
    </Tabs>
  );
}
