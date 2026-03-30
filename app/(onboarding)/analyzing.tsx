import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { analyzeFaceWithRetry, FaceAnalysisResult } from '@/lib/anthropic';
import { getPendingImageUri, getPendingSideImageUri } from '@/lib/scan-data';
import { setItem, getItem, KEYS } from '@/lib/storage';

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
          colors={['#E8F0FE', '#C5D8FA', '#E8F0FE']}
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
}: {
  category: string;
  index: number;
  unlocked: boolean;
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
      { scale: 0.97 + progress.value * 0.03 },
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
  const [unlockedCount, setUnlockedCount] = useState(0);
  const apiResultRef = useRef<{
    analysis: FaceAnalysisResult;
    scanId: string | null;
  } | null>(null);
  const [apiDone, setApiDone] = useState(false);

  // ── Card unlock sequence ───────────────────────────────────────────────
  useEffect(() => {
    const timers = UNLOCK_DELAYS.map((delay, i) =>
      setTimeout(() => {
        // HAPTICS: see Prompt 1B
        setUnlockedCount(i + 1);
      }, delay),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // ── Fire API call on mount ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
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
        const response = await analyzeFaceWithRetry(uri, undefined, 2, sideUri);

        await setItem<FaceAnalysisResult>(KEYS.SCAN_RESULT, response.analysis);
        if (response.scanId) await setItem('scan_id', response.scanId);
        await setItem(KEYS.SCAN_IMAGE_URI, uri);

        apiResultRef.current = {
          analysis: response.analysis,
          scanId: response.scanId,
        };
        setApiDone(true);
      } catch (e) {
        console.error('[Analyzing] Error:', e instanceof Error ? e.message : e);
      }
    })();
  }, []);

  // TRANSITION: navigate to results after haptic explosion — see Prompt 1B
  // Will use: router, apiDone, apiResultRef, unlockedCount

  const cyclingText = unlockedCount > 0 ? CYCLING_TEXTS[unlockedCount - 1] : '';

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top section ─────────────────────────────────────────────────── */}
      <View style={styles.topSection}>
        <Text style={styles.label}>ANALYSING YOUR FACE</Text>
        <View style={styles.subtitleContainer}>
          {unlockedCount > 0 && (
            <Animated.Text
              key={`subtitle-${unlockedCount}`}
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(150)}
              style={styles.subtitle}
            >
              {cyclingText}
            </Animated.Text>
          )}
        </View>
      </View>

      {/* ── Card list ───────────────────────────────────────────────────── */}
      <View style={styles.cardList}>
        {CATEGORIES.map((cat, i) => (
          <AnalysisCard
            key={cat}
            category={cat}
            index={i}
            unlocked={i < unlockedCount}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  topSection: {
    alignItems: 'center',
    marginTop: 48,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    color: '#8B9BB5',
  },
  subtitleContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A2E',
    position: 'absolute',
  },
  cardList: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  card: {
    height: 58,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.5,
    borderColor: '#E2E9F2',
    overflow: 'hidden',
  },
  cardLocked: {
    backgroundColor: 'rgba(26, 115, 232, 0.04)',
  },
  cardUnlocked: {
    backgroundColor: '#FFFFFF',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 3,
    backgroundColor: '#4A90D9',
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
