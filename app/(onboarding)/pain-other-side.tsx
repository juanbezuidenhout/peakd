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
  Easing,
  FadeInUp,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';

const ICON_SIZE = 44;

function InstagramIcon({ gradientId = 'igBg' }: { gradientId?: string }) {
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 44 44">
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

function HingeIcon() {
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 44 44">
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
    title: 'james_h',
    body: "You: Hey! How's your week going?",
    time: 'Read 2d ago',
    isReadReceipt: true,
  },
  {
    icon: 'hinge' as const,
    title: 'Hinge',
    body: 'Alex unmatched with you',
    time: 'Yesterday',
    isReadReceipt: false,
  },
  {
    icon: 'instagram' as const,
    title: 'Instagram',
    body: 'No new likes this week',
    time: '3d ago',
    isReadReceipt: false,
  },
  {
    icon: 'instagram' as const,
    title: 'mike.c',
    body: 'You: Would love to grab coffee sometime!',
    time: 'Seen',
    isReadReceipt: true,
  },
  {
    icon: 'instagram' as const,
    title: 'Instagram',
    body: '3 followers unfollowed this week',
    time: 'Today',
    isReadReceipt: false,
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
          <InstagramIcon gradientId={`ig_os_${index}`} />
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
      <Text
        style={[
          styles.notifTime,
          item.isReadReceipt && styles.notifTimeItalic,
        ]}
      >
        {item.time}
      </Text>
    </Animated.View>
  );
}

export default function PainOtherSideScreen() {
  const router = useRouter();

  const headlineOpacity = useSharedValue(0);
  const centreOpacity = useSharedValue(0);
  const centreDim = useSharedValue(1);
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

    centreDim.value = withDelay(
      3000,
      withTiming(0.85, { duration: 1200, easing: Easing.out(Easing.cubic) }),
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
    opacity: centreOpacity.value * centreDim.value,
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
          <Text style={styles.headline}>THE OTHER SIDE</Text>
        </Animated.View>

        <Animated.View style={[styles.notifCentre, centreStyle]}>
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
          <Text style={styles.infoTitle}>Everyone Else</Text>
          <Text style={styles.infoBody}>
            For most women, the dating app is silence. The DMs don't come. The
            likes are sparse. It's not about being ugly, it's about not knowing
            what's holding you back. And no one tells you.
          </Text>
        </Animated.View>

        <Animated.View style={ctaStyle}>
          <Pressable
            style={styles.ctaButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(onboarding)/pain-same-girl');
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
  notifTimeItalic: {
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.25)',
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
