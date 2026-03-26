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

const DECILES = [
  { label: '10%', value: 0 },
  { label: '20%', value: 0 },
  { label: '30%', value: 0 },
  { label: '40%', value: 0 },
  { label: '50%', value: 0 },
  { label: '60%', value: 1 },
  { label: '70%', value: 4 },
  { label: '80%', value: 8 },
  { label: '90%', value: 17 },
  { label: '100%', value: 39 },
] as const;

const MAX_VALUE = 39;
const CHART_HEIGHT = 240;
const BAR_ANIM_DURATION = 800;
const BAR_STAGGER = 80;
const TOTAL_BAR_ANIM = (DECILES.length - 1) * BAR_STAGGER + BAR_ANIM_DURATION;
const MIN_BAR_HEIGHT = 2;
const GRID_VALUES = [10, 20, 30];
const ANNOTATION_VALUE = 17;

function getBarHeight(value: number): number {
  if (value === 0) return MIN_BAR_HEIGHT;
  return (value / MAX_VALUE) * CHART_HEIGHT;
}

function AnimatedBar({
  value,
  isAccent,
  delay,
  glowPulse,
}: {
  value: number;
  isAccent: boolean;
  delay: number;
  glowPulse: Animated.SharedValue<number>;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(getBarHeight(value), {
        duration: BAR_ANIM_DURATION,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, []);

  const barAnimStyle = useAnimatedStyle(() => ({
    height: progress.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowPulse.value, [0, 1], [0.5, 0.9]),
    shadowRadius: interpolate(glowPulse.value, [0, 1], [8, 20]),
  }));

  const color = isAccent ? '#22D3EE' : '#FFFFFF';

  return (
    <View style={styles.barCol}>
      <Text style={[styles.barValue, { color }]}>{value}</Text>
      {isAccent ? (
        <Animated.View style={[styles.accentBar, barAnimStyle, glowStyle]}>
          <LinearGradient
            colors={['#06B6D4', '#22D3EE']}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : (
        <Animated.View style={[styles.whiteBar, barAnimStyle]} />
      )}
    </View>
  );
}

export default function PainChatScreen() {
  const router = useRouter();
  const glowPulse = useSharedValue(0);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    glowPulse.value = withDelay(
      TOTAL_BAR_ANIM,
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

  const annotationBottom = (ANNOTATION_VALUE / MAX_VALUE) * CHART_HEIGHT;

  return (
    <SafeScreen>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>

        <Text style={styles.yAxisLabel}>AVG # OF LIKES / WK</Text>

        <View style={styles.plotArea}>
          {GRID_VALUES.map((gv) => (
            <View
              key={gv}
              style={[
                styles.gridLine,
                { bottom: (gv / MAX_VALUE) * CHART_HEIGHT },
              ]}
            />
          ))}

          <View style={[styles.dashedLine, { bottom: annotationBottom }]} />
          <View
            style={[styles.annotationWrap, { bottom: annotationBottom + 8 }]}
          >
            <Text style={styles.annotationText}>
              Top 10% of Profiles {'→'}
            </Text>
          </View>

          <View style={styles.barsRow}>
            {DECILES.map((d, i) => (
              <AnimatedBar
                key={d.label}
                value={d.value}
                isAccent={i === DECILES.length - 1}
                delay={i * BAR_STAGGER}
                glowPulse={glowPulse}
              />
            ))}
          </View>
        </View>

        <View style={styles.xLabelsRow}>
          {DECILES.map((d, i) => (
            <Text
              key={d.label}
              style={[
                styles.xLabel,
                {
                  color:
                    i === DECILES.length - 1 ? '#22D3EE' : '#FFFFFF',
                },
              ]}
            >
              {d.label}
            </Text>
          ))}
        </View>

        <Text style={styles.xAxisTitle}>ATTRACTIVENESS SCORE</Text>

        <Animated.View style={[styles.infoCard, cardAnimStyle]}>
          <Text style={styles.infoTitle}>The Attention Gap</Text>
          <Text style={styles.infoBody}>
            On dating apps, the top 10% of women receive almost all the quality
            attention. Everyone else is competing for what's left. Your face is
            your profile — and Peakd shows you exactly how to optimise it.
          </Text>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Pressable
          style={styles.ctaButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/cinematic');
          }}
        >
          <Text style={styles.ctaLabel}>Next</Text>
        </Pressable>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { marginTop: 8, alignSelf: 'flex-start' },
  backChevron: { fontSize: 32, color: Colors.textSecondary },
  yAxisLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 32,
    marginBottom: 12,
  },
  plotArea: {
    height: CHART_HEIGHT,
    overflow: 'visible',
    marginTop: 20,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dashedLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
  },
  annotationWrap: {
    position: 'absolute',
    left: 4,
    zIndex: 10,
  },
  annotationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  barsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    flexDirection: 'row',
    overflow: 'visible',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  barValue: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  whiteBar: {
    width: '62%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  accentBar: {
    width: '62%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    overflow: 'hidden',
    elevation: 10,
  },
  xLabelsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  xLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  xAxisTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
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
