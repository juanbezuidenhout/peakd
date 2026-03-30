import { useEffect, useCallback } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  G,
  Rect,
} from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const EASE_OUT = Easing.out(Easing.cubic);
const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_H = 220;
const CHART_PAD_LEFT = 32;
const CHART_PAD_RIGHT = 16;
const CHART_PAD_TOP = 16;
const CHART_PAD_BOTTOM = 28;
const CHART_W = SCREEN_WIDTH - 40;

const PLOT_W = CHART_W - CHART_PAD_LEFT - CHART_PAD_RIGHT;
const PLOT_H = CHART_H - CHART_PAD_TOP - CHART_PAD_BOTTOM;

const DEMAND_DATA = [
  { year: 2010, val: 18 },
  { year: 2012, val: 22 },
  { year: 2014, val: 28 },
  { year: 2016, val: 35 },
  { year: 2018, val: 48 },
  { year: 2020, val: 55 },
  { year: 2022, val: 82 },
];

const CONFIDENCE_DATA = [
  { year: 2010, val: 62 },
  { year: 2012, val: 58 },
  { year: 2014, val: 55 },
  { year: 2016, val: 48 },
  { year: 2018, val: 40 },
  { year: 2020, val: 34 },
  { year: 2022, val: 28 },
];

const Y_TICKS = [0, 25, 50, 75, 100];
const X_LABELS = [2010, 2014, 2018, 2022];

function toX(year: number): number {
  return CHART_PAD_LEFT + ((year - 2010) / 12) * PLOT_W;
}
function toY(val: number): number {
  return CHART_PAD_TOP + (1 - val / 100) * PLOT_H;
}

