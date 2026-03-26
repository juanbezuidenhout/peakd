import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, {
  Path,
  Ellipse,
  Line,
  G,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';

const POSITIVE_TRAITS = ['intelligent', 'kind', 'rich'] as const;
const NEGATIVE_TRAITS = ['intelligent', 'kind', 'rich'] as const;

const FIGURE_W = 140;
const FIGURE_H = 180;
const ANIM_BASE = 200;

function LeftFigure() {
  return (
    <Svg width={FIGURE_W} height={FIGURE_H} viewBox="0 0 140 180">
      <Defs>
        <RadialGradient id="haloGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#F5D060" stopOpacity={0.5} />
          <Stop offset="100%" stopColor="#F5D060" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Halo glow */}
      <Ellipse cx={70} cy={18} rx={32} ry={10} fill="url(#haloGlow)" />
      {/* Halo ring */}
      <Ellipse
        cx={70}
        cy={18}
        rx={26}
        ry={8}
        fill="none"
        stroke="#F5D060"
        strokeWidth={2.2}
        transform="rotate(-8, 70, 18)"
      />

      {/* Hair — flowing, longer for femininity */}
      <Path
        d="M42 62 C38 40, 55 24, 70 26 C85 24, 102 40, 98 62
           L100 90 C102 96, 100 102, 96 106
           L96 106 C96 96, 94 82, 92 72
           L92 72 C90 80, 86 60, 70 58
           C54 60, 50 80, 48 72
           L48 72 C46 82, 44 96, 44 106
           L44 106 C40 102, 38 96, 40 90 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* Extra hair strands */}
      <Path
        d="M40 90 C36 100, 34 114, 38 124"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M100 90 C104 100, 106 114, 102 124"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinecap="round"
      />

      {/* Face outline */}
      <Path
        d="M50 62 C50 50, 56 42, 70 42 C84 42, 90 50, 90 62
           L90 78 C90 96, 82 106, 70 108 C58 106, 50 96, 50 78 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
      />

      {/* Left eye */}
      <Path
        d="M56 68 C58 65, 63 65, 65 68"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Left eyelash */}
      <Line x1={55} y1={67} x2={53} y2={64} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={58} y1={65.5} x2={57} y2={62.5} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />

      {/* Right eye */}
      <Path
        d="M75 68 C77 65, 82 65, 84 68"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Right eyelash */}
      <Line x1={85} y1={67} x2={87} y2={64} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={82} y1={65.5} x2={83} y2={62.5} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />

      {/* Nose */}
      <Path
        d="M68 76 C68 80, 66 84, 64 86 C66 87, 74 87, 76 86 C74 84, 72 80, 72 76"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
      />

      {/* Smile */}
      <Path
        d="M62 93 C65 97, 75 97, 78 93"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {/* Neck */}
      <Line x1={64} y1={108} x2={62} y2={128} stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={76} y1={108} x2={78} y2={128} stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />

      {/* Shoulders */}
      <Path
        d="M62 128 C56 130, 34 136, 26 148
           M78 128 C84 130, 106 136, 114 148"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinecap="round"
      />

      {/* Collarbone hints */}
      <Path
        d="M48 140 C54 137, 62 136, 70 136 C78 136, 86 137, 92 140"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.5}
      />
    </Svg>
  );
}

function RightFigure() {
  return (
    <Svg width={FIGURE_W} height={FIGURE_H} viewBox="0 0 140 180">
      {/* Devil horns */}
      <G>
        <Path
          d="M48 36 L42 12 C42 12, 46 20, 52 28 Z"
          fill="#EF5350"
          stroke="#EF5350"
          strokeWidth={1}
          strokeLinejoin="round"
        />
        <Path
          d="M92 36 L98 12 C98 12, 94 20, 88 28 Z"
          fill="#EF5350"
          stroke="#EF5350"
          strokeWidth={1}
          strokeLinejoin="round"
        />
      </G>

      {/* Hair — same flowing style */}
      <Path
        d="M42 62 C38 40, 55 24, 70 26 C85 24, 102 40, 98 62
           L100 90 C102 96, 100 102, 96 106
           L96 106 C96 96, 94 82, 92 72
           L92 72 C90 80, 86 60, 70 58
           C54 60, 50 80, 48 72
           L48 72 C46 82, 44 96, 44 106
           L44 106 C40 102, 38 96, 40 90 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M40 90 C36 100, 34 114, 38 124"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M100 90 C104 100, 106 114, 102 124"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinecap="round"
      />

      {/* Face outline */}
      <Path
        d="M50 62 C50 50, 56 42, 70 42 C84 42, 90 50, 90 62
           L90 78 C90 96, 82 106, 70 108 C58 106, 50 96, 50 78 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
      />

      {/* Left eye */}
      <Path
        d="M56 68 C58 65, 63 65, 65 68"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Left eyelash */}
      <Line x1={55} y1={67} x2={53} y2={64} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={58} y1={65.5} x2={57} y2={62.5} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />

      {/* Right eye */}
      <Path
        d="M75 68 C77 65, 82 65, 84 68"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Right eyelash */}
      <Line x1={85} y1={67} x2={87} y2={64} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={82} y1={65.5} x2={83} y2={62.5} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />

      {/* Nose */}
      <Path
        d="M68 76 C68 80, 66 84, 64 86 C66 87, 74 87, 76 86 C74 84, 72 80, 72 76"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
      />

      {/* Sad/neutral mouth — downturned */}
      <Path
        d="M62 96 C65 92, 75 92, 78 96"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {/* Neck */}
      <Line x1={64} y1={108} x2={62} y2={128} stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={76} y1={108} x2={78} y2={128} stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />

      {/* Shoulders */}
      <Path
        d="M62 128 C56 130, 34 136, 26 148
           M78 128 C84 130, 106 136, 114 148"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinecap="round"
      />

      {/* Collarbone hints */}
      <Path
        d="M48 140 C54 137, 62 136, 70 136 C78 136, 86 137, 92 140"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.5}
      />
    </Svg>
  );
}

