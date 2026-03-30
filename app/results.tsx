import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  withRepeat,
  Easing,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenLoader } from '@/components/ui/WaveformLoader';
import { getItem, KEYS } from '@/lib/storage';
import type { FaceAnalysisResult, FeatureScores } from '@/lib/anthropic';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const BENTO = {
  bg: '#F8FAFE',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E9F2',
  scoreNum: '#0F1D34',
  labelMuted: '#8B9BB5',
  textBody: '#2A3A52',
  textSecondary: '#5A6A80',
  accentBlue: '#1A73E8',
  accentBlueSoft: '#4FACFE',
  orbGradientStart: '#EFF5FF',
  orbGradientEnd: '#C7DBFA',
  ringTrack: 'rgba(26,115,232,0.08)',
  green: '#22B573',
  greenTrack: 'rgba(34,181,115,0.10)',
  amber: '#F59E0B',
  amberTrack: 'rgba(245,158,11,0.10)',
  blueTrack: 'rgba(79,172,254,0.10)',
  pillBg: 'rgba(26,115,232,0.06)',
  pillText: '#5B7BA5',
  archetypeStart: '#1B6FE0',
  archetypeEnd: '#2D44B8',
  accentBarStart: '#4FACFE',
  accentBarEnd: '#3B5BD9',
};

const RING_SIZE = 190;
const RING_STROKE = 3.5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const PULSE_SIZE = 220;

const FEATURE_NAMES: Record<string, string> = {
  skinQuality: 'Skin Quality',
  facialStructure: 'Structure',
  eyes: 'Eyes',
  nose: 'Nose',
  lipsAndMouth: 'Lips',
  eyebrows: 'Brows',
  hair: 'Hair',
  overallHarmony: 'Harmony',
};

function getScoreLabel(score: number): string {
  if (score >= 8.0) return 'Amazing';
  if (score >= 6.5) return 'Looking good';
  if (score >= 5.0) return 'Room to grow';
  return 'Just getting started';
}

const PERCENTILE_TABLE: [number, number][] = [
  [10.0, 1],
  [9.0, 2],
  [8.5, 5],
  [8.0, 10],
  [7.5, 15],
  [7.0, 22],
  [6.5, 30],
  [6.0, 40],
  [5.5, 50],
  [5.0, 60],
  [4.5, 70],
  [4.0, 78],
  [3.5, 85],
  [3.0, 90],
  [2.0, 96],
  [1.0, 99],
];

function getPercentile(score: number): number {
  const clamped = Math.max(1, Math.min(10, score));
  for (let i = 0; i < PERCENTILE_TABLE.length - 1; i++) {
    const [hiScore, hiPct] = PERCENTILE_TABLE[i];
    const [loScore, loPct] = PERCENTILE_TABLE[i + 1];
    if (clamped >= loScore) {
      const t = (clamped - loScore) / (hiScore - loScore);
      return Math.round(loPct + t * (hiPct - loPct));
    }
  }
  return 99;
}

function getScoreDotColor(score: number): string {
  if (score >= 8.0) return BENTO.green;
  if (score >= 6.5) return BENTO.accentBlue;
  if (score >= 5.0) return BENTO.amber;
  return BENTO.amber;
}

function getTop3Features(featureScores: FeatureScores) {
  return (Object.entries(featureScores) as [string, { score: number; summary: string }][])
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 3)
    .map(([key, val]) => ({
      key,
      name: FEATURE_NAMES[key] ?? key,
      score: val.score,
    }));
}

function getFeatureColor(score: number): { fill: string; track: string } {
  if (score >= 7.0) return { fill: BENTO.green, track: BENTO.greenTrack };
  if (score >= 5.5) return { fill: BENTO.accentBlueSoft, track: BENTO.blueTrack };
  return { fill: BENTO.amber, track: BENTO.amberTrack };
}

