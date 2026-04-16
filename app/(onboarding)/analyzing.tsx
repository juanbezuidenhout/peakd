import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Alert, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MAX_HEADER_HEIGHT = 340;
const MAX_CONTENT_WIDTH = 500;
import { useRouter } from 'expo-router';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  withDelay,
  interpolateColor,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { analyzeFaceWithRetry, FaceAnalysisResult } from '@/lib/anthropic';
import { consumePendingBase64, getPendingImageUri, getPendingSideImageUri, getPendingSideBase64 } from '@/lib/scan-data';
import { setItem, getItem, KEYS, setLastScanDate } from '@/lib/storage';
import { handleScanCompletion, PENDING_REFERRER_KEY } from '@/lib/referral';

const CATEGORIES = ['Eyes', 'Skin', 'Structure', 'Symmetry', 'Jawline', 'Archetype'];

const CYCLING_TEXTS = [
  'Reading your eyes...',
  'Analysing skin tone...',
  'Measuring structure...',
  'Checking symmetry...',
  'Mapping your jawline...',
  'Finding your archetype...',
];

const UNLOCK_DELAYS = [800, 3000, 5200, 7400, 9600, 11800];
const SPRING_CONFIG = { damping: 18, stiffness: 200 };

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

// ---------------------------------------------------------------------------
// Shimmer bar (cards 1–5 only, after unlock)
// ---------------------------------------------------------------------------

