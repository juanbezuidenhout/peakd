import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Colors } from "@/constants/colors";

const STARS = [1, 2, 3, 4, 5];

export default function SocialProofScreen() {
  const router = useRouter();

  return (
    <SafeScreen>
      <View style={{ paddingTop: 20 }}>
        <ProgressBar current={2} total={5} />
      </View>

      <Animated.View entering={FadeInUp.duration(500)} style={{ marginTop: 24 }}>
        <Text style={styles.title}>Trusted by 500,000+ women</Text>
      </Animated.View>

      <View style={styles.content}>
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.iconWrapper}
        >
          <View style={styles.appIcon}>
            <View style={styles.glowLayer}>
              <Text style={styles.letter}>P</Text>
            </View>
          </View>

          <View style={styles.starsRow}>
            {STARS.map((s) => (
              <Text key={s} style={styles.star}>
                ⭐
              </Text>
            ))}
          </View>
        </Animated.View>
      </View>

      <View style={styles.bottom}>
        <PrimaryButton
          label="Continue"
          onPress={() => router.push("/(onboarding)/referral")}
        />
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
    alignItems: "center",
  },
  iconWrapper: {
    alignItems: "center",
  },
  appIcon: {
    width: 180,
    height: 180,
    borderRadius: 32,
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontSize: 48,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  starsRow: {
    flexDirection: "row",
    marginTop: 24,
    gap: 8,
  },
  star: {
    fontSize: 32,
  },
  bottom: {
    paddingBottom: 24,
  },
});
