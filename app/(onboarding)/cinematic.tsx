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

      <Ellipse cx={70} cy={18} rx={32} ry={10} fill="url(#haloGlow)" />
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

      <Path
        d="M44 52 C42 36, 54 26, 70 26 C86 26, 98 36, 96 52"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M44 52 C42 68, 38 90, 37 112 C36 122, 38 132, 42 140"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M96 52 C98 68, 102 90, 103 112 C104 122, 102 132, 98 140"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M47 56 C45 70, 44 86, 46 100"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.4}
      />
      <Path
        d="M93 56 C95 70, 96 86, 94 100"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.4}
      />

      <Path
        d="M52 54 C52 42, 58 36, 70 36 C82 36, 88 42, 88 54
           L88 72 C88 88, 82 97, 70 99 C58 97, 52 88, 52 72 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
      />

      <Path
        d="M55 56 C58 53, 63 53, 66 56"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <Path
        d="M74 56 C77 53, 82 53, 85 56"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
      />

      <Path
        d="M55 62 C58 59, 63 59, 66 62 C63 64.5, 58 64.5, 55 62"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Ellipse cx={60.5} cy={61.8} rx={1.5} ry={1.8} fill="#FFFFFF" />
      <Path
        d="M54 61.5 C57 58, 64 57.5, 67 60.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.1}
        strokeLinecap="round"
      />

      <Path
        d="M74 62 C77 59, 82 59, 85 62 C82 64.5, 77 64.5, 74 62"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Ellipse cx={79.5} cy={61.8} rx={1.5} ry={1.8} fill="#FFFFFF" />
      <Path
        d="M73 60.5 C76 57.5, 83 58, 86 61.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.1}
        strokeLinecap="round"
      />

      <Path
        d="M70 68 C69 73, 68 77, 67 79"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.1}
        strokeLinecap="round"
      />
      <Path
        d="M65 81 C67 82.5, 73 82.5, 75 81"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1}
        strokeLinecap="round"
      />

      <Path
        d="M63 88 C65 86, 68 85.5, 70 87 C72 85.5, 75 86, 77 88"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <Path
        d="M63 88 C66 92, 74 92, 77 88"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.3}
        strokeLinecap="round"
      />

      <Line x1={65} y1={99} x2={63} y2={118} stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={75} y1={99} x2={77} y2={118} stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" />

      <Path
        d="M63 118 C57 120, 38 128, 28 140
           M77 118 C83 120, 102 128, 112 140"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      <Path
        d="M46 132 C56 129, 63 128, 70 128 C77 128, 84 129, 94 132"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={0.9}
        strokeLinecap="round"
        opacity={0.4}
      />
    </Svg>
  );
}

function RightFigure() {
  return (
    <Svg width={FIGURE_W} height={FIGURE_H} viewBox="0 0 140 180">
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

      <Path
        d="M44 52 C42 36, 54 26, 70 26 C86 26, 98 36, 96 52"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M44 52 C42 68, 38 90, 37 112 C36 122, 38 132, 42 140"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M96 52 C98 68, 102 90, 103 112 C104 122, 102 132, 98 140"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M47 56 C45 70, 44 86, 46 100"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.4}
      />
      <Path
        d="M93 56 C95 70, 96 86, 94 100"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.4}
      />

      <Path
        d="M52 54 C52 42, 58 36, 70 36 C82 36, 88 42, 88 54
           L88 72 C88 88, 82 97, 70 99 C58 97, 52 88, 52 72 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
      />

      <Path
        d="M55 56 C58 53, 63 53, 66 56"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <Path
        d="M74 56 C77 53, 82 53, 85 56"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
      />

      <Path
        d="M55 62 C58 59, 63 59, 66 62 C63 64.5, 58 64.5, 55 62"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Ellipse cx={60.5} cy={61.8} rx={1.5} ry={1.8} fill="#FFFFFF" />
      <Path
        d="M54 61.5 C57 58, 64 57.5, 67 60.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.1}
        strokeLinecap="round"
      />

      <Path
        d="M74 62 C77 59, 82 59, 85 62 C82 64.5, 77 64.5, 74 62"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Ellipse cx={79.5} cy={61.8} rx={1.5} ry={1.8} fill="#FFFFFF" />
      <Path
        d="M73 60.5 C76 57.5, 83 58, 86 61.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.1}
        strokeLinecap="round"
      />

      <Path
        d="M70 68 C69 73, 68 77, 67 79"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.1}
        strokeLinecap="round"
      />
      <Path
        d="M65 81 C67 82.5, 73 82.5, 75 81"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1}
        strokeLinecap="round"
      />

      <Path
        d="M63 91 C65 89, 68 88.5, 70 89.5 C72 88.5, 75 89, 77 91"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <Path
        d="M63 91 C66 88, 74 88, 77 91"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.3}
        strokeLinecap="round"
      />

      <Line x1={65} y1={99} x2={63} y2={118} stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={75} y1={99} x2={77} y2={118} stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" />

      <Path
        d="M63 118 C57 120, 38 128, 28 140
           M77 118 C83 120, 102 128, 112 140"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      <Path
        d="M46 132 C56 129, 63 128, 70 128 C77 128, 84 129, 94 132"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={0.9}
        strokeLinecap="round"
        opacity={0.4}
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
          { color: positive ? Colors.success : Colors.error },
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
            router.push('/(onboarding)/pain-glow-effect');
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
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
  },
  infoCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
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
    backgroundColor: Colors.navy,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  ctaLabel: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
