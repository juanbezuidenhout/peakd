import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';

const BARS = [
  { label: 'Dating', pct: 80, type: 'accent' },
  { label: 'Popularity', pct: 65, type: 'dark' },
  { label: 'Career Oppt.', pct: 35, type: 'muted' },
  { label: 'Income', pct: 30, type: 'muted' },
] as const;

type BarType = (typeof BARS)[number]['type'];

const BAR_ANIM_DURATION = 800;
const BAR_STAGGER = 150;
const TOTAL_BAR_ANIM = (BARS.length - 1) * BAR_STAGGER + BAR_ANIM_DURATION;

function AccentBarFill({
  progress,
  glowPulse,
}: {
  progress: Animated.SharedValue<number>;
  glowPulse: Animated.SharedValue<number>;
}) {
  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowPulse.value, [0, 1], [0.4, 0.8]),
    shadowRadius: interpolate(glowPulse.value, [0, 1], [8, 18]),
  }));

  return (
    <Animated.View style={[styles.accentGlowWrap, fillStyle, glowStyle]}>
      <LinearGradient
        colors={['#06B6D4', '#22D3EE']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.barFillInner}
      />
    </Animated.View>
  );
}

function BarRow({
  label,
  pct,
  type,
  progress,
  glowPulse,
}: {
  label: string;
  pct: number;
  type: BarType;
  progress: Animated.SharedValue<number>;
  glowPulse: Animated.SharedValue<number>;
}) {
  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const isAccent = type === 'accent';
  const barColor = type === 'dark' ? Colors.navy : Colors.textMuted;

  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        {isAccent ? (
          <AccentBarFill progress={progress} glowPulse={glowPulse} />
        ) : (
          <Animated.View
            style={[styles.barFill, { backgroundColor: barColor }, fillStyle]}
          />
        )}
      </View>
      <Text
        style={[
          styles.barPct,
          { color: isAccent ? '#06B6D4' : Colors.textPrimary },
        ]}
      >
        {pct}%
      </Text>
    </View>
  );
}

export default function PainDatingScreen() {
  const router = useRouter();

  const progresses = BARS.map(() => useSharedValue(0));
  const glowPulse = useSharedValue(0);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    BARS.forEach((bar, i) => {
      progresses[i].value = withDelay(
        i * BAR_STAGGER,
        withTiming(bar.pct, {
          duration: BAR_ANIM_DURATION,
          easing: Easing.out(Easing.cubic),
        }),
      );
    });

    glowPulse.value = withDelay(
      BAR_ANIM_DURATION,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );

    cardOpacity.value = withDelay(
      TOTAL_BAR_ANIM + 100,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }),
    );
  }, []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  return (
    <SafeScreen>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>

        <View style={styles.headlineWrap}>
          <Text style={styles.headline}>
            {'Attractiveness Influence\nAcross Life Domains'}
          </Text>
        </View>

        <View style={styles.chartSection}>
          {BARS.map((bar, i) => (
            <BarRow
              key={bar.label}
              label={bar.label}
              pct={bar.pct}
              type={bar.type}
              progress={progresses[i]}
              glowPulse={glowPulse}
            />
          ))}
        </View>

        <Animated.View style={[styles.glassOuter, cardAnimStyle]}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 60 : 30}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['#EDF2FF', '#F0F4FF', '#EBF0FC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glassContent}>
            <Text style={styles.infoTitle}>The Brutal Truth</Text>
            <Text style={styles.infoBody}>
              99% of people don't realize how much attractiveness impacts their
              lives, especially for dating
            </Text>
          </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Pressable
          style={styles.ctaButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/pain-halo');
          }}
        >
          <Text style={styles.ctaLabel}>Next</Text>
        </Pressable>
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
  headlineWrap: {
    paddingTop: '20%',
    alignItems: 'center',
    marginBottom: 48,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.navy,
    textAlign: 'center',
    lineHeight: 36,
  },
  chartSection: {
    paddingHorizontal: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  barLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    width: 110,
  },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: '#E4E9F0',
    borderRadius: 7,
    overflow: 'visible',
  },
  barFill: {
    height: '100%',
    borderRadius: 7,
  },
  barFillInner: {
    flex: 1,
    borderRadius: 7,
  },
  accentGlowWrap: {
    height: '100%',
    borderRadius: 7,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    overflow: 'hidden',
    elevation: 10,
  },
  barPct: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
    width: 48,
    textAlign: 'right',
  },
  glassOuter: {
    borderRadius: 20,
    marginTop: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E6F0',
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  glassContent: {
    padding: 22,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 8,
  },
  infoBody: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  ctaButton: {
    width: '100%',
    height: 56,
    backgroundColor: Colors.navy,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ctaLabel: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
