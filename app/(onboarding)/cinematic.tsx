import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';

const LINES = [
  'In a world of filters and impossible standards...',
  '...knowing you could look better but not knowing where to start',
  'feels like being stuck behind a wall of noise.',
  'But aesthetic science and AI have changed everything.',
  'This is why we analyse your face — to know where you stand and build you a protocol to reach your full potential.',
  'But first, we need to learn a little bit about you...',
];

const LINE_DELAY = 2200;
const LAST_LINE_HOLD = 1800;

export default function CinematicScreen() {
  const router = useRouter();
  const [visibleLines, setVisibleLines] = useState<number[]>([0]);
  const [showDivider, setShowDivider] = useState(false);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    for (let i = 1; i < LINES.length; i++) {
      const isLastRegularLine = i === LINES.length - 2;
      const isLastLine = i === LINES.length - 1;

      if (isLastLine) {
        // Show divider before last line
        const dividerTimeout = setTimeout(() => {
          setShowDivider(true);
        }, LINE_DELAY * (i - 1) + LINE_DELAY);
        timeouts.current.push(dividerTimeout);

        // Show last line after divider
        const lastLineTimeout = setTimeout(() => {
          setVisibleLines((prev) => [...prev, i]);
        }, LINE_DELAY * (i - 1) + LINE_DELAY + 400);
        timeouts.current.push(lastLineTimeout);
      } else {
        const t = setTimeout(() => {
          setVisibleLines((prev) => [...prev, i]);
        }, LINE_DELAY * i);
        timeouts.current.push(t);
      }
    }

    const navTimeout = setTimeout(() => {
      router.replace('/(onboarding)/quiz-name');
    }, LINE_DELAY * (LINES.length - 1) + 400 + LAST_LINE_HOLD);
    timeouts.current.push(navTimeout);

    return () => {
      timeouts.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <View style={styles.content}>
        {visibleLines.map((lineIndex) =>
          lineIndex === LINES.length - 1 ? (
            <Animated.Text
              key={lineIndex}
              entering={FadeInUp.duration(600)}
              style={styles.lastLine}
            >
              {LINES[lineIndex]}
            </Animated.Text>
          ) : (
            <Animated.Text
              key={lineIndex}
              entering={FadeInUp.duration(600)}
              style={styles.line}
            >
              {LINES[lineIndex]}
            </Animated.Text>
          ),
        )}
        {showDivider && (
          <Animated.View entering={FadeIn.duration(600)} style={styles.divider} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 32,
  },
  line: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 34,
    marginBottom: 18,
  },
  lastLine: {
    fontSize: 20,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 28,
    marginTop: 8,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: Colors.primary,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
});
