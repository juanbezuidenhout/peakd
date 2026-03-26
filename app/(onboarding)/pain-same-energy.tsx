import { useEffect, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeInLeft,
  FadeInRight,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';

const EASE_OUT = Easing.out(Easing.cubic);

function MaleAvatar() {
  return (
    <View style={styles.avatarCircle}>
      <View style={styles.maleHead} />
      <View style={styles.maleBody} />
    </View>
  );
}

function FemaleAvatarGlow() {
  return (
    <View style={[styles.avatarCircle, styles.femaleGlowBorder]}>
      <View style={styles.femaleHeadGlow} />
      <View style={styles.femaleBodyGlow} />
    </View>
  );
}

function FemaleAvatarMuted() {
  return (
    <View style={styles.avatarCircle}>
      <View style={styles.femaleHeadMuted} />
      <View style={styles.femaleBodyMuted} />
    </View>
  );
}

function DashedLine() {
  const dashes = Array.from({ length: 40 });
  return (
    <View style={styles.dashedRow}>
      {dashes.map((_, i) => (
        <View key={i} style={styles.dash} />
      ))}
    </View>
  );
}

export default function PainSameEnergyScreen() {
  const router = useRouter();

  const infoCardOpacity = useSharedValue(0);
  const infoCardTranslateY = useSharedValue(16);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    infoCardOpacity.value = withDelay(
      3600,
      withTiming(1, { duration: 600, easing: EASE_OUT }),
    );
    infoCardTranslateY.value = withDelay(
      3600,
      withTiming(0, { duration: 600, easing: EASE_OUT }),
    );
    ctaOpacity.value = withDelay(
      4000,
      withTiming(1, { duration: 600, easing: EASE_OUT }),
    );
  }, []);

  const infoCardStyle = useAnimatedStyle(() => ({
    opacity: infoCardOpacity.value,
    transform: [{ translateY: infoCardTranslateY.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
  }));

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/quiz-name');
  }, [router]);

  return (
    <SafeScreen>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* CONVERSATION 1 — He tries hard */}

          {/* Message 1 — Him (left-aligned) */}
          <Animated.View
            entering={FadeInLeft.delay(600).duration(500)}
            style={styles.messageRowLeft}
          >
            <MaleAvatar />
            <View style={styles.bubbleLeft}>
              <Text style={styles.bubbleText}>
                Hey Sophie 😊 I saw you love hiking — I just did Angel's Landing
                last month. We should go sometime?
              </Text>
            </View>
          </Animated.View>

          {/* Message 2 — Her reply (right-aligned, green) */}
          <Animated.View
            entering={FadeInRight.delay(1200).duration(500)}
            style={styles.messageRowRight}
          >
            <View style={styles.bubbleRightGreen}>
              <Text style={styles.bubbleText}>omg yes!! When are you free? 🥰</Text>
            </View>
            <FemaleAvatarGlow />
          </Animated.View>

          {/* DASHED DIVIDER */}
          <Animated.View
            entering={FadeIn.delay(1800).duration(600)}
            style={styles.dividerWrap}
          >
            <DashedLine />
            <View style={styles.dividerLabelWrap}>
              <Text style={styles.dividerLabel}>Same guy. Different effort.</Text>
            </View>
          </Animated.View>

          {/* CONVERSATION 2 — He doesn't try */}

          {/* Message 3 — Him (left-aligned) */}
          <Animated.View
            entering={FadeInLeft.delay(2400).duration(500)}
            style={styles.messageRowLeft}
          >
            <MaleAvatar />
            <View style={styles.bubbleLeft}>
              <Text style={styles.bubbleText}>hey</Text>
            </View>
          </Animated.View>

          {/* Message 4 — Her reply (right-aligned, grey) */}
          <Animated.View
            entering={FadeInRight.delay(3000).duration(500)}
            style={styles.messageRowRight}
          >
            <View style={styles.bubbleRightGrey}>
              <Text style={styles.bubbleTextMuted}>who's this? 😐</Text>
            </View>
            <FemaleAvatarMuted />
          </Animated.View>

          {/* Info Card */}
          <Animated.View style={[styles.infoCard, infoCardStyle]}>
            <Text style={styles.infoTitle}>"Just Be Yourself..."</Text>
            <Text style={styles.infoBody}>
              But how does "being yourself" change the way he treats you? The
              effort men put in is directly tied to how you present. Soft-maxxing
              isn't fake — it's showing the best version of who you already are.
            </Text>
          </Animated.View>
        </ScrollView>

        {/* CTA */}
        <Animated.View style={ctaStyle}>
          <Pressable style={styles.ctaButton} onPress={handleNext}>
            <Text style={styles.ctaLabel}>Next</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  backChevron: {
    fontSize: 32,
    color: Colors.textSecondary,
  },

  scrollArea: {
    flex: 1,
    marginTop: 16,
  },
  scrollContent: {
    paddingBottom: 8,
  },

  /* ── Chat rows ────────────────────────── */
  messageRowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 10,
  },
  messageRowRight: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginBottom: 16,
    gap: 10,
  },

  /* ── Avatars ──────────────────────────── */
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  femaleGlowBorder: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },

  maleHead: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#666666',
    marginBottom: 1,
  },
  maleBody: {
    width: 20,
    height: 11,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#666666',
  },

  femaleHeadGlow: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    marginBottom: 1,
  },
  femaleBodyGlow: {
    width: 20,
    height: 11,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#FFFFFF',
  },

  femaleHeadMuted: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#666666',
    marginBottom: 1,
  },
  femaleBodyMuted: {
    width: 20,
    height: 11,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#666666',
  },

  /* ── Bubbles ──────────────────────────── */
  bubbleLeft: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: '72%',
  },
  bubbleRightGreen: {
    backgroundColor: Colors.success,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: '72%',
  },
  bubbleRightGrey: {
    backgroundColor: '#333333',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: '72%',
  },

  bubbleText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    lineHeight: 20,
  },
  bubbleTextMuted: {
    color: '#999999',
    fontSize: 14.5,
    lineHeight: 20,
  },

  /* ── Dashed divider ───────────────────── */
  dividerWrap: {
    marginVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
  },
  dash: {
    width: 6,
    height: 1,
    backgroundColor: '#444444',
  },
  dividerLabelWrap: {
    position: 'absolute',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
  },
  dividerLabel: {
    color: Colors.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 1,
  },

  /* ── Info Card ────────────────────────── */
  infoCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoBody: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: 8,
  },

  /* ── CTA ──────────────────────────────── */
  ctaButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  ctaLabel: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
  },
});
