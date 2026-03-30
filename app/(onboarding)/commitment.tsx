import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { getUserName } from '@/lib/storage';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const Y_LABEL_WIDTH = 40;
const CHART_H = 100;
const CHART_TOP = 20;

function buildWithPeakdPath(w: number) {
  const x0 = 0;
  const y0 = CHART_TOP + CHART_H;
  const x3 = w;
  const y3 = CHART_TOP + 10;
  const cp1x = w * 0.25;
  const cp1y = CHART_TOP + CHART_H * 0.55;
  const cp2x = w * 0.55;
  const cp2y = CHART_TOP + 5;
  return `M${x0},${y0} C${cp1x},${cp1y} ${cp2x},${cp2y} ${x3},${y3}`;
}

function buildWithoutPath(w: number) {
  return `M0,${CHART_TOP + 90} L${w},${CHART_TOP + 80}`;
}

function approximatePathLength(d: string): number {
  if (d.startsWith('M') && d.includes('C')) return 320;
  return 200;
}

export default function CommitmentScreen() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    getUserName().then(setName);
  }, []);

  const withPeakdOffset = useSharedValue(1);
  const withoutOffset = useSharedValue(1);
  const animStarted = useRef(false);

  const startAnimations = useCallback(() => {
    if (animStarted.current) return;
    animStarted.current = true;
    withPeakdOffset.value = withTiming(0, {
      duration: 1200,
      easing: Easing.out(Easing.ease),
    });
    withoutOffset.value = withDelay(
      400,
      withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
    );
  }, [withPeakdOffset, withoutOffset]);

  const onChartLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width - Y_LABEL_WIDTH;
      if (w > 0) {
        setChartWidth(w);
        startAnimations();
      }
    },
    [startAnimations],
  );

  const innerW = chartWidth;
  const withD = innerW > 0 ? buildWithPeakdPath(innerW) : '';
  const withoutD = innerW > 0 ? buildWithoutPath(innerW) : '';
  const withLen = approximatePathLength(withD);
  const withoutLen = approximatePathLength(withoutD);

  const withProps = useAnimatedProps(() => ({
    strokeDashoffset: withPeakdOffset.value * withLen,
  }));
  const withoutProps = useAnimatedProps(() => ({
    strokeDashoffset: withoutOffset.value * withoutLen,
  }));

  const subtext = name
    ? `${name}, Peakd isn't for everyone. It's for the women who are actually serious about their glow-up and willing to put in the work. If that's not you, close the app.`
    : `Peakd isn't for everyone. It's for the women who are actually serious about their glow-up and willing to put in the work. If that's not you, close the app.`;

  return (
    <SafeScreen>
      <View style={styles.backRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar current={8} total={8} />
      </View>

      <Text style={styles.stepLabel}>FINAL STEP</Text>
      <Text style={styles.headline}>One last thing.</Text>
      <Text style={styles.subtext}>{subtext}</Text>

      <View style={styles.chartCard} onLayout={onChartLayout}>
        <Text style={styles.chartTitle}>90-day glow-up trajectory</Text>

        {innerW > 0 && (
          <Svg width="100%" height={140}>
            {/* Y-axis label */}
            <SvgText
              x={10}
              y={CHART_TOP + CHART_H / 2}
              fill={Colors.textSecondary}
              fontSize={10}
              textAnchor="middle"
              rotation={-90}
              originX={10}
              originY={CHART_TOP + CHART_H / 2}
            >
              Attractiveness
            </SvgText>

            {/* Grid baseline */}
            <Line
              x1={Y_LABEL_WIDTH}
              y1={CHART_TOP + CHART_H}
              x2={Y_LABEL_WIDTH + innerW}
              y2={CHART_TOP + CHART_H}
              stroke={Colors.border}
              strokeWidth={0.5}
            />

            {/* "With Peakd" curve */}
            <AnimatedPath
              d={withD}
              translateX={Y_LABEL_WIDTH}
              stroke={Colors.primary}
              strokeWidth={2.5}
              fill="none"
              strokeDasharray={withLen}
              animatedProps={withProps}
              strokeLinecap="round"
            />

            {/* "Without Peakd" line */}
            <AnimatedPath
              d={withoutD}
              translateX={Y_LABEL_WIDTH}
              stroke={Colors.textMuted}
              strokeWidth={2}
              fill="none"
              strokeDasharray={`${withoutLen}, 6, 4`}
              animatedProps={withoutProps}
            />

            {/* X-axis labels */}
            <SvgText
              x={Y_LABEL_WIDTH}
              y={CHART_TOP + CHART_H + 16}
              fill={Colors.textSecondary}
              fontSize={10}
              textAnchor="start"
            >
              Day 1
            </SvgText>
            <SvgText
              x={Y_LABEL_WIDTH + innerW}
              y={CHART_TOP + CHART_H + 16}
              fill={Colors.textSecondary}
              fontSize={10}
              textAnchor="end"
            >
              Day 90
            </SvgText>
          </Svg>
        )}

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={styles.legendDotPurple} />
            <Text style={styles.legendTextPrimary}>With Peakd</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendDashGrey} />
            <Text style={styles.legendTextMuted}>Without</Text>
          </View>
        </View>

        <Text style={styles.caption}>
          Peakd users see 3–5× faster results than generic advice alone.
        </Text>
      </View>

      <View style={styles.spacer} />

      <View style={styles.bottom}>
        <PrimaryButton
          label="I'm serious. Let's Peak. →"
          onPress={() => router.push('/(onboarding)/experts')}
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  backChevron: {
    fontSize: 28,
    color: Colors.textSecondary,
  },
  progressWrap: {
    paddingTop: 20,
    marginBottom: 32,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headline: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 32,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 32,
  },
  chartTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotPurple: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  legendDashGrey: {
    width: 20,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.textMuted,
  },
  legendTextPrimary: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  legendTextMuted: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
  bottom: {
    paddingBottom: 24,
    gap: 12,
  },
});
