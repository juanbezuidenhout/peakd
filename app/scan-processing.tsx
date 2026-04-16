import { useEffect, useState, useCallback, useRef } from 'react';
import { Alert, StyleSheet, Text, View, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { Colors } from '@/constants/colors';
import { analyzeFaceWithRetry, FaceAnalysisResult, ProgressStage } from '@/lib/anthropic';
import { getPendingImageUri, getPendingSideImageUri } from '@/lib/scan-data';
import { setItem, getItem, KEYS, getUserName, setLastScanDate } from '@/lib/storage';
import { handleScanCompletion, PENDING_REFERRER_KEY } from '@/lib/referral';

const ANALYSIS_STEPS = [
  'Mapping facial geometry...',
  'Analyzing skin quality...',
  'Evaluating facial harmony...',
  'Scoring features...',
  'Building your protocol...',
];

const MOTIVATIONAL_MESSAGES = [
  '{name}, you didn\'t choose your starting point.',
  'But you chose to be here.',
  'Now it\'s time to glow up.',
  'Your beauty blueprint is being built...',
  'Your plan is ready.',
];

function getMessage(percent: number, name: string): string {
  const msg =
    percent >= 100
      ? MOTIVATIONAL_MESSAGES[4]
      : percent >= 80
        ? MOTIVATIONAL_MESSAGES[3]
        : percent >= 50
          ? MOTIVATIONAL_MESSAGES[2]
          : percent >= 20
            ? MOTIVATIONAL_MESSAGES[1]
            : MOTIVATIONAL_MESSAGES[0];
  return msg.replace('{name}', name);
}

export default function ScanProcessingScreen() {
  const router = useRouter();
  const { imageUri: paramImageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [userName, setUserName] = useState('You');

  const barWidth = useSharedValue(0);
  const progressRef = useRef(0);
  const completeRef = useRef(false);

  useEffect(() => {
    getUserName().then(n => {
      if (n) setUserName(n);
    });
  }, []);

  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      if (completeRef.current) {
        clearInterval(interval);
        return;
      }
      const next = Math.min(progressRef.current + Math.random() * 2.5 + 0.5, 95);
      progressRef.current = next;
      setProgressPercent(next);
      barWidth.value = withTiming(next, { duration: 150 });
    }, 100);
    return () => clearInterval(interval);
  }, [error, retryCount, barWidth]);

  useEffect(() => {
    if (complete || error) return;
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % ANALYSIS_STEPS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [complete, error]);

  const navigatedRef = useRef(false);

  useEffect(() => {
    if (complete) {
      completeRef.current = true;
      progressRef.current = 100;
      setProgressPercent(100);
      barWidth.value = withTiming(100, { duration: 400 });
      const timeout = setTimeout(() => {
        if (!navigatedRef.current) {
          navigatedRef.current = true;
          router.replace('/results');
        }
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [complete, router, barWidth]);

  // Safety fallback: ensure navigation even if animations stall on iPad
  useEffect(() => {
    const fallback = setTimeout(() => {
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        router.replace('/results');
      }
    }, 120000);
    return () => clearTimeout(fallback);
  }, [router]);

  const runAnalysis = useCallback(async () => {
    setError(null);
    setComplete(false);
    setCurrentStep(0);
    progressRef.current = 0;
    completeRef.current = false;
    setProgressPercent(0);
    barWidth.value = 0;

    try {
      // Try multiple sources for the image URI
      let uri = getPendingImageUri();
      if (!uri && paramImageUri) {
        uri = paramImageUri;
      }
      if (!uri) {
        const stored = await getItem<string>(KEYS.SCAN_IMAGE_URI);
        if (stored) uri = stored;
      }
      if (!uri) {
        setError('No image data available. Please go back and try again.');
        return;
      }

      const sideUri = getPendingSideImageUri();

      const response = await analyzeFaceWithRetry(
        uri,
        (stage: ProgressStage) => {
          const stagePercent: Record<ProgressStage, number> = {
            preparing: 10,
            uploading: 30,
            analyzing: 55,
            scoring: 80,
            finalizing: 90,
            complete: 100,
          };
          const target = stagePercent[stage] ?? progressRef.current;
          progressRef.current = target;
          setProgressPercent(target);
          barWidth.value = withTiming(target, { duration: 300 });
        },
        2,
        sideUri,
      );

      // Save results
      await setItem<FaceAnalysisResult>(KEYS.SCAN_RESULT, response.analysis);
      if (response.scanId) await setItem('scan_id', response.scanId);
      if (uri) await setItem(KEYS.SCAN_IMAGE_URI, uri);

      // Record scan date for 7-day cooldown
      await setLastScanDate();

      // Check for pending referral and trigger scan completion
      const pendingReferrerId = await getItem<string>(PENDING_REFERRER_KEY);
      if (pendingReferrerId) {
        // TODO: Replace local incrementReferralCount() with a Supabase RPC call once authentication is implemented in Session 18.
        await handleScanCompletion(pendingReferrerId);
        await setItem(PENDING_REFERRER_KEY, null);
      }

      setComplete(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Analysis failed';
      console.error('[ScanProcessing] Error:', msg);
      Alert.alert('Error', msg);
      setError(msg);
    }
  }, [barWidth, paramImageUri]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis, retryCount]);

  const handleRetry = () => {
    setRetryCount(c => c + 1);
  };

  const currentMessage = getMessage(progressPercent, userName);

  const barAnimatedStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  if (error) {
    return (
      <View style={styles.root}>
        <StatusBar hidden />
        <View style={styles.center}>
          <ErrorCard
            message={error}
            onRetry={handleRetry}
          />
          <View style={styles.errorButton}>
            <SecondaryButton label="Use Another Photo" onPress={() => router.back()} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <View style={styles.content}>
        <Animated.Text
          key={currentMessage}
          entering={FadeIn.duration(500)}
          exiting={FadeOut.duration(300)}
          style={styles.motivationalText}
        >
          {currentMessage}
        </Animated.Text>

        <View style={styles.barContainer}>
          <Animated.View style={[styles.barFill, barAnimatedStyle]} />
        </View>

        <Text style={styles.percentText}>
          {Math.round(progressPercent)}%
        </Text>

        <View style={styles.stepContainer}>
          <Animated.Text
            key={currentStep}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            style={styles.stepText}
          >
            {ANALYSIS_STEPS[currentStep]}
          </Animated.Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  motivationalText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 48,
  },
  barContainer: {
    width: 200,
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  percentText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  stepContainer: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  stepText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    position: 'absolute',
  },
  errorButton: {
    marginTop: 16,
    width: '100%',
  },
});