function ShimmerBar() {
  const translateX = useSharedValue(-100);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(100, { duration: 1200 }),
      -1,
      false,
    );
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.shimmerContainer}>
      <Animated.View style={[styles.shimmerGradient, animatedStyle]}>
        <LinearGradient
          colors={['#E8F0FE', '#B8D0F8', '#E8F0FE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Single analysis card
// ---------------------------------------------------------------------------

function AnalysisCard({
  category,
  index,
  unlocked,
  explosionScale,
}: {
  category: string;
  index: number;
  unlocked: boolean;
  explosionScale: SharedValue<number>;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (unlocked) {
      progress.value = withSpring(1, SPRING_CONFIG);
    }
  }, [unlocked, progress]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + progress.value * 0.55,
    transform: [
      { translateY: (1 - progress.value) * 6 },
      { scale: (0.97 + progress.value * 0.03) * explosionScale.value },
    ],
  }));

  const accentStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const isArchetype = index === 5;

  return (
    <Animated.View
      style={[
        styles.card,
        unlocked ? styles.cardUnlocked : styles.cardLocked,
        cardStyle,
      ]}
    >
      <Animated.View style={[styles.accentBar, accentStyle]} />
      <Text style={[styles.categoryName, unlocked && styles.categoryNameUnlocked]}>
        {category}
      </Text>
      <View style={styles.cardRight}>
        {unlocked &&
          (isArchetype ? (
            <Text style={styles.classifyingText}>Classifying...</Text>
          ) : (
            <ShimmerBar />
          ))}
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function AnalyzingScreen() {
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const [unlockedCount, setUnlockedCount] = useState(0);
  const apiResultRef = useRef<{
    analysis: FaceAnalysisResult;
    scanId: string | null;
  } | null>(null);
  const [apiDone, setApiDone] = useState(false);
  const buildUpStartedRef = useRef(false);
  const flashProgress = useSharedValue(0);
  const explosionScale = useSharedValue(1);

  // ── Header zone animations ────────────────────────────────────────────
  const scanLineY = useSharedValue(0);
  const circleRotation = useSharedValue(0);
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  const animHeaderHeight = Math.min(screenHeight * 0.42, MAX_HEADER_HEIGHT);

  useEffect(() => {
    scanLineY.value = withRepeat(
      withTiming(animHeaderHeight, { duration: 2200 }),
      -1,
      false,
    );
    circleRotation.value = withRepeat(
      withTiming(360, { duration: 4000 }),
      -1,
      false,
    );
    dot1Opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })),
      -1,
      true,
    );
    dot2Opacity.value = withDelay(
      200,
      withRepeat(
        withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })),
        -1,
        true,
      ),
    );
    dot3Opacity.value = withDelay(
      400,
      withRepeat(
        withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })),
        -1,
        true,
      ),
    );
  }, [scanLineY, circleRotation, dot1Opacity, dot2Opacity, dot3Opacity]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  const circleRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${circleRotation.value}deg` }],
  }));

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1Opacity.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2Opacity.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3Opacity.value }));

  // ── Stop scan line & dots when analysis complete ────────────────────────
  useEffect(() => {
    if (unlockedCount >= 6 && apiDone) {
      scanLineY.value = withTiming(animHeaderHeight, { duration: 300 });
      dot1Opacity.value = withTiming(0, { duration: 200 });
      dot2Opacity.value = withTiming(0, { duration: 200 });
      dot3Opacity.value = withTiming(0, { duration: 200 });
    }
  }, [unlockedCount, apiDone, scanLineY, dot1Opacity, dot2Opacity, dot3Opacity]);

  // ── Card unlock sequence (with per-card haptic) ────────────────────────
  useEffect(() => {
    const timers = UNLOCK_DELAYS.map((delay, i) =>
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setUnlockedCount(i + 1);
      }, delay),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // ── Fire API call on mount ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const preloadedBase64 = consumePendingBase64();
      const preloadedSideBase64 = getPendingSideBase64();
      try {
        let uri = getPendingImageUri();
        if (!uri) {
          const stored = await getItem<string>(KEYS.SCAN_IMAGE_URI);
          if (stored) uri = stored;
        }
        if (!uri) {
          console.error('[Analyzing] No image URI available');
          return;
        }

        const sideUri = getPendingSideImageUri();
        const response = await analyzeFaceWithRetry(uri, undefined, 2, sideUri, preloadedBase64, preloadedSideBase64);

        await setItem<FaceAnalysisResult>(KEYS.SCAN_RESULT, response.analysis);
        if (response.scanId) await setItem('scan_id', response.scanId);
        await setItem(KEYS.SCAN_IMAGE_URI, uri);
        await setLastScanDate();

        // Check for pending referral and trigger scan completion
        const pendingReferrerId = await getItem<string>(PENDING_REFERRER_KEY);
        if (pendingReferrerId) {
          // TODO: Replace local incrementReferralCount() with a Supabase RPC call once authentication is implemented in Session 18.
          await handleScanCompletion(pendingReferrerId);
          await setItem(PENDING_REFERRER_KEY, null);
        }

        apiResultRef.current = {
          analysis: response.analysis,
          scanId: response.scanId,
        };
        setApiDone(true);
      } catch (e) {
        console.error('[Analyzing] Error:', e instanceof Error ? e.message : e);
        Alert.alert(
          'Analysis Failed',
          'We could not analyse your photo. Please go back and try again.',
          [{ text: 'Go Back', onPress: () => router.back() }]
        );
      }
    })();
  }, []);

  // ── Haptic build-up + screen flash + transition ────────────────────────
  useEffect(() => {
    if (!apiDone || unlockedCount < 6 || buildUpStartedRef.current) return;
    buildUpStartedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const { Light, Medium, Heavy } = Haptics.ImpactFeedbackStyle;

    // Phase 1 — Gentle pulse
    timers.push(setTimeout(() => Haptics.impactAsync(Light), 0));
    timers.push(setTimeout(() => Haptics.impactAsync(Light), 200));
    timers.push(setTimeout(() => Haptics.impactAsync(Light), 400));
    timers.push(setTimeout(() => Haptics.impactAsync(Light), 600));

    // Phase 2 — Escalating
    timers.push(setTimeout(() => Haptics.impactAsync(Medium), 700));
    timers.push(setTimeout(() => Haptics.impactAsync(Medium), 900));
    timers.push(setTimeout(() => Haptics.impactAsync(Medium), 1100));
    timers.push(setTimeout(() => Haptics.impactAsync(Heavy), 1300));

    // Phase 3 — Rapid fire and explosion
    timers.push(setTimeout(() => Haptics.impactAsync(Heavy), 1400));
    timers.push(setTimeout(() => Haptics.impactAsync(Heavy), 1500));
    timers.push(setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      flashProgress.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 220 }),
      );
      explosionScale.value = withSequence(
        withTiming(1.025, { duration: 80 }),
        withSpring(1.0, { damping: 12, stiffness: 300 }),
      );
    }, 1600));

    timers.push(setTimeout(() => {
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        router.replace('/results');
      }
    }, 1800));

    return () => timers.forEach(clearTimeout);
  }, [apiDone, unlockedCount, flashProgress, explosionScale, router]);

  // ── Safety fallback: ensure navigation even if animations stall on iPad
  const navigatedRef = useRef(false);
  useEffect(() => {
    const fallback = setTimeout(() => {
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        router.replace('/results');
      }
    }, 120000);
    return () => clearTimeout(fallback);
  }, [router]);

  // ── Animated flash style for root container ────────────────────────────
  const flashStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      flashProgress.value,
      [0, 1],
      ['#0D1F3C', '#FFFFFF'],
    ),
  }));

  const cyclingText = unlockedCount > 0 ? CYCLING_TEXTS[unlockedCount - 1] : '';
  const headerHeight = Math.min(screenHeight * 0.42, MAX_HEADER_HEIGHT);

  return (
    <AnimatedSafeAreaView style={[styles.container, flashStyle]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* ── Zone 1: Header ─────────────────────────────────────────────── */}
          <View style={[styles.headerZone, { height: headerHeight }]}>
            <Animated.View style={[styles.scanLine, scanLineStyle]} />

            <Animated.View style={circleRotationStyle}>
              <Svg width={90} height={90}>
                <Circle
                  cx={45}
                  cy={45}
                  r={38}
                  stroke="rgba(74,144,217,0.5)"
                  strokeWidth={1.5}
                  fill="none"
                  strokeDasharray="6 4"
                />
              </Svg>
            </Animated.View>

            <View style={styles.dotsRow}>
              <Animated.View style={[styles.dot, dot1Style]} />
              <Animated.View style={[styles.dot, dot2Style]} />
              <Animated.View style={[styles.dot, dot3Style]} />
            </View>

            <View style={styles.cyclingTextContainer}>
              {unlockedCount > 0 && (
                <Animated.Text
                  key={`subtitle-${unlockedCount}`}
                  entering={FadeIn.duration(150)}
                  exiting={FadeOut.duration(150)}
                  style={styles.cyclingText}
                >
                  {cyclingText}
                </Animated.Text>
              )}
            </View>
          </View>

          {/* ── Zone 2: Cards ──────────────────────────────────────────────── */}
          <View style={styles.cardsZone}>
            {CATEGORIES.map((cat, i) => (
              <AnalysisCard
                key={cat}
                category={cat}
                index={i}
                unlocked={i < unlockedCount}
                explosionScale={explosionScale}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </AnimatedSafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1F3C',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    flex: 1,
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  headerZone: {
    backgroundColor: '#0D1F3C',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(74, 144, 217, 0.4)',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4A90D9',
  },
  cyclingTextContainer: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  cyclingText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 32,
    letterSpacing: -0.3,
    position: 'absolute',
  },
  cardsZone: {
    backgroundColor: '#F8FAFE',
    flexGrow: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
    justifyContent: 'center',
    gap: 10,
  },
  card: {
    height: 62,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.5,
    borderColor: '#E2E9F2',
    overflow: 'hidden',
  },
  cardLocked: {
    backgroundColor: 'rgba(26, 43, 74, 0.04)',
    borderColor: '#E2E9F2',
  },
  cardUnlocked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E9F2',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 3,
    backgroundColor: '#1A6FE0',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B9BB5',
  },
  categoryNameUnlocked: {
    color: '#1A2B4A',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  classifyingText: {
    fontSize: 12,
    color: '#8B9BB5',
    fontStyle: 'italic',
  },
  shimmerContainer: {
    width: 100,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#E8F0FE',
  },
  shimmerGradient: {
    width: 100,
    height: '100%',
  },
});
