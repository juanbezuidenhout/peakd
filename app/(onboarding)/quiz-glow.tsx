import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { setUserGlowLevel } from '@/lib/storage';

const CYAN = '#22D3EE';

interface CardOption {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
}

const CARDS: CardOption[] = [
  { id: 'natural', emoji: '🌿', title: 'Natural', subtitle: 'Lifestyle & skincare only' },
  { id: 'softmaxxing', emoji: '✨', title: 'Soft-maxxing', subtitle: 'Makeup, styling & habits' },
  { id: 'hardmaxxing', emoji: '💎', title: 'Hard-maxxing', subtitle: 'Non-invasive procedures' },
  { id: 'experimental', emoji: '⚡', title: 'Experimental', subtitle: 'Cutting-edge & trending' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GlowCard({
  card,
  isSelected,
  onToggle,
}: {
  card: CardOption;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const scale = useSharedValue(1);
  const borderProgress = useSharedValue(isSelected ? 1 : 0);

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.97, { duration: 80 }),
      withTiming(1, { duration: 80 }),
    );
    borderProgress.value = withTiming(isSelected ? 0 : 1, { duration: 200 });
    onToggle();
  }, [isSelected, onToggle, scale, borderProgress]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: borderProgress.value > 0.5 ? CYAN : '#2A2A2A',
    ...(borderProgress.value > 0.5 && Platform.OS === 'ios'
      ? {
          shadowColor: CYAN,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3 * borderProgress.value,
          shadowRadius: 12,
        }
      : {}),
  }));

  return (
    <AnimatedPressable
      style={[styles.card, cardAnimStyle]}
      onPress={handlePress}
    >
      <View style={styles.cardTopRow}>
        <Text style={styles.cardEmoji}>{card.emoji}</Text>
        <View style={[styles.radio, isSelected && styles.radioSelected]}>
          {isSelected && <Text style={styles.radioCheck}>✓</Text>}
        </View>
      </View>

      <View style={styles.cardBottomArea}>
        <Text style={styles.cardTitle}>{card.title}</Text>
        <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
      </View>
    </AnimatedPressable>
  );
}

export default function QuizGlowScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleCard = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  return (
    <SafeScreen>
      <View style={styles.backRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar current={5} total={8} />
      </View>

      <Text style={styles.stepLabel}>STEP 5 OF 8</Text>
      <Text style={styles.headline}>{'What are you\nopen to?'}</Text>
      <Text style={styles.subtext}>
        No judgment. Be honest with yourself. This calibrates your plan.
      </Text>

      <View style={styles.grid}>
        {CARDS.map((card) => (
          <GlowCard
            key={card.id}
            card={card}
            isSelected={selected.includes(card.id)}
            onToggle={() => toggleCard(card.id)}
          />
        ))}
      </View>

      <View style={styles.spacer} />

      <View style={styles.bottom}>
        <PrimaryButton
          label="Next →"
          disabled={selected.length === 0}
          onPress={async () => {
            await setUserGlowLevel(JSON.stringify(selected));
            router.push('/(onboarding)/quiz-aesthetic');
          }}
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  backChevron: {
    fontSize: 28,
    color: Colors.textSecondary,
  },
  progressWrap: {
    paddingTop: 20,
    marginBottom: 32,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 40,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 22,
    marginBottom: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  card: {
    width: '48%',
    height: 160,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    padding: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardEmoji: {
    fontSize: 28,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: CYAN,
    borderWidth: 0,
  },
  radioCheck: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: -1,
  },
  cardBottomArea: {
    marginTop: 'auto' as any,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: '#888888',
    marginTop: 3,
  },
  spacer: {
    flex: 1,
  },
  bottom: {
    paddingBottom: 24,
  },
});
