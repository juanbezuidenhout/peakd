import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Share } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { ScreenLoader } from '@/components/ui/WaveformLoader';
import { Colors } from '@/constants/colors';
import { getItem, KEYS } from '@/lib/storage';
import { FaceAnalysisResult } from '@/lib/anthropic';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 180;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const LOCKED_CATEGORIES = [
  { label: 'Face Shape', icon: '💎' },
  { label: 'Eye Type', icon: '👁️' },
  { label: 'Color Season', icon: '🎨' },
  { label: 'Skin Tone', icon: '✨' },
  { label: 'Top Feature', icon: '⭐' },
  { label: 'Archetype', icon: '👑' },
];

function AnimatedScore({ target }: { target: number }) {
  const progress = useSharedValue(0);
  const [displayScore, setDisplayScore] = useState(0);

  const updateDisplay = (val: number) => {
    setDisplayScore(Math.round(val));
  };

  useDerivedValue(() => {
    runOnJS(updateDisplay)(progress.value);
  });

  useEffect(() => {
    progress.value = withDelay(
      400,
      withTiming(target, { duration: 1500, easing: Easing.out(Easing.cubic) }),
    );
  }, [target, progress]);

  return (
    <View style={scoreStyles.container}>
      <Text style={scoreStyles.number}>{displayScore}</Text>
      <Text style={scoreStyles.denominator}>/100</Text>
    </View>
  );
}

function ScoreRing({ score }: { score: number }) {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withDelay(
      400,
      withTiming(score / 100, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [score, animatedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - animatedProgress.value),
  }));

  return (
    <View style={scoreStyles.ringWrapper}>
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
      <View style={scoreStyles.scoreOverlay}>
        <AnimatedScore target={score} />
      </View>
    </View>
  );
}

function LockedCard({ label, icon }: { label: string; icon: string }) {
  return (
    <View style={gridStyles.card}>
      <Text style={gridStyles.cardLabel}>{label}</Text>
      <View style={gridStyles.blurredValue}>
        <Text style={gridStyles.blurredText}>██████</Text>
      </View>
      <View style={gridStyles.progressTrack}>
        <View style={gridStyles.progressFill} />
      </View>
      <View style={gridStyles.lockOverlay}>
        <Text style={gridStyles.lockIcon}>🔒</Text>
      </View>
    </View>
  );
}

export default function ResultsScreen() {
  const router = useRouter();
  const [result, setResult] = useState<FaceAnalysisResult | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const scanResult = await getItem<FaceAnalysisResult>(KEYS.SCAN_RESULT);
      const uri = await getItem<string>(KEYS.SCAN_IMAGE_URI);
      if (scanResult) setResult(scanResult);
      if (uri) setImageUri(uri);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <SafeScreen>
        <ScreenLoader />
      </SafeScreen>
    );
  }

  const glowScoreRaw = result?.glowScore ?? 7.4;
  const displayScore = Math.round(glowScoreRaw * 10);
  const archetypeName = result?.archetype?.name ?? 'Ethereal Doe';
  const archetypeDesc =
    result?.archetype?.description ??
    'A soft, luminous beauty with expressive doe eyes and an ethereal glow.';

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          'I just discovered my beauty archetype with Peakd! Try it yourself ✨',
      });
    } catch {
      // share cancelled
    }
  };

  return (
    <SafeScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Photo + Archetype */}
        <Animated.View
          entering={FadeInUp.duration(500)}
          style={styles.heroSection}
        >
          <View style={styles.photoRing}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={styles.photoPlaceholderIcon}>👤</Text>
              </View>
            )}
          </View>
          <Text style={styles.archetype}>{archetypeName}</Text>
          <Text style={styles.archetypeDesc}>{archetypeDesc}</Text>
        </Animated.View>

        {/* Score Section */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.scoreSection}
        >
          <Text style={styles.scoreLabel}>GLOW SCORE</Text>
          <ScoreRing score={displayScore} />
          <Text style={styles.potentialText}>
            {glowScoreRaw.toFixed(1)} / 10.0
          </Text>
        </Animated.View>

        {/* Locked Grid */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          style={styles.lockedSection}
        >
          <Text style={styles.sectionTitle}>Your Beauty Breakdown</Text>
          <View style={gridStyles.grid}>
            {LOCKED_CATEGORIES.map((cat) => (
              <LockedCard key={cat.label} label={cat.label} icon={cat.icon} />
            ))}
          </View>
        </Animated.View>

        {/* Bottom CTA */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(500)}
          style={styles.ctaSection}
        >
          <PrimaryButton
            label="Unlock My Full Plan ✨"
            onPress={() => router.push('/paywall')}
          />
          <View style={styles.secondaryButtonWrap}>
            <SecondaryButton
              label="Invite 3 Friends to Unlock"
              onPress={handleShare}
            />
          </View>
          <Text style={styles.socialProof}>
            Join 500,000+ women who found their glow
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeScreen>
  );
}

const scoreStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  number: {
    fontSize: 72,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 78,
  },
  denominator: {
    fontSize: 24,
    color: Colors.textSecondary,
    marginBottom: 10,
    marginLeft: 2,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const gridStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  card: {
    width: '47%' as any,
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  blurredValue: {
    marginBottom: 10,
  },
  blurredText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMuted,
    opacity: 0.3,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  progressFill: {
    width: '60%',
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    opacity: 0.3,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  lockIcon: {
    fontSize: 24,
  },
});

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  photoRing: {
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 3,
    borderColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 40,
  },
  archetype: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  archetypeDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  scoreSection: {
    alignItems: 'center',
    marginTop: 32,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  potentialText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.accent,
    marginTop: 16,
  },
  lockedSection: {
    marginTop: 36,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ctaSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  secondaryButtonWrap: {
    width: '100%',
    marginTop: 12,
  },
  socialProof: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});
