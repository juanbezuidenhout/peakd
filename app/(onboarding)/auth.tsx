import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Colors } from "@/constants/colors";
import { completeOnboarding } from "@/lib/storage";

function WaveformLoader({ color = "#FFFFFF" }: { color?: string }) {
  const bar1 = useSharedValue(0.4);
  const bar2 = useSharedValue(0.4);
  const bar3 = useSharedValue(0.4);

  useEffect(() => {
    const bounce = (delay: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }),
            withTiming(0.4, { duration: 300, easing: Easing.in(Easing.ease) }),
          ),
          -1,
          false,
        ),
      );
    bar1.value = bounce(0);
    bar2.value = bounce(100);
    bar3.value = bounce(200);
  }, [bar1, bar2, bar3]);

  const s1 = useAnimatedStyle(() => ({ transform: [{ scaleY: bar1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ scaleY: bar2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ scaleY: bar3.value }] }));

  return (
    <View style={styles.waveContainer}>
      <Animated.View style={[styles.waveBar, { backgroundColor: color }, s1]} />
      <Animated.View style={[styles.waveBar, { backgroundColor: color }, s2]} />
      <Animated.View style={[styles.waveBar, { backgroundColor: color }, s3]} />
    </View>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    // TODO: Integrate real Google auth
    await completeOnboarding();
    setLoadingGoogle(false);
    router.push("/(onboarding)/scan-prompt");
  };

  const handleApple = async () => {
    setLoadingApple(true);
    // TODO: Integrate real Apple auth
    await completeOnboarding();
    setLoadingApple(false);
    router.push("/(onboarding)/scan-prompt");
  };

  return (
    <SafeScreen>
      <View style={{ paddingTop: 20 }}>
        <ProgressBar current={4} total={5} />
      </View>

      <Animated.View entering={FadeInUp.duration(500)} style={{ marginTop: 24 }}>
        <Text style={styles.title}>Create your account</Text>
      </Animated.View>

      <View style={styles.content}>
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={{ gap: 12 }}>
          {/* Google Button */}
          <Pressable
            onPress={handleGoogle}
            disabled={loadingGoogle || loadingApple}
            style={styles.googleButton}
          >
            {loadingGoogle ? (
              <WaveformLoader color="#000000" />
            ) : (
              <View style={styles.buttonInner}>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.googleText}>Continue with Google</Text>
              </View>
            )}
          </Pressable>

          {/* Apple Button */}
          <Pressable
            onPress={handleApple}
            disabled={loadingGoogle || loadingApple}
            style={styles.appleButton}
          >
            {loadingApple ? (
              <WaveformLoader color="#FFFFFF" />
            ) : (
              <View style={styles.buttonInner}>
                <Text style={styles.appleLogo}>{"\uF8FF"}</Text>
                <Text style={styles.appleText}>Continue with Apple</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  googleButton: {
    height: 64,
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  appleButton: {
    height: 64,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  googleG: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4285F4",
  },
  googleText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000000",
  },
  appleLogo: {
    fontSize: 22,
    color: "#FFFFFF",
  },
  appleText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 24,
  },
  waveBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
});
