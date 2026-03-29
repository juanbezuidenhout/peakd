import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { getItem, KEYS } from '@/lib/storage';
import type { FaceAnalysisResult, FeatureScores } from '@/lib/anthropic';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  background: '#FFFFFF',
  backgroundGradientTop: '#E8F4FD',
  backgroundGradientBottom: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  cardBackground: '#F9FAFB',
  cardBorder: '#E5E7EB',
  selectedBorder: '#1A1A1A',
  buttonBackground: '#1A1A1A',
  buttonText: '#FFFFFF',
  accent: '#7C3AED',
  iconBackground: '#EEF2FF',
};

const FEATURE_NAMES: Record<keyof FeatureScores, string> = {
  facialStructure: 'Structure',
  skinQuality: 'Skin',
  eyes: 'Eyes',
  overallHarmony: 'Harmony',
  lipsAndMouth: 'Lips',
  nose: 'Nose',
  hair: 'Hair',
  eyebrows: 'Brows',
};

function getTop2Features(fs: FeatureScores) {
  return (Object.entries(fs) as [keyof FeatureScores, { score: number }][])
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 2)
    .map(([key, val]) => ({ name: FEATURE_NAMES[key], score: val.score }));
}

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [userName, setUserName] = useState('');
  const [result, setResult] = useState<FaceAnalysisResult | null>(null);

  useEffect(() => {
    (async () => {
      const [name, scan] = await Promise.all([
        getItem<string>(KEYS.USER_NAME),
        getItem<FaceAnalysisResult>(KEYS.SCAN_RESULT),
      ]);
      setUserName(name ?? '');
      if (scan) setResult(scan);
    })();
  }, []);

  const goBack = () => {
    if (step === 1) router.back();
    else setStep((s) => s - 1);
  };

  const skip = () => {
    router.push('/results-full');
  };

  const advance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => s + 1);
  };

  const top2 = result?.featureScores ? getTop2Features(result.featureScores) : [];
  const glowScore = result?.glowScore ?? 0;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[C.backgroundGradientTop, C.backgroundGradientBottom]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Nav bar */}
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={goBack} hitSlop={12}>
          <Text style={styles.navBack}>←</Text>
        </Pressable>
        <Pressable onPress={skip} hitSlop={12}>
          <Text style={styles.navSkip}>Skip</Text>
        </Pressable>
      </View>

      {/* Step content — keyed by step so Reanimated re-mounts */}
      {step === 1 && (
        <Animated.View
          key="step1"
          entering={SlideInRight.duration(300)}
          exiting={SlideOutLeft.duration(300)}
          style={styles.stepContainer}
        >
          <Step1
            userName={userName}
            glowScore={glowScore}
            top2={top2}
            onContinue={advance}
          />
        </Animated.View>
      )}

      {step === 2 && (
        <Animated.View
          key="step2"
          entering={SlideInRight.duration(300)}
          exiting={SlideOutLeft.duration(300)}
          style={styles.stepContainer}
        >
          <Step2 onContinue={advance} />
        </Animated.View>
      )}

      {step === 3 && (
        <Animated.View
          key="step3"
          entering={SlideInRight.duration(300)}
          exiting={SlideOutLeft.duration(300)}
          style={styles.stepContainer}
        >
          <Step3
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            onContinue={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/results-full');
            }}
          />
        </Animated.View>
      )}
    </View>
  );
}

/* ──────────────────────────── Screen 1 ──────────────────────────── */

