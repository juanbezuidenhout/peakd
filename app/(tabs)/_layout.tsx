import { Tabs } from "expo-router";

export const unstable_settings = {
  initialRouteName: "home",
};

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" options={{ title: "home" }} />
      <Tabs.Screen name="scan" options={{ href: null }} />
      <Tabs.Screen name="coach" options={{ href: null }} />
      <Tabs.Screen name="daily" options={{ href: null }} />
      <Tabs.Screen name="extras" options={{ href: null }} />
    </Tabs>
  );
}
