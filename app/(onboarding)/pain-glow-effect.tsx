import { useEffect } from 'react';
import {
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

const ICON_SIZE = 38;

function InstagramIcon({ size = ICON_SIZE, gradientId = 'igBg' }: { size?: number; gradientId?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 38 38">
      <Defs>
        <LinearGradient id={gradientId} x1="0.9" y1="0" x2="0.1" y2="1">
          <Stop offset="0%" stopColor="#515BD4" />
          <Stop offset="26%" stopColor="#8134AF" />
          <Stop offset="46%" stopColor="#DD2A7B" />
          <Stop offset="66%" stopColor="#F58529" />
          <Stop offset="100%" stopColor="#FEDA77" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={38} height={38} rx={9} fill={`url(#${gradientId})`} />
      <Rect
        x={8.5} y={8.5} width={21} height={21} rx={6}
        fill="none" stroke="#FFFFFF" strokeWidth={2}
      />
      <Circle cx={19} cy={19} r={4.8} fill="none" stroke="#FFFFFF" strokeWidth={2} />
      <Circle cx={27} cy={11} r={1.6} fill="#FFFFFF" />
    </Svg>
  );
}

function HingeIcon({ size = ICON_SIZE }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 38 38">
      <Rect x={0} y={0} width={38} height={38} rx={9} fill="#1A1A1A" />
      <Path d="M12 9.5 V28.5" stroke="#FFFFFF" strokeWidth={3.8} strokeLinecap="round" />
      <Path d="M26 9.5 V23.5" stroke="#FFFFFF" strokeWidth={3.8} strokeLinecap="round" />
      <Path d="M12 19 H26" stroke="#FFFFFF" strokeWidth={3.8} strokeLinecap="round" />
      <Path
        d="M26 23.5 C26 27 23.5 29.5 20 29.5"
        stroke="#FFFFFF" strokeWidth={3.8} strokeLinecap="round" fill="none"
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
        <View style={styles.notifTopRow}>
          <Text style={styles.notifTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.notifTime}>{item.time}</Text>
        </View>
        <Text style={styles.notifBody} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
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
    shadowColor: Colors.primary,
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
    <SafeScreen scrollable>
      <View style={styles.container}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>

        <Animated.View style={[styles.headlineWrap, headlineStyle]}>
          <Text style={styles.headline}>THE GLOW EFFECT</Text>
        </Animated.View>

        <Animated.View style={[styles.notifCentre, centreStyle, glowStyle]}>
          <View style={styles.centreHeader}>
            <Text style={styles.centreTitle}>Notification Centre</Text>
            <View style={styles.clearPill}>
              <Text style={styles.clearLabel}>×</Text>
            </View>
          </View>

          {NOTIFICATIONS.map((item, i) => (
            <NotificationItem key={i} item={item} index={i} />
          ))}
        </Animated.View>

        <View style={styles.spacer} />

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
    width: '100%',
  },
  backBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingRight: 8,
  },
  spacer: {
    height: 24,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  notifCentre: {
    paddingHorizontal: 0,
  },
  centreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  centreTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  clearPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearLabel: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
    marginTop: -1,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  notifIconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 9,
    overflow: 'hidden',
    marginRight: 12,
  },
  notifTextCol: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    flexShrink: 1,
  },
  notifBody: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1C1C1E',
    lineHeight: 20,
  },
  notifTime: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    marginLeft: 8,
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
