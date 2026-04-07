import "../global.css";
import { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { isOnboardingComplete, hasCompletedPurchase, getItem, KEYS } from "@/lib/storage";
import { setPendingReferrer, extractReferrerFromUrl } from "@/lib/referral";
import { supabase } from "@/lib/supabase";
import { configureRevenueCat, identifyRevenueCatUser } from "@/lib/purchases";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import { useQuickActionRouting } from "expo-quick-actions/router";

SplashScreen.preventAutoHideAsync();

LogBox.ignoreAllLogs();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useQuickActionRouting();

  useEffect(() => {
    configureRevenueCat();
  }, []);

  // Handle deep links for referral tracking
  useEffect(() => {
    // Check for initial URL (app opened from deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        const referrerId = extractReferrerFromUrl(url);
        if (referrerId) {
          setPendingReferrer(referrerId);
        }
      }
    });

    // Listen for incoming links while app is running
    const subscription = Linking.addEventListener("url", (event) => {
      const referrerId = extractReferrerFromUrl(event.url);
      if (referrerId) {
        setPendingReferrer(referrerId);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    (async () => {
      // Check for existing Supabase session first
      const { data: { session } } = await supabase.auth.getSession();

      const paid = await hasCompletedPurchase();
      const onboarded = await isOnboardingComplete();

      setReady(true);

      if (session) {
        await identifyRevenueCatUser(session.user.id);
        router.replace("/(tabs)/home");
      } else if (paid) {
        // No session but has completed purchase
        router.replace("/(tabs)/home");
      } else if (onboarded) {
        const hasScan = await getItem(KEYS.SCAN_RESULT);
        if (hasScan) {
          router.replace("/results");
        } else {
          router.replace("/(tabs)/scan");
        }
      }
      // Otherwise, stay in onboarding (no navigation)
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
      <StatusBar style="dark" />
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
        <Stack.Screen
          name="promo"
          options={{ animation: "slide_from_bottom", presentation: "modal", gestureEnabled: false }}
        />
        <Stack.Screen
          name="settings"
          options={{ animation: "slide_from_bottom", presentation: "modal", gestureEnabled: true }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