function Step1({
  userName,
  glowScore,
  top2,
  onContinue,
}: {
  userName: string;
  glowScore: number;
  top2: { name: string; score: number }[];
  onContinue: () => void;
}) {
  return (
    <View style={styles.step1}>
      {/* Headline */}
      <View style={styles.headline}>
        <Text style={styles.headlineText}>We want you to try</Text>
        <Text style={styles.headlineAccent}>Peakd for free</Text>
      </View>

      {/* Phone mockup */}
      <View style={styles.phoneShadow}>
        <View style={styles.phone}>
          {/* Fake status bar */}
          <View style={styles.fakeStatusBar}>
            <Text style={styles.fakeTime}>9:41</Text>
            <Text style={styles.fakeIcons}>●●● ▊</Text>
          </View>

          {/* Greeting */}
          <View style={styles.phoneGreeting}>
            <View style={styles.miniAvatar}>
              <Text style={styles.miniAvatarText}>
                {userName ? userName.charAt(0).toUpperCase() : 'P'}
              </Text>
            </View>
            <Text style={styles.phoneHello}>
              Hello, {userName || 'there'}!
            </Text>
          </View>

          {/* Glow Score */}
          <Text style={styles.phoneScoreLabel}>Glow Score</Text>
          <Text style={styles.phoneScoreValue}>{glowScore.toFixed(1)}</Text>
          <Text style={styles.phoneScoreDenom}>/10</Text>

          {/* Top features */}
          <View style={styles.phoneFeatures}>
            {top2.map((f) => (
              <View key={f.name} style={styles.phoneFeatureChip}>
                <Text style={styles.phoneFeatureName}>{f.name}</Text>
                <Text style={styles.phoneFeatureScore}>
                  {f.score.toFixed(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.ctaArea}>
        <Pressable style={styles.ctaButton} onPress={onContinue}>
          <Text style={styles.ctaButtonText}>Try for free</Text>
        </Pressable>
        <Text style={styles.reassurance}>No payment due now</Text>
      </View>
    </View>
  );
}

/* ──────────────────────────── Screen 2 ──────────────────────────── */

function Step2({ onContinue }: { onContinue: () => void }) {
  return (
    <View style={styles.step2}>
      {/* Bell */}
      <View style={styles.bellWrapper}>
        <View style={styles.bellCircle}>
          <Text style={styles.bellEmoji}>🔔</Text>
        </View>
        <View style={styles.bellBadge}>
          <Text style={styles.bellBadgeText}>!</Text>
        </View>
      </View>

      <Text style={styles.step2Headline}>
        We'll send you a reminder before your free trial ends.
      </Text>

      {/* CTA */}
      <View style={styles.ctaArea}>
        <Pressable style={styles.ctaButton} onPress={onContinue}>
          <Text style={styles.ctaButtonText}>Sounds great!</Text>
        </Pressable>
        <Text style={styles.reassurance}>No payment due now</Text>
      </View>
    </View>
  );
}

/* ──────────────────────────── Screen 3 ──────────────────────────── */

const TIMELINE = [
  {
    emoji: '🔓',
    title: 'Today: Get full access',
    subtitle:
      'See all your scores, your full plan, and start improving right away.',
  },
  {
    emoji: '🔔',
    title: "Day 5: We'll remind you",
    subtitle:
      "You'll get a heads up before your trial ends so you can decide.",
  },
  {
    emoji: '⭐',
    title: 'Day 7: Full membership',
    subtitle:
      "You'll be charged if you choose to keep going. Cancel anytime.",
  },
];

function Step3({
  selectedPlan,
  onSelectPlan,
  onContinue,
}: {
  selectedPlan: 'monthly' | 'yearly';
  onSelectPlan: (p: 'monthly' | 'yearly') => void;
  onContinue: () => void;
}) {
  return (
    <View style={styles.step3}>
      <Text style={styles.step3Headline}>How your free trial works</Text>

      {/* Timeline */}
      <View style={styles.timeline}>
        {TIMELINE.map((item, i) => (
          <View key={item.title} style={[styles.timelineRow, i > 0 && { marginTop: 24 }]}>
            <View style={styles.timelineIcon}>
              <Text style={styles.timelineEmoji}>{item.emoji}</Text>
            </View>
            <View style={styles.timelineText}>
              <Text style={styles.timelineTitle}>{item.title}</Text>
              <Text style={styles.timelineSub}>{item.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Plan toggle */}
      <View style={styles.planRow}>
        {/* Monthly */}
        <Pressable
          style={[
            styles.planCard,
            selectedPlan === 'monthly' && styles.planCardSelected,
          ]}
          onPress={() => onSelectPlan('monthly')}
        >
          <Text style={styles.planLabel}>Monthly</Text>
          <View style={styles.planPriceRow}>
            <Text style={styles.planPriceBig}>$40</Text>
            <Text style={styles.planPriceUnit}>/month</Text>
          </View>
          <Text style={styles.planTrial}>7-days free trial</Text>
        </Pressable>

        {/* Yearly */}
        <Pressable
          style={[
            styles.planCard,
            selectedPlan === 'yearly' && styles.planCardSelected,
          ]}
          onPress={() => onSelectPlan('yearly')}
        >
          {selectedPlan === 'yearly' && (
            <View style={styles.checkBadge}>
              <Text style={styles.checkBadgeText}>✓</Text>
            </View>
          )}
          <Text style={styles.planLabel}>Yearly</Text>
          <View style={styles.planPriceRow}>
            <Text style={styles.planPriceBig}>$400</Text>
            <Text style={styles.planPriceUnit}>/year</Text>
          </View>
          <Text style={styles.planTrial}>7-days free trial</Text>
        </Pressable>
      </View>

      {/* CTA */}
      <View style={styles.ctaArea}>
        <Pressable style={styles.ctaButton} onPress={onContinue}>
          <Text style={styles.ctaButtonText}>Start 7-day free trial</Text>
        </Pressable>
        <Text style={styles.finePrint}>
          7-day free trial then $20/month billed yearly.
        </Text>
        <Text style={styles.finePrint2}>Cancel anytime with just a tap.</Text>
      </View>
    </View>
  );
}

/* ──────────────────────────── Styles ──────────────────────────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },

  /* Nav */
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    zIndex: 10,
  },
  navBack: {
    fontSize: 24,
    color: C.text,
  },
  navSkip: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
  },

  /* Step container */
  stepContainer: {
    flex: 1,
  },

  /* ─── Step 1 ─── */
  step1: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 32,
  },
  headline: {
    alignItems: 'center',
    marginTop: 12,
  },
  headlineText: {
    fontSize: 26,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
  },
  headlineAccent: {
    fontSize: 26,
    fontWeight: '700',
    color: C.accent,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  /* Phone mockup */
  phoneShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    shadowOpacity: 0.12,
    elevation: 12,
  },
  phone: {
    width: 260,
    aspectRatio: 0.55,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  fakeStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fakeTime: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
  },
  fakeIcons: {
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 2,
  },
  phoneGreeting: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  miniAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  phoneHello: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  phoneScoreLabel: {
    fontSize: 12,
    color: C.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  phoneScoreValue: {
    fontSize: 44,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
  },
  phoneScoreDenom: {
    fontSize: 16,
    color: C.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  phoneFeatures: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  phoneFeatureChip: {
    backgroundColor: C.iconBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  phoneFeatureName: {
    fontSize: 11,
    color: C.accent,
    fontWeight: '600',
  },
  phoneFeatureScore: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    marginTop: 2,
  },

  /* ─── Step 2 ─── */
  step2: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  bellWrapper: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellEmoji: {
    fontSize: 44,
  },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  step2Headline: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 30,
  },

  /* ─── Step 3 ─── */
  step3: {
    flex: 1,
    paddingBottom: 32,
  },
  step3Headline: {
    fontSize: 26,
    fontWeight: '800',
    color: C.text,
    marginTop: 16,
    paddingHorizontal: 24,
    lineHeight: 32,
  },

  /* Timeline */
  timeline: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.iconBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  timelineEmoji: {
    fontSize: 18,
  },
  timelineText: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  timelineSub: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 20,
    marginTop: 2,
  },

  /* Plan cards */
  planRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    paddingHorizontal: 24,
  },
  planCard: {
    flex: 1,
    backgroundColor: C.cardBackground,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    padding: 16,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: C.selectedBorder,
  },
  planLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
  },
  planPriceBig: {
    fontSize: 28,
    fontWeight: '800',
    color: C.text,
  },
  planPriceUnit: {
    fontSize: 14,
    color: C.textSecondary,
    marginLeft: 2,
  },
  planTrial: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 4,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.selectedBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Shared CTA area */
  ctaArea: {
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 'auto',
  },
  ctaButton: {
    backgroundColor: C.buttonBackground,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: C.buttonText,
    textAlign: 'center',
  },
  reassurance: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  finePrint: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  finePrint2: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});