function smoothPath(
  data: { year: number; val: number }[],
): string {
  const pts = data.map((d) => ({ x: toX(d.year), y: toY(d.val) }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx1 = (prev.x + curr.x) / 2;
    const cpx2 = (prev.x + curr.x) / 2;
    d += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

function estimatePathLength(data: { year: number; val: number }[]): number {
  const pts = data.map((d) => ({ x: toX(d.year), y: toY(d.val) }));
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len * 1.3;
}

const demandPath = smoothPath(DEMAND_DATA);
const confidencePath = smoothPath(CONFIDENCE_DATA);
const demandLen = estimatePathLength(DEMAND_DATA);

const lastDemandPt = { x: toX(2022), y: toY(82) };
const lastConfPt = { x: toX(2022), y: toY(28) };
const gapMidY = (lastDemandPt.y + lastConfPt.y) / 2;

export default function PainBeautyGapScreen() {
  const router = useRouter();

  const headlineOpacity = useSharedValue(0);
  const chartOpacity = useSharedValue(0);
  const demandDashOffset = useSharedValue(demandLen);
  const confLineOpacity = useSharedValue(0);
  const legendOpacity = useSharedValue(0);
  const endpointsOpacity = useSharedValue(0);
  const gapOpacity = useSharedValue(0);
  const sourceOpacity = useSharedValue(0);
  const infoCardOpacity = useSharedValue(0);
  const infoCardTranslateY = useSharedValue(16);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    headlineOpacity.value = withDelay(200, withTiming(1, { duration: 500, easing: EASE_OUT }));
    chartOpacity.value = withDelay(400, withTiming(1, { duration: 500, easing: EASE_OUT }));

    demandDashOffset.value = withDelay(
      600,
      withTiming(0, { duration: 2000, easing: EASE_OUT }),
    );
    confLineOpacity.value = withDelay(
      800,
      withTiming(1, { duration: 2000, easing: EASE_OUT }),
    );

    legendOpacity.value = withDelay(2000, withTiming(1, { duration: 500, easing: EASE_OUT }));
    endpointsOpacity.value = withDelay(2600, withTiming(1, { duration: 500, easing: EASE_OUT }));
    gapOpacity.value = withDelay(3000, withTiming(1, { duration: 500, easing: EASE_OUT }));
    sourceOpacity.value = withDelay(3200, withTiming(1, { duration: 500, easing: EASE_OUT }));

    infoCardOpacity.value = withDelay(3400, withTiming(1, { duration: 600, easing: EASE_OUT }));
    infoCardTranslateY.value = withDelay(3400, withTiming(0, { duration: 600, easing: EASE_OUT }));
    ctaOpacity.value = withDelay(3800, withTiming(1, { duration: 600, easing: EASE_OUT }));
  }, []);

  const headlineStyle = useAnimatedStyle(() => ({ opacity: headlineOpacity.value }));
  const chartStyle = useAnimatedStyle(() => ({ opacity: chartOpacity.value }));
  const legendStyle = useAnimatedStyle(() => ({ opacity: legendOpacity.value }));
  const endpointsStyle = useAnimatedStyle(() => ({ opacity: endpointsOpacity.value }));
  const gapStyle = useAnimatedStyle(() => ({ opacity: gapOpacity.value }));
  const sourceStyle = useAnimatedStyle(() => ({ opacity: sourceOpacity.value }));
  const infoCardStyle = useAnimatedStyle(() => ({
    opacity: infoCardOpacity.value,
    transform: [{ translateY: infoCardTranslateY.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOpacity.value }));

  const demandLineProps = useAnimatedProps(() => ({
    strokeDashoffset: demandDashOffset.value,
  }));
  const confLineStyle = useAnimatedStyle(() => ({
    opacity: confLineOpacity.value,
  }));

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/pain-typewriter');
  }, [router]);

  return (
    <SafeScreen>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Headline */}
          <Animated.View style={headlineStyle}>
            <Text style={styles.headline}>
              The beauty standard isn't slowing down
            </Text>
            <Text style={styles.subheadline}>
              Demand for cosmetic procedures among women aged 19–34 has surged —
              while self-reported confidence has dropped to record lows.
            </Text>
          </Animated.View>

          {/* Chart */}
          <Animated.View style={[styles.chartWrap, chartStyle]}>
            <Svg width={CHART_W} height={CHART_H}>
              {/* Grid lines + Y labels */}
              {Y_TICKS.map((tick) => {
                const y = toY(tick);
                return (
                  <G key={`y-${tick}`}>
                    <Line
                      x1={CHART_PAD_LEFT}
                      y1={y}
                      x2={CHART_W - CHART_PAD_RIGHT}
                      y2={y}
                      stroke={Colors.border}
                      strokeWidth={1}
                    />
                    <SvgText
                      x={CHART_PAD_LEFT - 8}
                      y={y + 3}
                      fill="#444444"
                      fontSize={10}
                      textAnchor="end"
                    >
                      {tick}
                    </SvgText>
                  </G>
                );
              })}

              {/* X labels */}
              {X_LABELS.map((year) => (
                <SvgText
                  key={`x-${year}`}
                  x={toX(year)}
                  y={CHART_H - 6}
                  fill="#666666"
                  fontSize={11}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {year}
                </SvgText>
              ))}

              {/* Demand line (cyan, solid) */}
              <AnimatedPath
                d={demandPath}
                stroke="#22D3EE"
                strokeWidth={2.5}
                fill="none"
                strokeDasharray={`${demandLen}, ${demandLen}`}
                animatedProps={demandLineProps}
              />

            </Svg>

            {/* Confidence line (white dashed) — fades in */}
            <Animated.View style={[StyleSheet.absoluteFill, confLineStyle]} pointerEvents="none">
              <Svg width={CHART_W} height={CHART_H}>
                <Path
                  d={confidencePath}
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth={2}
                  fill="none"
                  strokeDasharray="6, 4"
                />
              </Svg>
            </Animated.View>

            {/* Endpoint overlays — positioned absolutely over the SVG */}
            <Animated.View style={[StyleSheet.absoluteFill, endpointsStyle]} pointerEvents="none">
              <Svg width={CHART_W} height={CHART_H}>
                {/* Demand glow */}
                <Circle
                  cx={lastDemandPt.x}
                  cy={lastDemandPt.y}
                  r={12}
                  fill="rgba(34,211,238,0.2)"
                />
                <Circle
                  cx={lastDemandPt.x}
                  cy={lastDemandPt.y}
                  r={6}
                  fill="#22D3EE"
                />
                <SvgText
                  x={lastDemandPt.x - 8}
                  y={lastDemandPt.y - 14}
                  fill="#22D3EE"
                  fontSize={13}
                  fontWeight="800"
                  textAnchor="end"
                >
                  +357%
                </SvgText>

                {/* Confidence dot */}
                <Circle
                  cx={lastConfPt.x}
                  cy={lastConfPt.y}
                  r={5}
                  fill="#888888"
                />
                <SvgText
                  x={lastConfPt.x - 8}
                  y={lastConfPt.y + 18}
                  fill="#888888"
                  fontSize={13}
                  fontWeight="700"
                  textAnchor="end"
                >
                  -55%
                </SvgText>
              </Svg>
            </Animated.View>

            {/* Gap vertical line + label */}
            <Animated.View style={[StyleSheet.absoluteFill, gapStyle]} pointerEvents="none">
              <Svg width={CHART_W} height={CHART_H}>
                <Line
                  x1={lastDemandPt.x}
                  y1={lastDemandPt.y}
                  x2={lastConfPt.x}
                  y2={lastConfPt.y}
                  stroke="#444444"
                  strokeWidth={1}
                  strokeDasharray="3, 3"
                />
                <Rect
                  x={lastDemandPt.x - 44}
                  y={gapMidY - 9}
                  width={56}
                  height={18}
                  fill={Colors.background}
                  rx={4}
                />
                <SvgText
                  x={lastDemandPt.x - 16}
                  y={gapMidY + 4}
                  fill="#666666"
                  fontSize={10}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  The Gap
                </SvgText>
              </Svg>
            </Animated.View>
          </Animated.View>

          {/* Legend */}
          <Animated.View style={[styles.legendRow, legendStyle]}>
            <View style={styles.legendItem}>
              <View style={styles.legendDotCyan} />
              <Text style={styles.legendText}>Cosmetic procedure demand</Text>
            </View>
            <View style={{ width: 20 }} />
            <View style={styles.legendItem}>
              <View style={styles.legendDash}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.legendDashSeg} />
                ))}
              </View>
              <Text style={styles.legendText}>Self-reported confidence</Text>
            </View>
          </Animated.View>

          {/* Source */}
          <Animated.View style={sourceStyle}>
            <Text style={styles.sourceText}>
              Source: American Society of Plastic Surgeons, 2023
            </Text>
            <Text style={styles.sourceTextBold}>
              Real Self / Dove Global Beauty Confidence Report
            </Text>
          </Animated.View>

          {/* Info Card */}
          <Animated.View style={[styles.infoCard, infoCardStyle]}>
            <Text style={styles.infoTitle}>The Gap Is Growing</Text>
            <Text style={styles.infoBody}>
              Every year, the standard rises and confidence drops. Filters,
              editing, and social media have created a beauty arms race — and
              most women are falling behind without even knowing it. Peakd
              closes the gap by showing you exactly what to optimise.
            </Text>
          </Animated.View>
        </ScrollView>

        {/* CTA */}
        <Animated.View style={ctaStyle}>
          <Pressable style={styles.ctaButton} onPress={handleNext}>
            <Text style={styles.ctaLabel}>Next</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { marginTop: 8, alignSelf: 'flex-start' },
  backChevron: { fontSize: 32, color: Colors.textSecondary },

  scrollArea: { flex: 1, marginTop: 8 },
  scrollContent: { paddingBottom: 8 },

  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  subheadline: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },

  chartWrap: {
    marginTop: 28,
    alignSelf: 'center',
    width: CHART_W,
    height: CHART_H,
  },

  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotCyan: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22D3EE',
  },
  legendDash: {
    flexDirection: 'row',
    width: 16,
    justifyContent: 'space-between',
  },
  legendDashSeg: {
    width: 4,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 1,
  },
  legendText: {
    fontSize: 11,
    color: '#888888',
  },

  sourceText: {
    fontSize: 11,
    color: '#555555',
    textAlign: 'center',
    marginTop: 16,
  },
  sourceTextBold: {
    fontSize: 11,
    color: '#555555',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },

  infoCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  infoBody: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: 8,
  },

  ctaButton: {
    width: '100%',
    height: 56,
    backgroundColor: Colors.navy,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  ctaLabel: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
