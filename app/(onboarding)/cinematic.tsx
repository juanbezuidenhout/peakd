import { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
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

const ANIM_BASE = 200;

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
  const photosOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(12);

  useEffect(() => {
    headerOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });

    photosOpacity.value = withDelay(
      ANIM_BASE,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
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

  const photosStyle = useAnimatedStyle(() => ({
    opacity: photosOpacity.value,
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
              qualities, like intelligence or kindness, based on their physical
              appearance
            </Text>
          </Animated.View>

          <Animated.View style={[styles.faceRow, photosStyle]}>
            <Image
              source={require('../../assets/images/halo-angel.png')}
              style={styles.faceImage}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/images/halo-plain.png')}
              style={styles.faceImage}
              resizeMode="contain"
            />
          </Animated.View>

          <View style={styles.figuresRow}>
            <View style={styles.figureColumn}>
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
  faceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: 8,
    gap: 8,
  },
  faceImage: {
    width: '46%',
    height: 180,
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
