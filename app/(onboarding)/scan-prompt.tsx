import { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Colors } from "@/constants/colors";

const PILLS = ["Face Shape", "Color Season", "Eye Type"];

function ScanGraphic() {
  const translateY = useSharedValue(-60);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(60, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [translateY]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.graphicWrapper}>
      {/* Face outline circle */}
      <View style={styles.faceCircle}>
        {/* Static scan reference lines */}
        <View style={[styles.scanLine, { top: "30%" }]} />
        <View style={[styles.scanLine, { top: "50%" }]} />
        <View style={[styles.scanLine, { top: "70%" }]} />

        {/* Animated sweep line */}
        <Animated.View style={[styles.sweepLine, scanLineStyle]} />
      </View>
    </View>
  );
}

export default function ScanPromptScreen() {
  const router = useRouter();

  return (
    <SafeScreen>
      <View style={styles.backRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
      </View>

      <View style={{ paddingTop: 20 }}>
        <ProgressBar current={5} total={5} />
      </View>

      <Animated.View entering={FadeInUp.duration(500)} style={{ marginTop: 24 }}>
        <Text style={styles.title}>Let's scan your face</Text>
        <Text style={styles.subtitle}>
          Peakd's AI analyzes your face shape, skin tone, eye type, and color
          season to build your personal beauty blueprint.
        </Text>
      </Animated.View>

      <View style={styles.content}>
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.centerColumn}
        >
          <ScanGraphic />

          <View style={styles.pillsRow}>
            {PILLS.map((pill) => (
              <View key={pill} style={styles.pill}>
                <Text style={styles.pillText}>{pill}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>

      <View style={styles.bottom}>
        <PrimaryButton
          label="Scan my face"
          onPress={() => router.replace("/(tabs)/scan")}
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  backChevron: {
    fontSize: 28,
    color: Colors.textSecondary,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerColumn: {
    alignItems: "center",
  },
  graphicWrapper: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  faceCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: Colors.primary,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  scanLine: {
    position: "absolute",
    width: "60%",
    height: 1,
    backgroundColor: Colors.primaryBg,
  },
  sweepLine: {
    position: "absolute",
    width: "80%",
    height: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  pillsRow: {
    flexDirection: "row",
    marginTop: 32,
    gap: 8,
  },
  pill: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  bottom: {
    paddingBottom: 24,
  },
});
