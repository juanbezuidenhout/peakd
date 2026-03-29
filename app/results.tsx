import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
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
import type { FaceAnalysisResult } from '@/lib/anthropic';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 200;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function getScoreLabel(score: number): { text: string; color: string } {
  if (score >= 8.0) return { text: 'Exceptional', color: Colors.success };
  if (score >= 6.5) return { text: 'Above Average', color: Colors.gold };
  if (score >= 5.0) return { text: 'Room to Glow', color: Colors.textSecondary };
  return { text: 'Early Journey', color: Colors.textSecondary };
}

export default function ResultsScreen() {
  const router = useRouter();
  const [result, setResult] = useState<FaceAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayScore, setDisplayScore] = useState('0.0');
  const [ringDone, setRingDone] = useState(false);

  const progress = useSharedValue(0);

  useEffect(() => {
    (async () => {
      const scanResult = await getItem<FaceAnalysisResult>(KEYS.SCAN_RESULT);
      if (scanResult) setResult(scanResult);
      setLoading(false);
    })();
  }, []);

  const handleRingComplete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRingDone(true);
  }, []);

  const updateDisplay = useCallback((val: number) => {
    setDisplayScore(val.toFixed(1));
  }, []);

  useDerivedValue(() => {
    runOnJS(updateDisplay)(progress.value);
  });

  const glowScore = result?.glowScore ?? 0;

  useEffect(() => {
    if (!loading && result) {
      progress.value = withDelay(
        500,
        withTiming(
          result.glowScore,
          { duration: 2000, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (finished) runOnJS(handleRingComplete)();
          },
        ),
      );
    }
  }, [loading, result, progress, handleRingComplete]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress.value / 10),
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

  return (
    <SafeScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section 1 — Glow Score Reveal */}
        <View style={styles.heroSection}>
          <View style={styles.ringGlow}>
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
            <View style={styles.scoreOverlay}>
              <Text style={styles.scoreNumber}>{displayScore}</Text>
              <Text style={styles.scoreDenominator}>/10</Text>
            </View>
          </View>

          <Text style={[styles.scoreLabel, { color: scoreLabel.color }]}>
            {scoreLabel.text}
          </Text>
        </View>

        {/* Section 2 — Archetype */}
        {ringDone && archetype && (
          <Animated.View
            entering={FadeIn.delay(500).duration(400)}
            style={styles.archetypeCard}
          >
            <Text style={styles.cardLabel}>YOUR ARCHETYPE</Text>
            <Text style={styles.archetypeName}>{archetype.name}</Text>
            <Text style={styles.archetypeDesc}>{archetype.description}</Text>
          </Animated.View>
        )}

        {/* Section 3 — Top Strength */}
        {ringDone && topStrength && (
          <Animated.View
            entering={FadeInUp.delay(700).duration(400)}
            style={[styles.highlightCard, styles.strengthBorder]}
          >
            <Text style={[styles.highlightLabel, { color: Colors.success }]}>
              YOUR TOP STRENGTH
            </Text>
            <Text style={styles.highlightFeature}>{topStrength.feature}</Text>
            <Text style={styles.highlightInsight}>{topStrength.insight}</Text>
          </Animated.View>
        )}

        {/* Section 4 — Top Opportunity */}
        {ringDone && topOpportunity && (
          <Animated.View
            entering={FadeInUp.delay(900).duration(400)}
            style={[styles.highlightCard, styles.opportunityBorder]}
          >
            <Text style={[styles.highlightLabel, { color: Colors.warning }]}>
              YOUR #1 OPPORTUNITY
            </Text>
            <Text style={styles.highlightFeature}>
              {topOpportunity.feature}
            </Text>
            <Text style={styles.highlightInsight}>
              {topOpportunity.insight}
            </Text>
          </Animated.View>
        )}

        {/* Section 5 — CTA */}
        {ringDone && (
          <Animated.View
            entering={FadeIn.delay(1100).duration(400)}
            style={styles.ctaSection}
          >
            <Text style={styles.ctaHeading}>
              See your full beauty blueprint
            </Text>
            <Text style={styles.ctaSubtext}>
              All 8 feature scores {'\u2022'} 5 personalized recommendations{' '}
              {'\u2022'} Your shareable Glow Card
            </Text>
            <PrimaryButton
              label="Unlock Full Results \u2192"
              onPress={() => router.push('/paywall')}
            />
            <Text style={styles.socialProof}>
              Join 500,000+ women on their glow journey
            </Text>
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
  socialProof: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
});
