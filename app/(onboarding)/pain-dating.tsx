import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
  { label: 'Popularity', pct: 65, type: 'white' },
  { label: 'Career Oppt.', pct: 35, type: 'grey' },
  { label: 'Income', pct: 30, type: 'grey' },
] as const;

type BarType = (typeof BARS)[number]['type'];

const BAR_ANIM_DURATION = 800;
const BAR_STAGGER = 150;
const TOTAL_BAR_ANIM = (BARS.length - 1) * BAR_STAGGER + BAR_ANIM_DURATION;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

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
  const barColor = type === 'white' ? '#FFFFFF' : '#555555';

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
          { color: isAccent ? '#22D3EE' : '#FFFFFF' },
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

        <Animated.View style={[styles.infoCard, cardAnimStyle]}>
          <Text style={styles.infoTitle}>The Brutal Truth</Text>
          <Text style={styles.infoBody}>
            99% of people don't realize how much attractiveness impacts their
            lives, especially for dating
          </Text>
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    width: 110,
  },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: 'transparent',
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
  infoCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ctaLabel: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
  },
});
