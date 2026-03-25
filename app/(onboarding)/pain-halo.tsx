import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SafeScreen } from '@/components/layout/SafeScreen';

export default function PainHaloScreen() {
  const router = useRouter();

  const scaleLeft = useSharedValue(0.7);
  const scaleRight = useSharedValue(0.7);

  useEffect(() => {
    scaleLeft.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    scaleRight.value = withDelay(
      150,
      withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, []);

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleLeft.value }],
  }));

  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleRight.value }],
  }));

  return (
    <SafeScreen>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backChevron}>‹</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>THE SCIENCE</Text>
      <Text style={styles.headline}>{'THE HALO\nEFFECT'}</Text>

      <Text style={styles.definition}>
        A cognitive bias where we subconsciously assume someone's positive qualities —
        intelligence, kindness, success — based on their physical appearance.
      </Text>

      <View style={styles.illustrationRow}>
        <View style={styles.circleColumn}>
          <Animated.View style={[styles.circleLeft, leftStyle]}>
            <Text style={styles.circleEmoji}>✨</Text>
          </Animated.View>
          <Text style={styles.labelLeft}>Attractive</Text>
        </View>

        <View style={styles.circleColumn}>
          <Animated.View style={[styles.circleRight, rightStyle]}>
            <Text style={styles.circleEmoji}>😐</Text>
          </Animated.View>
          <Text style={styles.labelRight}>Average</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>You Are Judged Before You Speak</Text>
        <Text style={styles.infoBody}>
          The Halo Effect means attractive women are consistently rated as more intelligent, more
          competent, and more trustworthy — before they say a single word. This is the gap Peakd
          helps you close.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.stickyBottom}>
        <PrimaryButton label="Next →" onPress={() => router.push('/(onboarding)/pain-chat')} />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  backChevron: {
    fontSize: 32,
    color: Colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.primary,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
  },
  headline: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 42,
    marginTop: 24,
    marginBottom: 16,
  },
  definition: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 32,
  },
  illustrationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 32,
  },
  circleColumn: {
    alignItems: 'center',
  },
  circleLeft: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleRight: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleEmoji: {
    fontSize: 32,
  },
  labelLeft: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  labelRight: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  infoBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  stickyBottom: {
    paddingBottom: 24,
    paddingTop: 16,
  },
});
