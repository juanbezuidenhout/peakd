import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenLoader } from '@/components/ui/WaveformLoader';
import { Colors } from '@/constants/colors';
import { getItem, KEYS } from '@/lib/storage';
import type { FaceAnalysisResult, FeatureScores } from '@/lib/anthropic';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 200;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const FEATURE_NAMES: Record<string, string> = {
  skinQuality: 'Skin Quality',
  facialStructure: 'Facial Structure',
  eyes: 'Eyes',
  nose: 'Nose',
  lipsAndMouth: 'Lips & Mouth',
  eyebrows: 'Eyebrows',
  hair: 'Hair',
  overallHarmony: 'Overall Harmony',
};

function getScoreLabel(score: number): { text: string; color: string } {
  if (score >= 8.0) return { text: 'Amazing', color: Colors.success };
  if (score >= 6.5) return { text: 'Looking good', color: Colors.gold };
  if (score >= 5.0) return { text: 'Room to grow', color: Colors.textSecondary };
  return { text: 'Just getting started', color: Colors.textSecondary };
}

function getSecondOpportunity(featureScores: FeatureScores) {
  const entries = Object.entries(featureScores) as [string, { score: number; summary: string }][];
  const sorted = [...entries].sort((a, b) => a[1].score - b[1].score);
  const second = sorted[1];
  if (!second) return null;
  return {
    feature: FEATURE_NAMES[second[0]] ?? second[0],
    insight: second[1].summary,
  };
}

