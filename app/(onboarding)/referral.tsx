import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Colors } from "@/constants/colors";
import { setReferralCode } from "@/lib/storage";

export default function ReferralScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const handleContinue = async () => {
    if (code.trim()) {
      await setReferralCode(code.trim());
    }
    router.push("/(onboarding)/auth");
  };

  return (
    <SafeScreen>
      <View style={{ paddingTop: 20 }}>
        <ProgressBar current={3} total={5} />
      </View>

      <Animated.View entering={FadeInUp.duration(500)} style={{ marginTop: 24 }}>
        <Text style={styles.title}>Do you have a referral code?</Text>
      </Animated.View>

      <View style={styles.content}>
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Enter code (optional)"
            autoCapitalize="characters"
            style={styles.input}
            placeholderTextColor={Colors.textMuted}
          />
          <Text style={styles.caption}>Enter your code here, or skip</Text>
        </Animated.View>
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
  input: {
    height: 60,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  caption: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
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
