import { Tabs } from 'expo-router';
import { Text, TouchableOpacity, Linking, StyleSheet, View } from 'react-native';

function CrisisBar() {
  return (
    <View style={styles.bar}>
      <Text style={styles.text}>Crisis support: </Text>
      <TouchableOpacity onPress={() => Linking.openURL('tel:988')} accessibilityRole="link" accessibilityLabel="Call or text 988 crisis lifeline">
        <Text style={styles.link}>call or text 988</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <>
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#4CAF82' }}>
        <Tabs.Screen name="garden"     options={{ title: 'Garden',     tabBarIcon: () => <Text>🌿</Text> }} />
        <Tabs.Screen name="journal"    options={{ title: 'Journal',    tabBarIcon: () => <Text>📓</Text> }} />
        <Tabs.Screen name="greenhouse" options={{ title: 'Greenhouse', tabBarIcon: () => <Text>🏡</Text> }} />
        <Tabs.Screen name="profile"    options={{ title: 'Profile',    tabBarIcon: () => <Text>👤</Text> }} />
      </Tabs>
      <CrisisBar />
    </>
  );
}

const styles = StyleSheet.create({
  bar:  { backgroundColor: '#1a2e1a', borderTopWidth: 1, borderTopColor: '#2d4a2d', paddingVertical: 6, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'center' },
  text: { color: '#6a8f6a', fontSize: 12 },
  link: { color: '#4CAF82', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
});
