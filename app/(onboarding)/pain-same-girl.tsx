import { useEffect, useCallback, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';

const EASE_OUT = Easing.out(Easing.cubic);

function AvatarSilhouette({ glow }: { glow?: boolean }) {
  return (
    <View style={[styles.avatarOuter, glow && styles.avatarGlow]}>
      <View style={styles.avatarInner}>
        <View style={styles.silHead} />
        <View style={styles.silBody} />
      </View>
    </View>
  );
}

function CountingNumber({
  sharedValue,
  color,
}: {
  sharedValue: Animated.SharedValue<number>;
  color: string;
}) {
  const [display, setDisplay] = useState(0);

  useAnimatedReaction(
    () => Math.round(sharedValue.value),
    (result) => {
      runOnJS(setDisplay)(result);
    },
  );

  return <Text style={[styles.statValue, { color }]}>{display}</Text>;
}

export default function PainSameGirlScreen() {
  const router = useRouter();

  const leftCardOpacity = useSharedValue(0);
  const leftStatsOpacity = useSharedValue(0);
  const leftLikes = useSharedValue(0);

  const dividerProgress = useSharedValue(0);
  const sameLabelOpacity = useSharedValue(0);

  const rightCardOpacity = useSharedValue(0);
  const rightStatsOpacity = useSharedValue(0);
  const rightLikes = useSharedValue(0);
  const rightMatches = useSharedValue(0);
  const rightMessages = useSharedValue(0);

  const glowPulse = useSharedValue(0);

  const subheadlineOpacity = useSharedValue(0);
  const infoCardOpacity = useSharedValue(0);
  const infoCardTranslateY = useSharedValue(16);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    leftCardOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 600, easing: EASE_OUT }),
    );

    leftStatsOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 400, easing: EASE_OUT }),
    );
    leftLikes.value = withDelay(
      1000,
      withTiming(2, { duration: 1000, easing: EASE_OUT }),
    );

    dividerProgress.value = withDelay(
      1200,
      withTiming(1, { duration: 800, easing: EASE_OUT }),
    );

    sameLabelOpacity.value = withDelay(
      1600,
      withTiming(1, { duration: 600, easing: EASE_OUT }),
    );

    rightCardOpacity.value = withDelay(
      2000,
      withTiming(1, { duration: 600, easing: EASE_OUT }),
    );

    rightStatsOpacity.value = withDelay(
      2200,
      withTiming(1, { duration: 400, easing: EASE_OUT }),
    );
    rightLikes.value = withDelay(
      2200,
      withTiming(47, { duration: 1500, easing: EASE_OUT }),
    );
    rightMatches.value = withDelay(
      2200,
      withTiming(11, { duration: 1500, easing: EASE_OUT }),
    );
    rightMessages.value = withDelay(
      2200,
      withTiming(8, { duration: 1500, easing: EASE_OUT }),
    );

    glowPulse.value = withDelay(
      3700,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: EASE_OUT }),
          withTiming(0, { duration: 1200, easing: EASE_OUT }),
        ),
        -1,
        false,
      ),
    );

    subheadlineOpacity.value = withDelay(
      3500,
      withTiming(1, { duration: 600, easing: EASE_OUT }),
    );

    infoCardOpacity.value = withDelay(
      3800,
      withTiming(1, { duration: 600, easing: EASE_OUT }),
    );
    infoCardTranslateY.value = withDelay(
      3800,
      withTiming(0, { duration: 600, easing: EASE_OUT }),
    );

    ctaOpacity.value = withDelay(
      4200,
      withTiming(1, { duration: 600, easing: EASE_OUT }),
    );
  }, []);

  const leftCardStyle = useAnimatedStyle(() => ({
    opacity: leftCardOpacity.value,
  }));

  const leftStatsStyle = useAnimatedStyle(() => ({
    opacity: leftStatsOpacity.value,
  }));

  const dividerStyle = useAnimatedStyle(() => ({
    opacity: dividerProgress.value,
    transform: [{ scaleY: dividerProgress.value }],
  }));

  const sameLabelStyle = useAnimatedStyle(() => ({
    opacity: sameLabelOpacity.value,
  }));

  const rightCardStyle = useAnimatedStyle(() => ({
    opacity: rightCardOpacity.value,
  }));

  const rightStatsStyle = useAnimatedStyle(() => ({
    opacity: rightStatsOpacity.value,
  }));

  const glowRingStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(glowPulse.value, [0, 1], [0.3, 0.8]);
    const shadowRadius = interpolate(glowPulse.value, [0, 1], [4, 12]);
    return {
      shadowColor: Colors.primary,
      shadowOpacity,
      shadowRadius,
      shadowOffset: { width: 0, height: 0 },
    };
  });

  const subheadlineStyle = useAnimatedStyle(() => ({
    opacity: subheadlineOpacity.value,
  }));

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

        {/* Split comparison visual */}
        <View style={styles.splitContainer}>
          {/* LEFT — Before (unoptimised) */}
          <View style={styles.halfColumn}>
            <Animated.View style={[styles.profileCard, leftCardStyle]}>
              <AvatarSilhouette />
              <Text style={styles.profileName}>Sophie, 24</Text>
              <View style={styles.pillMuted}>
                <Text style={styles.pillMutedText}>No effort</Text>
              </View>
            </Animated.View>

            <Animated.View style={[styles.statsColumn, leftStatsStyle]}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Likes</Text>
                <CountingNumber sharedValue={leftLikes} color="#FFFFFF" />
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Matches</Text>
                <Text style={[styles.statValue, { color: '#FFFFFF' }]}>0</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Messages</Text>
                <Text style={[styles.statValue, { color: '#FFFFFF' }]}>0</Text>
              </View>
            </Animated.View>
          </View>

          {/* CENTER DIVIDER */}
          <View style={styles.dividerContainer}>
            <Animated.View style={[styles.dividerLine, dividerStyle]}>
              {Array.from({ length: 30 }).map((_, i) => (
                <View key={i} style={styles.dashSegment} />
              ))}
            </Animated.View>
            <Animated.View style={[styles.sameLabelWrap, sameLabelStyle]}>
              <Text style={styles.sameLabel}>Same girl.</Text>
            </Animated.View>
          </View>

          {/* RIGHT — After (soft-maxxed) */}
          <View style={styles.halfColumn}>
            <Animated.View style={[styles.profileCard, rightCardStyle]}>
              <Animated.View style={glowRingStyle}>
                <AvatarSilhouette glow />
              </Animated.View>
              <Text style={styles.profileName}>Sophie, 24</Text>
              <View style={styles.pillAccent}>
                <Text style={styles.pillAccentText}>Soft-maxxed</Text>
              </View>
            </Animated.View>

            <Animated.View style={[styles.statsColumn, rightStatsStyle]}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Likes</Text>
                <CountingNumber sharedValue={rightLikes} color={Colors.success} />
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Matches</Text>
                <CountingNumber sharedValue={rightMatches} color={Colors.success} />
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Messages</Text>
                <CountingNumber sharedValue={rightMessages} color={Colors.success} />
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Subheadline */}
        <Animated.View style={[styles.subheadlineWrap, subheadlineStyle]}>
          <Text style={styles.subheadline}>Different presentation.</Text>
        </Animated.View>

        <View style={{ flex: 1 }} />

        {/* Info Card */}
        <Animated.View style={[styles.infoCard, infoCardStyle]}>
          <Text style={styles.infoTitle}>It Was Never About Genetics</Text>
          <Text style={styles.infoBody}>
            The difference between being overlooked and being magnetic isn't bone
            structure. It's presentation — skin, styling, makeup, lighting,
            energy. It's all learnable. And it's exactly what Peakd builds for
            you.
          </Text>
        </Animated.View>

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

  splitContainer: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'flex-start',
  },
  halfColumn: {
    flex: 1,
    alignItems: 'center',
  },

  profileCard: {
    width: '100%',
    backgroundColor: '#161616',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 12,
    alignItems: 'center',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },

  avatarOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222222',
  },
  avatarGlow: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  silHead: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#444444',
    marginBottom: 2,
  },
  silBody: {
    width: 30,
    height: 16,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    backgroundColor: '#444444',
  },

  pillMuted: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  pillMutedText: {
    fontSize: 11,
    color: '#666666',
  },
  pillAccent: {
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  pillAccentText: {
    fontSize: 11,
    color: Colors.accent,
  },

  statsColumn: {
    marginTop: 16,
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },

  dividerContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 2,
  },
  dividerLine: {
    alignItems: 'center',
    gap: 4,
  },
  dashSegment: {
    width: 1,
    height: 4,
    backgroundColor: '#444444',
  },
  sameLabelWrap: {
    position: 'absolute',
    top: '45%',
    backgroundColor: Colors.background,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  sameLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },

  subheadlineWrap: {
    alignItems: 'center',
    marginTop: 20,
  },
  subheadline: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },

  infoCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
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
