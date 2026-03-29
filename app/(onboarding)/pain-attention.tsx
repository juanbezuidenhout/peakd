import { useEffect, useCallback } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
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
import Svg, { Circle, G, Line, Path, Polygon } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const EASE_OUT = Easing.out(Easing.cubic);

const SVG_WIDTH = SCREEN_WIDTH - 40;
const VIZ_HEIGHT = SCREEN_HEIGHT * 0.52;
const LEFT_X = SVG_WIDTH * 0.12;
const RIGHT_X = SVG_WIDTH * 0.88;
const VERT_PAD = 16;
const ICON_SPACING = (VIZ_HEIGHT - 2 * VERT_PAD) / 9;

const getIconY = (index: number) => VERT_PAD + index * ICON_SPACING;

const LINE_X_OFFSET = 12;

const CONNECTIONS = [
  { man: 0, woman: 0, delay: 400 },
  { man: 1, woman: 0, delay: 600 },
  { man: 2, woman: 1, delay: 800 },
  { man: 3, woman: 0, delay: 1000 },
  { man: 4, woman: 1, delay: 1200 },
  { man: 5, woman: 1, delay: 1400 },
  { man: 6, woman: 2, delay: 1600 },
  { man: 7, woman: 0, delay: 1800 },
  { man: 8, woman: 2, delay: 2000 },
  { man: 9, woman: 1, delay: 2200 },
];

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

function MaleIcon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy - 5} r={6} fill="#22D3EE" opacity={0.9} />
      <Path
        d={`M ${cx - 7} ${cy + 3} L ${cx - 6} ${cy + 15} L ${cx + 6} ${cy + 15} L ${cx + 7} ${cy + 3} Z`}
        fill="#22D3EE"
        opacity={0.9}
      />
    </G>
  );
}

function FemaleIcon({
  cx,
  cy,
  color,
  opacity = 1,
  glow = false,
}: {
  cx: number;
  cy: number;
  color: string;
  opacity?: number;
  glow?: boolean;
}) {
  return (
    <G>
      {glow && (
        <Circle cx={cx} cy={cy + 2} r={20} fill={color} opacity={0.15} />
      )}
      <Circle cx={cx} cy={cy - 5} r={6} fill={color} opacity={opacity} />
      <Path
        d={`M ${cx - 5} ${cy + 3} L ${cx - 7} ${cy + 15} L ${cx + 7} ${cy + 15} L ${cx + 5} ${cy + 3} Z`}
        fill={color}
        opacity={opacity}
      />
    </G>
  );
}

function ConnectionLineSvg({
  x1,
  y1,
  x2,
  y2,
  delay,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  const dashOffset = useSharedValue(length);
  const arrowOpacity = useSharedValue(0);

  useEffect(() => {
    dashOffset.value = withDelay(
      delay,
      withTiming(0, { duration: 600, easing: EASE_OUT }),
    );
    arrowOpacity.value = withDelay(
      delay + 550,
      withTiming(0.7, { duration: 200, easing: EASE_OUT }),
    );
  }, []);

  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const arrowAnimProps = useAnimatedProps(() => ({
    opacity: arrowOpacity.value,
  }));

  const angle = Math.atan2(dy, dx);
  const arrowSize = 6;
  const w1x = x2 - arrowSize * Math.cos(angle - Math.PI / 6);
  const w1y = y2 - arrowSize * Math.sin(angle - Math.PI / 6);
  const w2x = x2 - arrowSize * Math.cos(angle + Math.PI / 6);
  const w2y = y2 - arrowSize * Math.sin(angle + Math.PI / 6);

  return (
    <G>
      <AnimatedLine
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#666666"
        strokeOpacity={0.5}
        strokeWidth={1.2}
        strokeDasharray={`${length} ${length}`}
        animatedProps={lineProps}
      />
      <AnimatedPolygon
        points={`${x2},${y2} ${w1x},${w1y} ${w2x},${w2y}`}
        fill="#666666"
        animatedProps={arrowAnimProps}
      />
    </G>
  );
}

export default function PainAttentionScreen() {
  const router = useRouter();

  const vizOpacity = useSharedValue(0);
  const labelOpacity = useSharedValue(0);
  const infoCardOpacity = useSharedValue(0);
  const infoCardTranslateY = useSharedValue(16);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    vizOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 400, easing: EASE_OUT }),
    );
    labelOpacity.value = withDelay(
      2800,
      withTiming(1, { duration: 500, easing: EASE_OUT }),
    );
    infoCardOpacity.value = withDelay(
      3200,
      withTiming(1, { duration: 600, easing: EASE_OUT }),
    );
    infoCardTranslateY.value = withDelay(
      3200,
      withTiming(0, { duration: 600, easing: EASE_OUT }),
    );
    ctaOpacity.value = withDelay(
      3600,
      withTiming(1, { duration: 600, easing: EASE_OUT }),
    );
  }, []);

  const vizStyle = useAnimatedStyle(() => ({ opacity: vizOpacity.value }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));
  const infoCardStyle = useAnimatedStyle(() => ({
    opacity: infoCardOpacity.value,
    transform: [{ translateY: infoCardTranslateY.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOpacity.value }));

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/pain-beauty-gap');
  }, [router]);

  const sepY = (getIconY(1) + getIconY(2)) / 2;

  return (
    <SafeScreen>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>

        <Animated.View style={[styles.vizWrap, vizStyle]}>
          <Svg width={SVG_WIDTH} height={VIZ_HEIGHT}>
            {Array.from({ length: 10 }).map((_, i) => (
              <MaleIcon key={`m-${i}`} cx={LEFT_X} cy={getIconY(i)} />
            ))}

            {Array.from({ length: 10 }).map((_, i) => {
              const isTop = i < 2;
              const isTransition = i === 2;
              const color = isTop || isTransition ? Colors.primary : Colors.textSecondary;
              const opacity = isTransition ? 0.6 : 1;
              return (
                <FemaleIcon
                  key={`f-${i}`}
                  cx={RIGHT_X}
                  cy={getIconY(i)}
                  color={color}
                  opacity={opacity}
                  glow={isTop}
                />
              );
            })}

            <Line
              x1={RIGHT_X - 15}
              y1={sepY}
              x2={RIGHT_X + 15}
              y2={sepY}
              stroke="#333333"
              strokeWidth={1}
              strokeDasharray="4 3"
            />

            {CONNECTIONS.map((conn, i) => (
              <ConnectionLineSvg
                key={`line-${i}`}
                x1={LEFT_X + LINE_X_OFFSET}
                y1={getIconY(conn.man)}
                x2={RIGHT_X - LINE_X_OFFSET}
                y2={getIconY(conn.woman)}
                delay={conn.delay}
              />
            ))}
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.labelWrap, labelStyle]}>
          <Text style={styles.labelText}>
            80% of men's attention →{' '}
            <Text style={styles.labelAccent}>top 20%</Text> of women
          </Text>
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View style={[styles.infoCard, infoCardStyle]}>
          <Text style={styles.infoTitle}>The Attention Economy</Text>
          <Text style={styles.infoBody}>
            On dating apps, the top 20% of women receive 80% of all attention.
            The rest compete for scraps. The difference isn't genetics — it's
            presentation, skincare, styling, and knowing your best angles.
            That's soft-maxxing. And that's what Peakd builds for you.
          </Text>
        </Animated.View>

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

  vizWrap: {
    marginTop: 8,
    alignSelf: 'center',
  },

  labelWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888888',
    letterSpacing: 0.5,
  },
  labelAccent: {
    color: Colors.primary,
  },

  spacer: { flex: 1 },

  infoCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  ctaLabel: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
  },
});
