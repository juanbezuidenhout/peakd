import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

export default function SplashScreen() {
  const router = useRouter();
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });

    const timeout = setTimeout(() => {
      router.replace("/(onboarding)/goal");
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, animatedStyle]}>
        <View style={styles.glowLayer}>
          <Text style={styles.letter}>P</Text>
        </View>
        <Text style={styles.tagline}>Your AI Beauty Coach</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowLayer: {
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  letter: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  tagline: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
    marginTop: 16,
    letterSpacing: 0.5,
  },
});
