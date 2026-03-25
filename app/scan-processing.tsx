import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { Colors } from '@/constants/colors';
import { analyzePhoto, AnalysisResult } from '@/lib/openai';
import { consumePendingBase64, getPendingImageUri } from '@/lib/scan-data';
import { setItem, KEYS } from '@/lib/storage';

const ANALYSIS_STEPS = [
  'Detecting face shape...',
  'Reading color season...',
  'Analyzing eye type...',
  'Identifying skin tone...',
  'Building your plan...',
];

function LargeWaveform() {
  const bar1 = useSharedValue(0.4);
  const bar2 = useSharedValue(0.4);
  const bar3 = useSharedValue(0.4);

  useEffect(() => {
    const bounce = (delay: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
            withTiming(0.4, {
              duration: 400,
              easing: Easing.in(Easing.ease),
            }),
          ),
          -1,
          false,
        ),
      );

    bar1.value = bounce(0);
    bar2.value = bounce(150);
    bar3.value = bounce(300);
  }, [bar1, bar2, bar3]);

  const style1 = useAnimatedStyle(() => ({
    transform: [{ scaleY: bar1.value }],
  }));
  const style2 = useAnimatedStyle(() => ({
    transform: [{ scaleY: bar2.value }],
  }));
  const style3 = useAnimatedStyle(() => ({
    transform: [{ scaleY: bar3.value }],
  }));

  return (
    <View style={waveStyles.container}>
      <Animated.View style={[waveStyles.bar, style1]} />
      <Animated.View style={[waveStyles.bar, style2]} />
      <Animated.View style={[waveStyles.bar, style3]} />
    </View>
  );
}

export default function ScanProcessingScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (complete || error) return;
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % ANALYSIS_STEPS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [complete, error]);

  const runAnalysis = useCallback(async () => {
    setError(null);
    setComplete(false);
    setCurrentStep(0);

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
  }, []);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis, retryCount]);

  const handleRetry = () => {
    setRetryCount(c => c + 1);
  };

  const handleContinue = () => {
    router.replace('/results');
  };

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Upload a front selfie</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.centerContent}>
        {error ? (
          <ErrorCard
            message="Something went wrong. Try again."
            onRetry={handleRetry}
          />
        ) : (
          <>
            <Text style={styles.analyzingText}>
              {complete
                ? 'Analysis complete!'
                : 'Analyzing your beauty blueprint...'}
            </Text>

            {!complete && (
              <>
                <View style={styles.waveformWrapper}>
                  <LargeWaveform />
                </View>

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
              </>
            )}
          </>
        )}
      </View>

      <View style={styles.buttons}>
        <SecondaryButton label="Use Another Photo" onPress={() => router.back()} />
        <PrimaryButton
          label="Continue"
          onPress={handleContinue}
          disabled={!complete}
        />
      </View>
    </SafeScreen>
  );
}

const waveStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
  },
  bar: {
    width: 6,
    height: 40,
    borderRadius: 3,
    backgroundColor: Colors.textPrimary,
  },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  backArrow: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.textSecondary,
    lineHeight: 36,
    width: 32,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  headerSpacer: {
    width: 32,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingText: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 32,
  },
  waveformWrapper: {
    marginBottom: 32,
  },
  stepContainer: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    position: 'absolute',
  },
  errorContainer: {
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 15,
    color: Colors.error,
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
    paddingTop: 20,
    paddingBottom: 8,
  },
});
