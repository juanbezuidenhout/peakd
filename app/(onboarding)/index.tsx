import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, StatusBar, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import ReAnimated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOP_ZONE_HEIGHT = SCREEN_HEIGHT * 0.58;

const IMAGE_URLS = [
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&q=80',
];

const SLIDES = [
  { type: 'image' as const, uri: IMAGE_URLS[0] },
  { type: 'view' as const, id: 'glow-score' },
  { type: 'view' as const, id: 'countdown' },
  { type: 'image' as const, uri: IMAGE_URLS[1] },
];

const CIRCLE_RADIUS = 120;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
const ARC_PERCENT = 0.75;

function GlowScoreSlide() {
  return (
    <View style={styles.slideView}>
      <Text style={styles.glowLabel}>YOUR GLOW SCORE</Text>
      <Text style={styles.glowNumber}>6.2</Text>
      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>
      <Text style={styles.glowSub}>Enhancement zones identified</Text>
    </View>
  );
}

function CountdownSlide() {
  return (
    <View style={styles.slideView}>
      <Svg
        width={CIRCLE_RADIUS * 2 + 20}
        height={CIRCLE_RADIUS * 2 + 20}
        style={styles.countdownSvg}
      >
        <Circle
          cx={CIRCLE_RADIUS + 10}
          cy={CIRCLE_RADIUS + 10}
          r={CIRCLE_RADIUS}
          stroke="#2A2A2A"
          strokeWidth={8}
          fill="none"
        />
        <Circle
          cx={CIRCLE_RADIUS + 10}
          cy={CIRCLE_RADIUS + 10}
          r={CIRCLE_RADIUS}
          stroke={Colors.primary}
          strokeWidth={8}
          fill="none"
          strokeDasharray={`${CIRCLE_CIRCUMFERENCE}`}
          strokeDashoffset={CIRCLE_CIRCUMFERENCE * (1 - ARC_PERCENT)}
          strokeLinecap="round"
          rotation={-90}
          origin={`${CIRCLE_RADIUS + 10}, ${CIRCLE_RADIUS + 10}`}
        />
      </Svg>
      <View style={styles.countdownTextContainer}>
        <Text style={styles.countdownNumber}>30</Text>
        <Text style={styles.countdownLabel}>DAYS UNTIL</Text>
        <Text style={styles.countdownAccent}>YOUR PEAK</Text>
      </View>
    </View>
  );
}

export default function HeroScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [imagesReady, setImagesReady] = useState(false);
  const fadeAnims = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Promise.all(IMAGE_URLS.map((url) => Image.prefetch(url)))
      .catch(() => {})
      .finally(() => setImagesReady(true));
  }, []);

  useEffect(() => {
    if (!imagesReady) return;

    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % SLIDES.length;
        Animated.parallel([
          Animated.timing(fadeAnims[prev], { toValue: 0, duration: 600, useNativeDriver: true }),
          Animated.timing(fadeAnims[next], { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();
        return next;
      });
    }, 2800);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [imagesReady, fadeAnims]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={styles.topZone}>
        {SLIDES.map((slide, index) => {
          if (slide.type === 'image') {
            return (
              <Animated.View key={index} style={[styles.slideAbsolute, { opacity: fadeAnims[index] }]}>
                <Image source={{ uri: slide.uri }} style={styles.slideImage} resizeMode="cover" />
              </Animated.View>
            );
          }
          if (slide.id === 'glow-score') {
            return (
              <Animated.View key={index} style={[styles.slideAbsolute, { opacity: fadeAnims[index] }]}>
                <GlowScoreSlide />
              </Animated.View>
            );
          }
          return (
            <Animated.View key={index} style={[styles.slideAbsolute, { opacity: fadeAnims[index] }]}>
              <CountdownSlide />
            </Animated.View>
          );
        })}

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
          <ReAnimated.View entering={FadeInUp.delay(150).duration(500)}>
            <Text style={styles.label}>AI BEAUTY INTELLIGENCE</Text>
          </ReAnimated.View>

          <ReAnimated.View entering={FadeInUp.delay(300).duration(500)}>
            <Text style={styles.headline}>
              {'Find Out How Much\n'}
              <Text style={styles.headlineAccent}>Hotter</Text>
              {' You\nCould Look'}
            </Text>
          </ReAnimated.View>

          <ReAnimated.View entering={FadeInUp.delay(450).duration(500)}>
            <Text style={styles.subtext}>
              Your beauty archetype, glow score, and 30-day protocol. Built by AI in 60 seconds.
            </Text>
          </ReAnimated.View>
        </View>

        <View>
          <ReAnimated.View entering={FadeInUp.delay(600).duration(500)}>
            <PrimaryButton
              label="Get Started →"
              onPress={() => router.push('/(onboarding)/pain-dating')}
            />
          </ReAnimated.View>

          <ReAnimated.View entering={FadeInUp.delay(750).duration(500)}>
            <Text style={styles.socialProof}>50,000+ women already glowing up</Text>
          </ReAnimated.View>
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
    height: TOP_ZONE_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
  },
  slideAbsolute: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: TOP_ZONE_HEIGHT,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideView: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
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
  glowLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    color: '#C084FC',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  glowNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  progressTrack: {
    width: SCREEN_WIDTH * 0.7,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2A2A',
    marginBottom: 12,
  },
  progressFill: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  glowSub: {
    fontSize: 13,
    color: '#888888',
  },
  countdownSvg: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
  },
  countdownTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  countdownLabel: {
    fontSize: 14,
    color: '#888888',
    textTransform: 'uppercase',
    marginTop: -4,
  },
  countdownAccent: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
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
