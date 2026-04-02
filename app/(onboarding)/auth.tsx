import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
} from "react-native";
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
import { supabase } from "@/lib/supabase";
import * as AppleAuthentication from "@invertase/react-native-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import "react-native-get-random-values";

WebBrowser.maybeCompleteAuthSession();

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
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    try {
      const redirectUrl = Linking.createURL("/(tabs)/home");
      const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            client_id: iosClientId || webClientId,
          },
        },
      });

      if (error) throw error;

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === "success") {
          await completeOnboarding();
          router.push("/(tabs)/home");
        }
      }
    } catch (error: unknown) {
      Alert.alert(
        "Sign In Error",
        error instanceof Error ? error.message : "An error occurred during Google sign in"
      );
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleApple = async () => {
    setLoadingApple(true);
    try {
      const appleCredential = await AppleAuthentication.performRequest({
        requestedOperation: AppleAuthentication.Operation.LOGIN,
        requestedScopes: [
          AppleAuthentication.Scope.FULL_NAME,
          AppleAuthentication.Scope.EMAIL,
        ],
      });

      if (!appleCredential.identityToken) {
        throw new Error("No identity token received from Apple");
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: appleCredential.identityToken,
      });

      if (error) throw error;

      // Update user profile with full name if available (only on first sign in)
      if (
        appleCredential.fullName &&
        (appleCredential.fullName.givenName || appleCredential.fullName.familyName)
      ) {
        const fullName = `${appleCredential.fullName.givenName || ""} ${
          appleCredential.fullName.familyName || ""
        }`.trim();

        if (fullName) {
          await supabase.auth.updateUser({
            data: { full_name: fullName },
          });
        }
      }

      await completeOnboarding();
      router.push("/(tabs)/home");
    } catch (error: unknown) {
      if ((error as { code?: string })?.code !== "1001") {
        Alert.alert(
          "Sign In Error",
          error instanceof Error ? error.message : "An error occurred during Apple sign in"
        );
      }
    } finally {
      setLoadingApple(false);
    }
  };

  const handleEmail = async () => {
    if (!email || !email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setLoadingEmail(true);
    try {
      const redirectUrl = Linking.createURL("/(tabs)/home");
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      setEmailSent(true);
    } catch (error: unknown) {
      Alert.alert(
        "Sign In Error",
        error instanceof Error ? error.message : "An error occurred"
      );
    } finally {
      setLoadingEmail(false);
    }
  };

  const isLoading = loadingGoogle || loadingApple || loadingEmail;

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
            disabled={isLoading}
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

          {/* Apple Button - iOS only */}
          {Platform.OS === "ios" && (
            <Pressable
              onPress={handleApple}
              disabled={isLoading}
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
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Input */}
          {!emailSent ? (
            <>
              <TextInput
                style={styles.emailInput}
                placeholder="Enter your email"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />

              {/* Email Button */}
              <Pressable
                onPress={handleEmail}
                disabled={isLoading || !email}
                style={[
                  styles.emailButton,
                  (!email || isLoading) && styles.emailButtonDisabled,
                ]}
              >
                {loadingEmail ? (
                  <WaveformLoader color="#FFFFFF" />
                ) : (
                  <Text style={styles.emailText}>Continue with Email</Text>
                )}
              </Pressable>
            </>
          ) : (
            <Animated.View
              entering={FadeInUp.duration(300)}
              style={styles.emailSentContainer}
            >
              <Text style={styles.emailSentTitle}>Check your email!</Text>
              <Text style={styles.emailSentMessage}>
                We sent a magic link to {email}. Tap the link to sign in.
              </Text>
              <Pressable
                onPress={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>Use a different email</Text>
              </Pressable>
            </Animated.View>
          )}
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
  emailButton: {
    height: 64,
    backgroundColor: Colors.primary,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  emailButtonDisabled: {
    opacity: 0.5,
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
  emailText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: "uppercase",
  },
  emailInput: {
    height: 64,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 50,
    paddingHorizontal: 24,
    fontSize: 17,
    color: Colors.textPrimary,
  },
  emailSentContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  emailSentTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  emailSentMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "600",
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
