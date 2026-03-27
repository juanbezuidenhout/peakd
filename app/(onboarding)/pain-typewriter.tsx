import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';

const SENTENCES = [
  'Nobody talks about it, but you already feel it.',
  'The way people treat you, the opportunities you get, the attention you receive it all starts with how you look.',
  'And in the age of filters and FaceTune, the standard has never been higher.',
  "But for the first time, AI can show you exactly what's holding you back and exactly how to fix it.",
  'No guessing. No generic advice. A protocol built for your face.',
  'But first, we need to learn a little about you...',
];

const TYPING_SPEED_MS = 35;

export default function PainTypewriterScreen() {
  const router = useRouter();
  const [displayedText, setDisplayedText] = useState('');
  const opacity = useSharedValue(1);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charIndexRef = useRef(0);
  const mountedRef = useRef(true);

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  function clearTimers() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function playSentence(index: number) {
    if (!mountedRef.current) return;

    const sentence = SENTENCES[index];
    const isLast = index === SENTENCES.length - 1;
    const holdMs = isLast ? 2000 : 1500;
    const fadeMs = isLast ? 800 : 600;
    const pauseMs = isLast ? 500 : 400;

    charIndexRef.current = 0;
    setDisplayedText('');
    opacity.value = 1;

    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) {
        clearTimers();
        return;
      }

      const ci = charIndexRef.current;
      if (ci >= sentence.length) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;

        timeoutRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          opacity.value = withTiming(0, { duration: fadeMs });

          timeoutRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            if (isLast) {
              router.push('/(onboarding)/quiz-name');
            } else {
              playSentence(index + 1);
            }
          }, fadeMs + pauseMs);
        }, holdMs);

        return;
      }

      const char = sentence[ci];
      charIndexRef.current = ci + 1;
      setDisplayedText(sentence.slice(0, ci + 1));

      if (char !== ' ') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, TYPING_SPEED_MS);
  }

  useEffect(() => {
    mountedRef.current = true;
    playSentence(0);

    return () => {
      mountedRef.current = false;
      clearTimers();
    };
  }, []);

  return (
    <SafeScreen>
      <View style={styles.container}>
        <View style={{ flex: 9 }} />
        <View style={styles.textArea}>
          <Animated.Text style={[styles.text, animatedTextStyle]}>
            {displayedText}
          </Animated.Text>
        </View>
        <View style={{ flex: 11 }} />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: -20,
  },
  textArea: {
    paddingHorizontal: 40,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 34,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
