import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { LiquidGlassTabBar } from '@/components/ui/LiquidGlassTabBar';

export const unstable_settings = {
  initialRouteName: 'home',
};

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = pathname.includes('/coach')
    ? 'coach'
    : pathname.includes('/roadmap')
    ? 'roadmap'
    : 'home';

  const isDark = activeTab === 'coach';

  const handleTabPress = useCallback(
    (tab: string) => {
      if (tab === activeTab) return;
      if (tab === 'home') router.replace('/(tabs)/home');
      else if (tab === 'coach') router.replace('/(tabs)/coach');
      else if (tab === 'roadmap') router.replace('/(tabs)/roadmap');
    },
    [activeTab, router],
  );

  return (
    <View style={styles.container}>
      <Tabs
        tabBar={() => null}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="coach" options={{ title: 'AI Coach' }} />
        <Tabs.Screen name="roadmap" options={{ title: 'Roadmap' }} />
        <Tabs.Screen name="scan" options={{ href: null }} />
        <Tabs.Screen name="daily" options={{ href: null }} />
        <Tabs.Screen name="extras" options={{ href: null }} />
      </Tabs>
      <LiquidGlassTabBar activeTab={activeTab} onTabPress={handleTabPress} dark={isDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