export default function ResultsScreen() {
  const router = useRouter();
  const [result, setResult] = useState<FaceAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayScore, setDisplayScore] = useState('0.0');

  const progress = useSharedValue(0);
  const scoreScale = useSharedValue(1);
  const orbScale = useSharedValue(0.85);
  const orbOpacity = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.4);
  const hapticFired = useRef({ 25: false, 50: false, 75: false });

  const bar0Width = useSharedValue(0);
  const bar1Width = useSharedValue(0);
  const bar2Width = useSharedValue(0);
  const barWidths = [bar0Width, bar1Width, bar2Width];

  useEffect(() => {
    (async () => {
      const scanResult = await getItem<FaceAnalysisResult>(KEYS.SCAN_RESULT);
      if (scanResult) setResult(scanResult);
      setLoading(false);
    })();
  }, []);

  const fireHapticLight = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const fireHapticHeavy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const updateDisplay = useCallback((val: number) => {
    setDisplayScore(val.toFixed(1));
  }, []);

  useDerivedValue(() => {
    const target = result?.glowScore ?? 1;
    const pct = (progress.value / target) * 100;

    if (pct >= 25 && !hapticFired.current[25]) {
      hapticFired.current[25] = true;
      runOnJS(fireHapticLight)();
    }
    if (pct >= 50 && !hapticFired.current[50]) {
      hapticFired.current[50] = true;
      runOnJS(fireHapticLight)();
    }
    if (pct >= 75 && !hapticFired.current[75]) {
      hapticFired.current[75] = true;
      runOnJS(fireHapticLight)();
    }

    runOnJS(updateDisplay)(progress.value);
  });

  useEffect(() => {
    if (!loading && result) {
      orbScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 100 }));
      orbOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));

      pulseOpacity.value = withDelay(
        100,
        withRepeat(withTiming(0.7, { duration: 1500 }), -1, true),
      );

      progress.value = withDelay(
        500,
        withTiming(
          result.glowScore,
          { duration: 1200, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (finished) {
              runOnJS(fireHapticHeavy)();
              scoreScale.value = withSequence(
                withTiming(1.15, { duration: 150 }),
                withTiming(1.0, { duration: 250 }),
              );
            }
          },
        ),
      );

      const top3 = getTop3Features(result.featureScores);
      const barDelays = [1700, 1850, 2000];
      top3.forEach((feature, index) => {
        barWidths[index].value = withDelay(
          barDelays[index],
          withSpring((feature.score / 10) * 100, { damping: 15, stiffness: 90 }),
        );
      });

      setTimeout(
        () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
        1450,
      );
    }
  }, [loading, result]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress.value / 10),
  }));

  const scoreScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const orbScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    opacity: orbOpacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const bar0Style = useAnimatedStyle(() => ({ width: `${bar0Width.value}%` }));
  const bar1Style = useAnimatedStyle(() => ({ width: `${bar1Width.value}%` }));
  const bar2Style = useAnimatedStyle(() => ({ width: `${bar2Width.value}%` }));
  const barStyles = [bar0Style, bar1Style, bar2Style];

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BENTO.bg }}>
        <ScreenLoader />
      </SafeAreaView>
    );
  }

  if (!result) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BENTO.bg }}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No results found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const scoreLabel = getScoreLabel(result.glowScore);
  const percentile = getPercentile(result.glowScore);
  const dotColor = getScoreDotColor(result.glowScore);
  const archetype = result.archetype;
  const top3 = getTop3Features(result.featureScores);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BENTO.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ backgroundColor: BENTO.bg }}
      >
        {/* ── Orb ─────────────────────────────────────────────────── */}
        <View style={styles.orbSection}>
          <View style={styles.orbContainer}>
            <Animated.View style={[styles.outerPulse, pulseStyle]} />
            <Animated.View style={[styles.orb, orbScaleStyle]}>
              <LinearGradient
                colors={[BENTO.orbGradientStart, BENTO.orbGradientEnd]}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.orbGradient}
              />
              <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg}>
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={BENTO.ringTrack}
                  strokeWidth={RING_STROKE}
                  fill="transparent"
                />
                <AnimatedCircle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={BENTO.accentBlue}
                  strokeWidth={RING_STROKE}
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  animatedProps={animatedProps}
                  rotation="-90"
                  origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />
              </Svg>
              <Animated.View style={[styles.scoreOverlay, scoreScaleStyle]}>
                <Text style={styles.scoreNumber}>{displayScore}</Text>
                <Text style={styles.scoreLabel}>GLOW SCORE</Text>
              </Animated.View>
            </Animated.View>
          </View>
        </View>

        {/* ── Status Row ──────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(1100).duration(400).springify()}
          style={styles.statusRow}
        >
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
            <Text style={styles.statusPillText}>{scoreLabel}</Text>
          </View>

          <Animated.View entering={FadeInUp.delay(1200).duration(350).springify()}>
            <LinearGradient
              colors={['rgba(26,115,232,0.08)', 'rgba(108,99,255,0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topBadge}
            >
              <Svg width={12} height={12} viewBox="0 0 16 16">
                <Path
                  d="M8 1L10.2 5.5L15 6.2L11.5 9.6L12.4 14.4L8 12.1L3.6 14.4L4.5 9.6L1 6.2L5.8 5.5L8 1Z"
                  fill={BENTO.accentBlue}
                  opacity={0.8}
                />
              </Svg>
              <Text style={styles.topBadgeText}>Top {percentile}%</Text>
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        {/* ── Bento Grid ──────────────────────────────────────────── */}
        <View style={styles.bentoContainer}>
          {/* Card A – First Thing We Noticed (full width) */}
          {result.uniqueDetail ? (
            <Animated.View
              entering={FadeInUp.delay(1300).duration(450).springify()}
              style={styles.noticedCard}
            >
              <LinearGradient
                colors={[BENTO.accentBarStart, BENTO.accentBarEnd]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.noticedBar}
              />
              <View style={styles.noticedContent}>
                <Text style={styles.noticedLabel}>FIRST THING WE NOTICED</Text>
                <Text style={styles.noticedText}>{result.uniqueDetail}</Text>
              </View>
            </Animated.View>
          ) : null}

          {/* Side-by-side row */}
          <View style={styles.bentoRow}>
            {/* Left – Archetype */}
            <Animated.View
              entering={FadeInUp.delay(1450).duration(450).springify()}
              style={styles.archetypeWrapper}
            >
              <LinearGradient
                colors={[BENTO.archetypeStart, BENTO.archetypeEnd]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.archetypeCard}
              >
                <View style={styles.archetypeGlow} />
                <Text style={styles.archetypeLabel}>YOUR ARCHETYPE</Text>
                <View style={styles.archetypeBottom}>
                  <Text style={styles.archetypeName}>{archetype.name}</Text>
                  <Text style={styles.archetypeDesc}>
                    {archetype.description.split('. ')[0]}.
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Right – Feature Scores */}
            <Animated.View
              entering={FadeInUp.delay(1550).duration(450).springify()}
              style={styles.scoresColumn}
            >
              {top3.map((feature, index) => {
                const colors = getFeatureColor(feature.score);
                return (
                  <View key={feature.key} style={styles.miniScoreCard}>
                    <View style={styles.miniScoreHeader}>
                      <Text style={styles.miniScoreName}>{feature.name}</Text>
                      <Text style={[styles.miniScoreValue, { color: colors.fill }]}>
                        {feature.score.toFixed(1)}
                      </Text>
                    </View>
                    <View style={[styles.miniBarTrack, { backgroundColor: colors.track }]}>
                      <Animated.View
                        style={[
                          styles.miniBarFill,
                          { backgroundColor: colors.fill },
                          barStyles[index],
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </Animated.View>
          </View>

          {/* Card C – What You're Doing Right (full width) */}
          {result.topStrength && (
            <Animated.View
              entering={FadeInUp.delay(1700).duration(450).springify()}
              style={[styles.insightCard, { borderLeftColor: BENTO.green }]}
            >
              <Text style={[styles.insightLabel, { color: BENTO.green }]}>
                WHAT YOU'RE DOING RIGHT
              </Text>
              <Text style={styles.insightFeature}>{result.topStrength.feature}</Text>
              <Text style={styles.insightText}>{result.topStrength.insight}</Text>
            </Animated.View>
          )}

          {/* Card D – Biggest Area to Improve (full width) */}
          {result.topOpportunity && (
            <Animated.View
              entering={FadeInUp.delay(1800).duration(450).springify()}
              style={[styles.insightCard, { borderLeftColor: BENTO.amber }]}
            >
              <Text style={[styles.insightLabel, { color: BENTO.amber }]}>
                YOUR BIGGEST AREA TO IMPROVE
              </Text>
              <Text style={styles.insightFeature}>{result.topOpportunity.feature}</Text>
              <Text style={styles.insightText}>{result.topOpportunity.insight}</Text>
            </Animated.View>
          )}
        </View>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(2100).duration(400).springify()}
          style={styles.ctaSection}
        >
          <Text style={styles.ctaHeading}>See exactly how to improve</Text>
          <Text style={styles.ctaSubtext}>
            Your step by step plan is ready. Tailored to your face, your features,
            your goals.
          </Text>
          <PrimaryButton
            label="Show me my plan"
            onPress={() => router.push('/paywall')}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },

  /* ── Empty state ──────────────────────────────────────────────── */
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: BENTO.textSecondary,
    fontSize: 14,
  },

  /* ── Orb ──────────────────────────────────────────────────────── */
  orbSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  orbContainer: {
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerPulse: {
    position: 'absolute',
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    borderRadius: PULSE_SIZE / 2,
    backgroundColor: 'rgba(26,115,232,0.12)',
  },
  orb: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orbGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RING_SIZE / 2,
  },
  ringSvg: {
    position: 'absolute',
  },
  scoreOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 50,
    fontWeight: '700',
    color: BENTO.scoreNum,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: BENTO.labelMuted,
    letterSpacing: 1.2,
    marginTop: 2,
  },

  /* ── Status Row ───────────────────────────────────────────────── */
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: BENTO.pillBg,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '500',
    color: BENTO.pillText,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  topBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: BENTO.accentBlue,
  },

  /* ── Bento Container ──────────────────────────────────────────── */
  bentoContainer: {
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 16,
  },

  /* ── Card A – Noticed ─────────────────────────────────────────── */
  noticedCard: {
    backgroundColor: BENTO.cardBg,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: BENTO.cardBorder,
    padding: 16,
    paddingLeft: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  noticedBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  noticedContent: {
    paddingLeft: 10,
  },
  noticedLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: BENTO.accentBlueSoft,
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  noticedText: {
    fontSize: 14,
    color: BENTO.textBody,
    lineHeight: 22,
  },

  /* ── Side-by-side Row ─────────────────────────────────────────── */
  bentoRow: {
    flexDirection: 'row',
    gap: 10,
  },

  /* ── Archetype Card ───────────────────────────────────────────── */
  archetypeWrapper: {
    flex: 1,
  },
  archetypeCard: {
    borderRadius: 18,
    padding: 18,
    paddingHorizontal: 16,
    minHeight: 170,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  archetypeGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  archetypeLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.5,
    marginBottom: 'auto' as unknown as number,
  },
  archetypeBottom: {
    marginTop: 'auto' as unknown as number,
  },
  archetypeName: {
    fontSize: 23,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 27,
  },
  archetypeDesc: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 17,
    marginTop: 6,
  },

  /* ── Feature Score Cards ──────────────────────────────────────── */
  scoresColumn: {
    flex: 1,
    gap: 10,
  },
  miniScoreCard: {
    flex: 1,
    backgroundColor: BENTO.cardBg,
    borderRadius: 14,
    padding: 13,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: BENTO.cardBorder,
    justifyContent: 'center',
  },
  miniScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  miniScoreName: {
    fontSize: 12,
    fontWeight: '600',
    color: BENTO.scoreNum,
  },
  miniScoreValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  miniBarTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: 3,
    borderRadius: 2,
  },

  /* ── Insight Cards (Strength / Improvement) ───────────────────── */
  insightCard: {
    backgroundColor: BENTO.cardBg,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: BENTO.cardBorder,
    borderLeftWidth: 3,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  insightLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  insightFeature: {
    fontSize: 15,
    fontWeight: '600',
    color: BENTO.scoreNum,
    marginTop: 5,
  },
  insightText: {
    fontSize: 12.5,
    color: BENTO.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },

  /* ── CTA ──────────────────────────────────────────────────────── */
  ctaSection: {
    marginTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  ctaHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: BENTO.scoreNum,
    textAlign: 'center',
  },
  ctaSubtext: {
    fontSize: 13,
    color: BENTO.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 24,
  },
});