export default function ResultsScreen() {
  const router = useRouter();
  const [result, setResult] = useState<FaceAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayScore, setDisplayScore] = useState('0.0');
  const [ringDone, setRingDone] = useState(false);

  const progress = useSharedValue(0);
  const scoreScale = useSharedValue(1);
  const glowPulse = useSharedValue(0.4);
  const hapticFired = useRef({ 25: false, 50: false, 75: false });

  useEffect(() => {
    (async () => {
      const scanResult = await getItem<FaceAnalysisResult>(KEYS.SCAN_RESULT);
      if (scanResult) setResult(scanResult);
      setLoading(false);
    })();
  }, []);

  const fireHapticTick = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const fireStartHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleRingComplete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setRingDone(true);
  }, []);

  const updateDisplay = useCallback((val: number) => {
    setDisplayScore(val.toFixed(1));
  }, []);

  useDerivedValue(() => {
    const pct = result ? (progress.value / (result.glowScore || 1)) * 100 : 0;

    if (pct >= 25 && !hapticFired.current[25]) {
      hapticFired.current[25] = true;
      runOnJS(fireHapticTick)();
    }
    if (pct >= 50 && !hapticFired.current[50]) {
      hapticFired.current[50] = true;
      runOnJS(fireHapticTick)();
    }
    if (pct >= 75 && !hapticFired.current[75]) {
      hapticFired.current[75] = true;
      runOnJS(fireHapticTick)();
    }

    runOnJS(updateDisplay)(progress.value);
  });

  const glowScore = result?.glowScore ?? 0;

  useEffect(() => {
    if (!loading && result) {
      setTimeout(() => fireStartHaptic(), 500);

      progress.value = withDelay(
        500,
        withTiming(
          result.glowScore,
          { duration: 2000, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (finished) {
              runOnJS(handleRingComplete)();
              scoreScale.value = withSequence(
                withTiming(1.15, { duration: 150 }),
                withTiming(1.0, { duration: 250 }),
              );
              glowPulse.value = withSequence(
                withTiming(0.8, { duration: 300 }),
                withTiming(0.4, { duration: 300 }),
              );
            }
          },
        ),
      );
    }
  }, [loading, result, progress, handleRingComplete, scoreScale, glowPulse, fireStartHaptic]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress.value / 10),
  }));

  const scoreScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const ringGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowPulse.value,
  }));

  if (loading) {
    return (
      <SafeScreen>
        <ScreenLoader />
      </SafeScreen>
    );
  }

  const scoreLabel = getScoreLabel(glowScore);
  const archetype = result?.archetype;
  const topStrength = result?.topStrength;
  const topOpportunity = result?.topOpportunity;
  const secondOpportunity = result?.featureScores
    ? getSecondOpportunity(result.featureScores)
    : null;

  return (
    <SafeScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section 1 — Glow Score Reveal */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.ringGlow, ringGlowStyle]}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={Colors.border}
                strokeWidth={RING_STROKE}
                fill="transparent"
              />
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={Colors.primary}
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
              <Text style={styles.scoreDenominator}>/10</Text>
            </Animated.View>
          </Animated.View>

          <Text style={[styles.scoreLabel, { color: scoreLabel.color }]}>
            {scoreLabel.text}
          </Text>
        </View>

        {/* Section 1.5 — First thing we noticed */}
        {ringDone && result?.uniqueDetail ? (
          <Animated.View
            entering={FadeIn.delay(300).duration(400)}
            style={styles.uniqueDetailCard}
            onLayout={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
          >
            <Text style={styles.uniqueDetailLabel}>FIRST THING WE NOTICED</Text>
            <Text style={styles.uniqueDetailText}>{result.uniqueDetail}</Text>
          </Animated.View>
        ) : null}

        {/* Section 2 — Archetype */}
        {ringDone && archetype && (
          <Animated.View
            entering={FadeIn.delay(700).duration(400)}
            style={styles.archetypeCard}
            onLayout={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
          >
            <Text style={styles.cardLabel}>YOUR ARCHETYPE</Text>
            <Text style={styles.archetypeName}>{archetype.name}</Text>
            <Text style={styles.archetypeDesc}>{archetype.description}</Text>
          </Animated.View>
        )}

        {/* Section 3 — What you're doing right */}
        {ringDone && topStrength && (
          <Animated.View
            entering={FadeInUp.delay(900).duration(400)}
            style={[styles.highlightCard, styles.strengthBorder]}
            onLayout={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
          >
            <Text style={[styles.highlightLabel, { color: Colors.success }]}>
              WHAT YOU'RE DOING RIGHT
            </Text>
            <Text style={styles.highlightFeature}>{topStrength.feature}</Text>
            <Text style={styles.highlightInsight}>{topStrength.insight}</Text>
          </Animated.View>
        )}

        {/* Section 4 — First opportunity */}
        {ringDone && topOpportunity && (
          <Animated.View
            entering={FadeInUp.delay(1100).duration(400)}
            style={[styles.highlightCard, styles.opportunityBorder]}
            onLayout={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
          >
            <Text style={[styles.highlightLabel, { color: Colors.warning }]}>
              YOUR BIGGEST AREA TO IMPROVE
            </Text>
            <Text style={styles.highlightFeature}>
              {topOpportunity.feature}
            </Text>
            <Text style={styles.highlightInsight}>
              {topOpportunity.insight}
            </Text>
          </Animated.View>
        )}

        {/* Section 5 — Second opportunity */}
        {ringDone && secondOpportunity && (
          <Animated.View
            entering={FadeInUp.delay(1300).duration(400)}
            style={[styles.highlightCard, styles.opportunityBorder]}
            onLayout={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
          >
            <Text style={[styles.highlightLabel, { color: Colors.warning }]}>
              ANOTHER THING HOLDING YOU BACK
            </Text>
            <Text style={styles.highlightFeature}>
              {secondOpportunity.feature}
            </Text>
            <Text style={styles.highlightInsight}>
              {secondOpportunity.insight}
            </Text>
          </Animated.View>
        )}

        {/* Section 6 — CTA */}
        {ringDone && (
          <Animated.View
            entering={FadeIn.delay(1500).duration(400)}
            style={styles.ctaSection}
          >
            <Text style={styles.ctaHeading}>
              See exactly how to improve
            </Text>
            <Text style={styles.ctaSubtext}>
              Your step-by-step plan is ready. Tailored to your face, your
              features, your goals.
            </Text>
            <PrimaryButton
              label="Show me my plan →"
              onPress={() => router.push('/paywall')}
            />
          </Animated.View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingBottom: 40,
    gap: 16,
  },
  ringGlow: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 30,
    shadowOpacity: 0.4,
    elevation: 12,
  },
  scoreOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scoreDenominator: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },

  uniqueDetailCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 24,
  },
  uniqueDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  uniqueDetailText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    lineHeight: 24,
    marginTop: 8,
  },

  archetypeCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  archetypeName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.accent,
  },
  archetypeDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: 8,
  },

  highlightCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 16,
  },
  strengthBorder: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  opportunityBorder: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  highlightLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  highlightFeature: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 6,
  },
  highlightInsight: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginTop: 6,
  },

  ctaSection: {
    marginTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  ctaHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  ctaSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 24,
  },
});
