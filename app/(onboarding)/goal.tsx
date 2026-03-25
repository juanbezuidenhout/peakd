import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Colors } from "@/constants/colors";
import { setUserGoal } from "@/lib/storage";

const GOALS = [
  "Clear & glowing skin",
  "Find my makeup style",
  "Look more feminine",
];

export default function GoalScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = async () => {
    if (selected) {
      await setUserGoal(selected);
    }
    router.push("/(onboarding)/social-proof");
  };

  return (
    <SafeScreen>
      <View style={{ paddingTop: 20 }}>
        <ProgressBar current={1} total={5} />
      </View>

      <Animated.View entering={FadeInUp.duration(500)} style={{ marginTop: 24 }}>
        <Text style={styles.title}>What's your main goal?</Text>
      </Animated.View>

      <View style={styles.content}>
        <View style={{ gap: 12 }}>
          {GOALS.map((goal, index) => {
            const isSelected = selected === goal;
            return (
              <Animated.View
                key={goal}
                entering={FadeInUp.delay(100 * index).duration(400)}
              >
                <Pressable
                  onPress={() => setSelected(goal)}
                  style={[
                    styles.pill,
                    isSelected && styles.pillSelected,
                  ]}
                >
                  <Text style={styles.pillText}>{goal}</Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>

      <View style={styles.bottom}>
        <PrimaryButton label="Continue" onPress={handleContinue} />
        <Pressable onPress={handleContinue}>
          <Text style={styles.skip}>skip</Text>
        </Pressable>
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
  pill: {
    height: 64,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  pillSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(124,58,237,0.15)",
  },
  pillText: {
    fontSize: 17,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  bottom: {
    paddingBottom: 24,
    gap: 16,
    alignItems: "center",
  },
  skip: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
