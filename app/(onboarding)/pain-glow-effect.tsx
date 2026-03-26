import { useEffect } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  FadeInUp,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';

const { width: SCREEN_W } = Dimensions.get('window');
const PHONE_W = SCREEN_W * 0.85;

const NOTIFICATIONS = [
  {
    initials: 'J',
    gradient: ['#7C3AED', '#A855F7'],
    text: 'James liked your photo',
    time: 'just now',
  },
  {
    initials: '♥',
    gradient: ['#E11D48', '#FB7185'],
    text: 'New match! You and Alex',
    time: '2m ago',
    isHeart: true,
  },
  {
    initials: 'R',
    gradient: ['#0D9488', '#2DD4BF'],
    text: "You're actually stunning 😍",
    time: '5m ago',
  },
  {
    initials: '+',
    gradient: ['#6366F1', '#818CF8'],
    text: '+12 new followers today',
    time: '1h ago',
  },
  {
    initials: 'M',
    gradient: ['#D97706', '#FBBF24'],
    text: 'Hey, saw your story — coffee?',
    time: '3h ago',
  },
] as const;

function NotificationItem({
  item,
  index,
}: {
  item: (typeof NOTIFICATIONS)[number];
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(800 + index * 400)
        .duration(500)
        .easing(Easing.out(Easing.cubic))}
      style={styles.notifRow}
    >
      <View
        style={[
          styles.avatar,
          { backgroundColor: item.gradient[0] },
        ]}
      >
        <Text
          style={[
            styles.avatarText,
            item.isHeart && styles.avatarHeart,
          ]}
        >
          {item.initials}
        </Text>
      </View>
      <View style={styles.notifTextCol}>
        <Text style={styles.notifBody} numberOfLines={1}>
          {item.text}
        </Text>
        <Text style={styles.notifTime}>{item.time}</Text>
      </View>
    </Animated.View>
  );
}

export default function PainGlowEffectScreen() {
  const router = useRouter();

  const headlineOpacity = useSharedValue(0);
  const phoneOpacity = useSharedValue(0);
  const counterRaw = useSharedValue(0);
  const glowPulse = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(16);
  const ctaOpacity = useSharedValue(0);

  const counterDisplay = useDerivedValue(() => Math.round(counterRaw.value));

  useEffect(() => {
    headlineOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );

    phoneOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );

    counterRaw.value = withDelay(
      1000,
      withTiming(23, { duration: 2000, easing: Easing.out(Easing.cubic) }),
    );

    glowPulse.value = withDelay(
      2800,
      withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );

    cardOpacity.value = withDelay(
      3000,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    cardTranslateY.value = withDelay(
      3000,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );

    ctaOpacity.value = withDelay(
      3400,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
  }));

  const phoneStyle = useAnimatedStyle(() => ({
    opacity: phoneOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowPulse.value * 0.1,
    shadowRadius: 20 + glowPulse.value * 10,
    elevation: glowPulse.value * 8,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: phoneOpacity.value,
  }));

  const badgeTextStyle = useAnimatedStyle(() => ({
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700' as const,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
  }));

  return (
    <SafeScreen>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>

        <Animated.View style={[styles.headlineWrap, headlineStyle]}>
          <Text style={styles.headline}>THE GLOW EFFECT</Text>
        </Animated.View>

        <Animated.View style={[styles.phoneMockup, phoneStyle, glowStyle]}>
          <View style={styles.phoneHeader}>
            <Text style={styles.phoneTitle}>Notifications</Text>
            <Animated.View style={[styles.badge, badgeStyle]}>
              <Animated.Text style={badgeTextStyle}>
                {counterDisplay}
              </Animated.Text>
            </Animated.View>
          </View>

          {NOTIFICATIONS.map((item, i) => (
            <NotificationItem key={i} item={item} index={i} />
          ))}
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View style={[styles.infoCard, cardStyle]}>
          <Text style={styles.infoTitle}>Her Reality</Text>
          <Text style={styles.infoBody}>
            For women in the top 20%, attention is effortless. Dates, DMs,
            compliments, opportunities — they come to her. This isn't luck. It's
            the glow effect — and it's measurable.
          </Text>
        </Animated.View>

        <Animated.View style={ctaStyle}>
          <Pressable
            style={styles.ctaButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(onboarding)/pain-other-side');
            }}
          >
            <Text style={styles.ctaLabel}>Next</Text>
          </Pressable>
        </Animated.View>
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
  headlineWrap: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  phoneMockup: {
    width: PHONE_W,
    alignSelf: 'center',
    backgroundColor: '#111111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 16,
    overflow: 'visible',
  },
  phoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  phoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    height: 56,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarHeart: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  notifTextCol: {
    flex: 1,
  },
  notifBody: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notifTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
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
