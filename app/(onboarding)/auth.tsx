import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  useWindowDimensions,
  Linking,
} from "react-native";

const MAX_CONTENT_WIDTH = 500;
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
import { SafeAreaView } from "react-native-safe-area-context";
import { completeOnboarding } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { identifyRevenueCatUser } from "@/lib/purchases";
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Svg, { Path } from "react-native-svg";
import "react-native-get-random-values";


// Google "G" logo SVG
function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

// Apple logo SVG
function AppleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#FFFFFF">
      <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.2 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-2.95 1.78-2.45 5.98.22 7.13-.57 1.5-1.31 2.99-2.27 4.08zm-5.85-15.1c.07-2.04 1.76-3.79 3.78-3.94.29 2.32-1.93 4.48-3.78 3.94z" />
    </Svg>
  );
}

// Envelope icon SVG
function EnvelopeIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <Path d="m22 6-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 6" />
    </Svg>
  );
}

// Atmospheric glow orb component
function GlowOrb({
  size,
  color,
  top,
  left,
  opacity = 0.4,
  delay = 0,
}: {
  size: number;
  color: string;
  top: number;
  left: number;
  opacity?: number;
  delay?: number;
}) {
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-15, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
          withTiming(15, { duration: 5000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          top,
          left,
        },
        animatedStyle,
      ]}
    />
  );
}

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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
  }, []);

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    try {
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) throw new Error('No ID token received from Google');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) throw error;

      if (data.session) {
        await identifyRevenueCatUser(data.session.user.id);
      }

      await completeOnboarding();
      router.push("/(tabs)/home");
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
      const result = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const identityToken = result.identityToken;

      if (!identityToken) {
        throw new Error("No identity token received from Apple");
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: identityToken,
      });

      if (error) throw error;

      // Update user profile with full name if available (only on first sign in)
      if (
        result.fullName &&
        (result.fullName.givenName || result.fullName.familyName)
      ) {
        const fullName = `${result.fullName.givenName || ""} ${
          result.fullName.familyName || ""
        }`.trim();

        if (fullName) {
          await supabase.auth.updateUser({
            data: { full_name: fullName },
          });
        }
      }

      if (data.session) {
        await identifyRevenueCatUser(data.session.user.id);
      }

      await completeOnboarding();
      router.push("/(tabs)/home");
    } catch (error: unknown) {
      if ((error as { code?: string })?.code !== "ERR_REQUEST_CANCELED") {
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

  const handleSkip = () => {
    router.push("/(tabs)/home");
  };

  const isLoading = loadingGoogle || loadingApple || loadingEmail;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Atmospheric glow orbs */}
      <View style={styles.orbContainer} pointerEvents="none">
        <GlowOrb
          size={350}
          color="#7c3aed"
          top={screenHeight * 0.05}
          left={-100}
          opacity={0.25}
          delay={0}
        />
        <GlowOrb
          size={280}
          color="#a855f7"
          top={screenHeight * 0.25}
          left={screenWidth - 180}
          opacity={0.2}
          delay={500}
        />
        <GlowOrb
          size={200}
          color="#6366f1"
          top={screenHeight * 0.55}
          left={50}
          opacity={0.15}
          delay={1000}
        />
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(200)}
              style={styles.header}
            >
              <Text style={styles.title}>Save your progress.</Text>
              <Text style={styles.subtitle}>
                Create an account to keep your results and access Peakd across devices.
              </Text>
            </Animated.View>

            {/* Buttons */}
            <Animated.View
              entering={FadeInUp.duration(500).delay(400)}
              style={styles.buttonContainer}
            >
              {/* Apple Button */}
              {Platform.OS === "ios" && (
                <Pressable
                  onPress={handleApple}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.socialButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  {loadingApple ? (
                    <WaveformLoader color="#FFFFFF" />
                  ) : (
                    <View style={styles.buttonInner}>
                      <AppleLogo size={20} />
                      <Text style={styles.buttonText}>Continue with Apple</Text>
                    </View>
                  )}
                </Pressable>
              )}

              {/* Google Button */}
              <Pressable
                onPress={handleGoogle}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.socialButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                {loadingGoogle ? (
                  <WaveformLoader color="#FFFFFF" />
                ) : (
                  <View style={styles.buttonInner}>
                    <GoogleLogo size={20} />
                    <Text style={styles.buttonText}>Continue with Google</Text>
                  </View>
                )}
              </Pressable>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email Section */}
              {!emailSent ? (
                <>
                  <TextInput
                    style={styles.emailInput}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading}
                  />

                  <Pressable
                    onPress={handleEmail}
                    disabled={isLoading || !email}
                    style={({ pressed }) => [
                      styles.emailButton,
                      (!email || isLoading) && styles.emailButtonDisabled,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    {loadingEmail ? (
                      <WaveformLoader color="#FFFFFF" />
                    ) : (
                      <View style={styles.buttonInner}>
                        <EnvelopeIcon size={20} />
                        <Text style={styles.buttonText}>Continue with Email</Text>
                      </View>
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

              {/* Skip link */}
              <Pressable onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip for now</Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    filter: "blur(80px)",
    // Note: blur effect via filter works on web; on native we'll use opacity for softness
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 40,
    maxWidth: MAX_CONTENT_WIDTH,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 24,
    maxWidth: 300,
  },
  buttonContainer: {
    gap: 12,
    width: "100%",
  },
  socialButton: {
    height: 56,
    backgroundColor: "#1c1c1e",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  emailButton: {
    height: 56,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
  },
  emailButtonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.4)",
    textTransform: "lowercase",
  },
  emailInput: {
    height: 56,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  emailSentContainer: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  emailSentTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  emailSentMessage: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 20,
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.4)",
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
