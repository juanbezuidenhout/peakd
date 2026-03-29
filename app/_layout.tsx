import "../global.css";
import { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { isOnboardingComplete } from "@/lib/storage";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

LogBox.ignoreAllLogs();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const complete = await isOnboardingComplete();
      setReady(true);
      if (complete) {
        router.replace("/(tabs)/coach");
      }
    })();
  }, []);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: "fade", gestureEnabled: false }}>
        <Stack.Screen name="(onboarding)" options={{ animation: "none" }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="scan-processing"
          options={{ animation: "slide_from_bottom", gestureEnabled: false }}
        />
        <Stack.Screen
          name="results"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="paywall"
          options={{ animation: "slide_from_bottom", presentation: "modal" }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
