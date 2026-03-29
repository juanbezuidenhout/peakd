import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, StatusBar, Dimensions, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import ReAnimated, { FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Stable CDN URLs for the AI-generated before/after images
const BEFORE_IMAGE_URI =
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663227390842/XUSFuhbPtgURPNgq.jpg';
const AFTER_IMAGE_URI =
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663227390842/cdwuwjZhpJCnzwVL.jpg';

const SLIDE_COUNT = 4;
const SLIDE_DURATION = 2800;
const FADE_DURATION = 600;

export default function HeroScreen( ) {
  const router = useRouter();

  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  const fadeAnims = useRef(
    Array.from({ length: SLIDE_COUNT }, (_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;

  useEffect(() => {
    const interval = setInterval(() => {
      const current = activeIndexRef.current;
      const next = (current + 1) % SLIDE_COUNT;

      Animated.parallel([
        Animated.timing(fadeAnims[current], {
          toValue: 0,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnims[next], {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
      ]).start();

      activeIndexRef.current = next;
      setActiveIndex(next);
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, []); // runs once — reads activeIndexRef.current (no stale closure)

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* ── TOP ZONE — carousel ── */}
      <View style={styles.topZone}>

        {/* Slide 1 — "Before" image */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnims[0] }]}>
          <Image
            source={{ uri: BEFORE_IMAGE_URI }}
            style={styles.slideImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Slide 2 — Glow Score card */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.slideCenter,
            { opacity: fadeAnims[1], backgroundColor: '#0A0A0A' },
          ]}
        >
          <Text style={styles.glowLabel}>YOUR GLOW SCORE</Text>
          <Text style={styles.glowNumber}>6.2</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.glowSub}>Enhancement zones identified</Text>
        </Animated.View>

        {/* Slide 3 — Countdown circle */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.slideCenter,
            { opacity: fadeAnims[2], backgroundColor: '#0A0A0A' },
          ]}
        >
          <Svg width={260} height={260} viewBox="0 0 260 260">
            {/* Background track */}
            <Circle cx={130} cy={130} r={110} stroke="#2A2A2A" strokeWidth={8} fill="none" />
            {/* Arc — 75% of circumference: 2π×110×0.75 ≈ 518; total ≈ 691 */}
            <Circle
              cx={130}
              cy={130}
              r={110}
              stroke={Colors.primary}
              strokeWidth={8}
              fill="none"
              strokeDasharray="518 691"
              strokeDashoffset="173"
              strokeLinecap="round"
              transform="rotate(-90 130 130)"
            />
          </Svg>
          <View style={styles.countdownTextContainer}>
            <Text style={styles.countdownNumber}>30</Text>
            <Text style={styles.countdownLabel}>DAYS UNTIL</Text>
            <Text style={styles.countdownAccent}>YOUR PEAK</Text>
          </View>
        </Animated.View>

        {/* Slide 4 — "After" image */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnims[3] }]}>
          <Image
            source={{ uri: AFTER_IMAGE_URI }}
            style={styles.slideImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Gradient fade at bottom of top zone */}
        <LinearGradient
          colors={['transparent', '#0A0A0A']}
          style={styles.topGradient}
        />

        {/* Logo — top-left */}
        <View style={styles.logoRow}>
          <Text style={styles.logoPeak}>peak</Text>
          <Text style={styles.logoD}>d</Text>
        </View>
      </View>

      {/* ── BOTTOM ZONE — static ── */}
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

  // ── Top zone ──
  topZone: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.58,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
  },
  logoRow: {
    position: 'absolute',
    top: 52,
    left: 20,
    flexDirection: 'row',
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

  // ── Slide 2 — Glow Score ──
  glowLabel: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  glowNumber: {
    color: '#FFFFFF',
    fontSize: 80,
    fontWeight: '900',
    lineHeight: 80,
  },
  progressTrack: {
    width: '65%',
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    marginTop: 20,
    marginBottom: 12,
  },
  progressFill: {
    width: '80%',
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  glowSub: {
    color: '#888888',
    fontSize: 13,
  },

  // ── Slide 3 — Countdown ──
  countdownTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  countdownNumber: {
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 64,
  },
  countdownLabel: {
    color: '#888888',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  countdownAccent: {
    color: '#C084FC',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // ── Bottom zone ──
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
