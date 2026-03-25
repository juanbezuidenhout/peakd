import { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
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
import { analyzePhoto, AnalysisResult } from '@/lib/openai';
import { consumePendingBase64, getPendingImageUri } from '@/lib/scan-data';
import { setItem, KEYS, getUserName } from '@/lib/storage';

const ANALYSIS_STEPS = [
  'Detecting face shape...',
  'Reading color season...',
  'Analyzing eye type...',
  'Identifying skin tone...',
  'Building your plan...',
];

const MOTIVATIONAL_MESSAGES = [
  '{name}, you didn\'t choose your starting point.',
  'But you chose to be here.',
  'Now it\'s time to glow up.',
  'Your beauty blueprint is being built...',
  'Your plan is ready. ✨',
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
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
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

  useEffect(() => {
    if (complete) {
      completeRef.current = true;
      progressRef.current = 100;
      setProgressPercent(100);
      barWidth.value = withTiming(100, { duration: 400 });
      const timeout = setTimeout(() => {
        router.replace('/results');
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [complete, router, barWidth]);

  const runAnalysis = useCallback(async () => {
    setError(null);
    setComplete(false);
    setCurrentStep(0);
    progressRef.current = 0;
    completeRef.current = false;
    setProgressPercent(0);
    barWidth.value = 0;

    try {
      const base64 = consumePendingBase64();
      if (!base64) {
        setError('No image data available. Please go back and try again.');
        return;
      }

      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        setError('API key not configured.');
        return;
      }

      const result = await analyzePhoto(base64, apiKey);

      const uri = getPendingImageUri();
      await setItem<AnalysisResult>(KEYS.SCAN_RESULT, result);
      if (uri) await setItem(KEYS.SCAN_IMAGE_URI, uri);
      setComplete(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    }
  }, [barWidth]);

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
            message="Something went wrong. Try again."
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
    backgroundColor: '#000000',
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
