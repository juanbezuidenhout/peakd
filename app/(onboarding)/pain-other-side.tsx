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
  withTiming,
  withDelay,
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
    avatarColor: '#444444',
    primary: 'You: Hey! How\'s your week going?',
    secondary: 'Read 2 days ago',
    isSecondaryItalic: true,
    textColor: '#FFFFFF',
  },
  {
    initials: '💔',
    avatarColor: '#444444',
    primary: 'Alex unmatched with you',
    secondary: 'Yesterday',
    isEmoji: true,
    textColor: '#FFFFFF',
  },
  {
    initials: '',
    avatarColor: 'transparent',
    primary: 'No new likes this week',
    secondary: 'Try updating your profile',
    isCentered: true,
    isDashed: true,
    textColor: '#666666',
  },
  {
    initials: 'M',
    avatarColor: '#444444',
    primary: 'You: Would love to grab coffee sometime!',
    secondary: 'Seen',
    isSecondaryItalic: true,
    textColor: '#FFFFFF',
  },
  {
    initials: '👤−',
    avatarColor: '#444444',
    primary: '-3 followers this week',
    secondary: 'Today',
    isEmoji: true,
    textColor: '#666666',
  },
] as const;

function NotificationItem({
  item,
  index,
}: {
  item: (typeof NOTIFICATIONS)[number];
  index: number;
}) {
  if (item.isCentered) {
    return (
      <Animated.View
        entering={FadeInUp.delay(800 + index * 400)
          .duration(500)
          .easing(Easing.out(Easing.cubic))}
        style={[styles.notifRow, styles.notifRowDashed]}
      >
        <View style={styles.centeredCol}>
          <Text style={[styles.notifBody, { color: item.textColor, textAlign: 'center' }]}>
            {item.primary}
          </Text>
          <Text style={[styles.notifTime, { textAlign: 'center', marginTop: 2 }]}>
            {item.secondary}
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(800 + index * 400)
        .duration(500)
        .easing(Easing.out(Easing.cubic))}
      style={styles.notifRow}
    >
      {item.isEmoji ? (
        <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
          <Text style={styles.avatarEmoji}>{item.initials}</Text>
        </View>
      ) : (
        <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
          <Text style={styles.avatarText}>{item.initials}</Text>
        </View>
      )}
      <View style={styles.notifTextCol}>
        <Text style={[styles.notifBody, { color: item.textColor }]} numberOfLines={1}>
          {item.primary}
        </Text>
        {item.isSecondaryItalic ? (
          <Text style={[styles.notifTime, { fontStyle: 'italic' }]}>
            {item.secondary}
          </Text>
        ) : (
          <Text style={styles.notifTime}>{item.secondary}</Text>
        )}
      </View>
    </Animated.View>
  );
}

export default function PainOtherSideScreen() {
  const router = useRouter();

  const headlineOpacity = useSharedValue(0);
  const phoneOpacity = useSharedValue(0);
  const phoneDim = useSharedValue(1);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(16);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    headlineOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );

    phoneOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );

    phoneDim.value = withDelay(
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

  const phoneStyle = useAnimatedStyle(() => ({
    opacity: phoneOpacity.value * phoneDim.value,
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

        <Animated.View style={[styles.phoneMockup, phoneStyle]}>
          <View style={styles.phoneHeader}>
            <Text style={styles.phoneTitle}>Notifications</Text>
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
            likes are sparse. It's not about being ugly — it's about not knowing
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
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    height: 56,
  },
  notifRowDashed: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#2A2A2A',
    justifyContent: 'center',
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
  avatarEmoji: {
    fontSize: 16,
  },
  notifTextCol: {
    flex: 1,
  },
  centeredCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