function TraitRow({
  label,
  positive,
  delay,
}: {
  label: string;
  positive: boolean;
  delay: number;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.traitRow, animStyle]}>
      <Text
        style={[
          styles.traitIcon,
          { color: positive ? '#22C55E' : '#EF4444' },
        ]}
      >
        {positive ? '✓' : '✗'}
      </Text>
      <Text style={styles.traitLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function CinematicScreen() {
  const router = useRouter();

  const headerOpacity = useSharedValue(0);
  const leftScale = useSharedValue(0.8);
  const leftOpacity = useSharedValue(0);
  const rightScale = useSharedValue(0.8);
  const rightOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(12);

  useEffect(() => {
    headerOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });

    leftOpacity.value = withDelay(
      ANIM_BASE,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
    );
    leftScale.value = withDelay(
      ANIM_BASE,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );

    rightOpacity.value = withDelay(
      ANIM_BASE + 200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
    );
    rightScale.value = withDelay(
      ANIM_BASE + 200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );

    const traitsEnd = ANIM_BASE + 800 + POSITIVE_TRAITS.length * 100 + 200;

    cardOpacity.value = withDelay(
      traitsEnd,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }),
    );
    cardTranslateY.value = withDelay(
      traitsEnd,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const leftStyle = useAnimatedStyle(() => ({
    opacity: leftOpacity.value,
    transform: [{ scale: leftScale.value }],
  }));

  const rightStyle = useAnimatedStyle(() => ({
    opacity: rightOpacity.value,
    transform: [{ scale: rightScale.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const traitBaseDelay = ANIM_BASE + 800;

  return (
    <SafeScreen>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={[styles.headerWrap, headerStyle]}>
            <Text style={styles.headline}>THE HALO EFFECT</Text>
            <Text style={styles.subtext}>
              A cognitive bias where we subconsciously assume someone's positive
              qualities — like intelligence or kindness — based on their physical
              appearance
            </Text>
          </Animated.View>

          <View style={styles.figuresRow}>
            <View style={styles.figureColumn}>
              <Animated.View style={[styles.figureWrap, leftStyle]}>
                <LeftFigure />
              </Animated.View>
              <View style={styles.traitList}>
                {POSITIVE_TRAITS.map((t, i) => (
                  <TraitRow
                    key={t}
                    label={t}
                    positive
                    delay={traitBaseDelay + i * 100}
                  />
                ))}
              </View>
            </View>

            <View style={styles.figureColumn}>
              <Animated.View style={[styles.figureWrap, rightStyle]}>
                <RightFigure />
              </Animated.View>
              <View style={styles.traitList}>
                {NEGATIVE_TRAITS.map((t, i) => (
                  <TraitRow
                    key={t}
                    label={t}
                    positive={false}
                    delay={traitBaseDelay + i * 100 + 200}
                  />
                ))}
              </View>
            </View>
          </View>

          <Animated.View style={[styles.infoCard, cardStyle]}>
            <Text style={styles.infoTitle}>Perception Is Everything</Text>
            <Text style={styles.infoBody}>
              It's not shallow, it's human nature. The Halo Effect states that you
              are treated and judged in vastly different ways depending on your
              looks
            </Text>
          </Animated.View>
        </ScrollView>

        <Pressable
          style={styles.ctaButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/quiz-name');
          }}
        >
          <Text style={styles.ctaLabel}>Next</Text>
        </Pressable>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  backChevron: {
    fontSize: 32,
    color: Colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  headerWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtext: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
    maxWidth: '85%',
  },
  figuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 30,
    marginBottom: 24,
  },
  figureColumn: {
    alignItems: 'center',
  },
  figureWrap: {
    width: FIGURE_W,
    height: FIGURE_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  traitList: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  traitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  traitIcon: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
    width: 18,
    textAlign: 'center',
  },
  traitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoBody: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  ctaButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  ctaLabel: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
  },
});
