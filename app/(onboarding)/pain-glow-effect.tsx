import { useEffect } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, {
  Rect,
  Circle,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  FadeInUp,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';

const { width: SCREEN_W } = Dimensions.get('window');
const ICON_SIZE = 44;

function InstagramIcon({ size = ICON_SIZE, gradientId = 'igBg' }: { size?: number; gradientId?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      <Defs>
        <LinearGradient id={gradientId} x1="0.9" y1="0" x2="0.1" y2="1">
          <Stop offset="0%" stopColor="#515BD4" />
          <Stop offset="26%" stopColor="#8134AF" />
          <Stop offset="46%" stopColor="#DD2A7B" />
          <Stop offset="66%" stopColor="#F58529" />
          <Stop offset="100%" stopColor="#FEDA77" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={44} height={44} rx={10} fill={`url(#${gradientId})`} />
      <Rect
        x={10} y={10} width={24} height={24} rx={7}
        fill="none" stroke="#FFFFFF" strokeWidth={2.2}
      />
      <Circle cx={22} cy={22} r={5.5} fill="none" stroke="#FFFFFF" strokeWidth={2.2} />
      <Circle cx={31.5} cy={12.5} r={1.8} fill="#FFFFFF" />
    </Svg>
  );
}

function HingeIcon({ size = ICON_SIZE }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      <Rect x={0} y={0} width={44} height={44} rx={10} fill="#FFFFFF" />
      <Path d="M14 11 V33" stroke="#333333" strokeWidth={4.5} strokeLinecap="round" />
      <Path d="M30 11 V27" stroke="#333333" strokeWidth={4.5} strokeLinecap="round" />
      <Path d="M14 22 H30" stroke="#333333" strokeWidth={4.5} strokeLinecap="round" />
      <Path
        d="M30 27 C30 31 27 34 23 34"
        stroke="#333333" strokeWidth={4.5} strokeLinecap="round" fill="none"
      />
    </Svg>
  );
}

const NOTIFICATIONS = [
  {
    icon: 'instagram' as const,
    title: 'james_97',
    body: 'Liked your photo',
    time: 'just now',
  },
  {
    icon: 'hinge' as const,
    title: 'Hinge',
    body: 'New match! You and Alex matched',
    time: '2m ago',
  },
  {
    icon: 'instagram' as const,
    title: 'sarah.m',
    body: "you're actually stunning 😍",
    time: '5m ago',
  },
  {
    icon: 'instagram' as const,
    title: 'Instagram',
    body: '+12 new followers today',
    time: '1h ago',
  },
  {
    icon: 'instagram' as const,
    title: 'mike.c',
    body: 'Hey, saw your story. Want to grab coffee?',
    time: '3h ago',
  },
];

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
      style={styles.notifCard}
    >
      <View style={styles.notifIconWrap}>
        {item.icon === 'instagram' ? (
          <InstagramIcon gradientId={`ig_${index}`} />
        ) : (
          <HingeIcon />
        )}
      </View>
      <View style={styles.notifTextCol}>
        <Text style={styles.notifTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.notifBody} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      <Text style={styles.notifTime}>{item.time}</Text>
    </Animated.View>
  );
}

export default function PainGlowEffectScreen() {
  const router = useRouter();

  const headlineOpacity = useSharedValue(0);
  const centreOpacity = useSharedValue(0);
  const glowPulse = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(16);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    headlineOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );

    centreOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
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

  const centreStyle = useAnimatedStyle(() => ({
    opacity: centreOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowPulse.value * 0.12,
    shadowRadius: 24 + glowPulse.value * 12,
    elevation: glowPulse.value * 8,
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

        <Animated.View style={[styles.notifCentre, centreStyle, glowStyle]}>
          <View style={styles.centreHeader}>
            <Text style={styles.centreTitle}>Notification Centre</Text>
            <View style={styles.closeCircle}>
              <Text style={styles.closeX}>×</Text>
            </View>
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
            compliments, opportunities all come to her. This isn't luck. It's
            the glow effect, and it's measurable.
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
    marginBottom: 20,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  notifCentre: {
    paddingHorizontal: 2,
  },
  centreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  centreTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  closeCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: '600',
    marginTop: -1,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(44, 44, 52, 0.72)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    marginBottom: 8,
  },
  notifIconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE * 0.22,
    overflow: 'hidden',
    marginRight: 12,
  },
  notifTextCol: {
    flex: 1,
    marginRight: 8,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.55)',
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
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
