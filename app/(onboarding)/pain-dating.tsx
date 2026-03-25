import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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

const BARS = [
  { label: 'First impression (looks)', pct: 73, accent: true },
  { label: 'Personality', pct: 14, accent: false },
  { label: 'Style & grooming', pct: 8, accent: false },
  { label: 'Confidence', pct: 5, accent: false },
] as const;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

function BarRow({
  label,
  pct,
  accent,
  progress,
}: {
  label: string;
  pct: number;
  accent: boolean;
  progress: Animated.SharedValue<number>;
}) {
  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        {accent ? (
          <AnimatedLinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.barFill, fillStyle]}
          />
        ) : (
          <Animated.View
            style={[styles.barFill, { backgroundColor: Colors.surfaceElevated }, fillStyle]}
          />
        )}
      </View>
      <Text style={[styles.barPct, { color: accent ? Colors.primary : Colors.textMuted }]}>
        {pct}%
      </Text>
    </View>
  );
}

export default function PainDatingScreen() {
  const router = useRouter();

  const progresses = BARS.map(() => useSharedValue(0));

  useEffect(() => {
    BARS.forEach((bar, i) => {
      progresses[i].value = withDelay(
        i * 150,
        withTiming(bar.pct, {
          duration: 800,
          easing: Easing.out(Easing.cubic),
        }),
      );
    });
  }, []);

  return (
    <SafeScreen>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backChevron}>‹</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>THE REALITY</Text>
      <Text style={styles.headline}>{'HOW WOMEN\nARE JUDGED TODAY'}</Text>

      <View>
        {BARS.map((bar, i) => (
          <BarRow
            key={bar.label}
            label={bar.label}
            pct={bar.pct}
            accent={bar.accent}
            progress={progresses[i]}
          />
        ))}
        <Text style={styles.source}>Source: Princeton University Social Perception Lab</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Perception Is Everything</Text>
        <Text style={styles.infoBody}>
          It's not shallow — it's human nature. Research shows physical appearance is the dominant
          factor in how others perceive your competence, warmth, and status within the first 7
          seconds.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.stickyBottom}>
        <PrimaryButton label="Next →" onPress={() => router.push('/(onboarding)/pain-halo')} />
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
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 36,
    marginBottom: 24,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  barLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    width: 140,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barPct: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
    width: 36,
  },
  source: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginTop: 24,
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
