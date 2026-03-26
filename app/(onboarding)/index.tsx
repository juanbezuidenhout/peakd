import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Dimensions, LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Circle } from 'react-native-svg';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedLine = Animated.createAnimatedComponent(Line);

export default function HeroScreen() {
  const router = useRouter();
  const [svgWidth, setSvgWidth] = useState(0);
  const [svgHeight, setSvgHeight] = useState(0);
  const scanY = useSharedValue(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSvgWidth(width);
    setSvgHeight(height);
  };

  useEffect(() => {
    if (svgWidth <= 0 || svgHeight <= 0) return;
    scanY.value = svgHeight * 0.2;
    scanY.value = withRepeat(
      withTiming(svgHeight * 0.8, {
        duration: 3000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [svgWidth, svgHeight, scanY]);

  const scanLineProps = useAnimatedProps(() => ({
    y1: scanY.value,
    y2: scanY.value,
  }));

  const cx = svgWidth / 2;
  const cy = svgHeight / 2;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={styles.topZone} onLayout={handleLayout}>
        {svgWidth > 0 && svgHeight > 0 && (
          <Svg width="100%" height="100%">
            {Array.from({ length: 7 }, (_, i) => {
              const x = (svgWidth / 8) * (i + 1);
              return (
                <Line
                  key={`v${i}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={svgHeight}
                  stroke="#1C1C1C"
                  strokeWidth={0.6}
                />
              );
            })}

            {Array.from({ length: 9 }, (_, i) => {
              const y = (svgHeight / 10) * (i + 1);
              return (
                <Line
                  key={`h${i}`}
                  x1={0}
                  y1={y}
                  x2={svgWidth}
                  y2={y}
                  stroke="#1C1C1C"
                  strokeWidth={0.6}
                />
              );
            })}

            <Circle cx={cx} cy={cy} r={svgWidth * 0.22} stroke="#2C2C2C" strokeWidth={1} fill="none" />
            <Circle cx={cx} cy={cy} r={svgWidth * 0.36} stroke="#2C2C2C" strokeWidth={1} fill="none" />
            <Circle cx={cx} cy={cy} r={svgWidth * 0.50} stroke="#2C2C2C" strokeWidth={1} fill="none" />

            <AnimatedLine
              x1={0}
              x2={svgWidth}
              animatedProps={scanLineProps}
              stroke={Colors.primary}
              strokeWidth={1.5}
              opacity={0.65}
            />

            <Line x1={cx - 12} x2={cx + 12} y1={cy} y2={cy} stroke={Colors.primary} strokeWidth={1.5} />
            <Line x1={cx} x2={cx} y1={cy - 12} y2={cy + 12} stroke={Colors.primary} strokeWidth={1.5} />
          </Svg>
        )}

        <LinearGradient
          colors={['transparent', Colors.background]}
          style={styles.topGradient}
        />

        <View style={styles.logoRow}>
          <Text style={styles.logoPeak}>peak</Text>
          <Text style={styles.logoD}>d</Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <View>
          <Animated.View entering={FadeInUp.delay(150).duration(500)}>
            <Text style={styles.label}>AI BEAUTY INTELLIGENCE</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <Text style={styles.headline}>
              {'Find Out How Much\n'}
              <Text style={styles.headlineAccent}>Hotter</Text>
              {' You\nCould Look'}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(450).duration(500)}>
            <Text style={styles.subtext}>
              Your beauty archetype, glow score, and 30-day protocol. Built by AI in 60 seconds.
            </Text>
          </Animated.View>
        </View>

        <View>
          <Animated.View entering={FadeInUp.delay(600).duration(500)}>
            <PrimaryButton
              label="Get Started →"
              onPress={() => router.push('/(onboarding)/pain-dating')}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(750).duration(500)}>
            <Text style={styles.socialProof}>50,000+ women already glowing up</Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topZone: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.56,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
  },
  topGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
  },
  logoRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 52,
    left: 20,
  },
  logoPeak: {
    fontWeight: '800',
    fontSize: 22,
    color: '#FFFFFF',
  },
  logoD: {
    fontWeight: '800',
    fontSize: 22,
    color: Colors.primary,
  },
  bottom: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  headline: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 44,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  headlineAccent: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.accent,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  subtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },
  socialProof: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 14,
  },
});
