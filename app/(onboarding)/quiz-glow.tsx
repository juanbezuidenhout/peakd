import { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { setUserGlowLevel } from '@/lib/storage';

const CYAN = Colors.primary;

function DumbbellIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={9} width={4} height={6} rx={1} fill="#fff" />
      <Rect x={18} y={9} width={4} height={6} rx={1} fill="#fff" />
      <Rect x={5} y={10.5} width={3} height={3} rx={0.5} fill="#fff" />
      <Rect x={16} y={10.5} width={3} height={3} rx={0.5} fill="#fff" />
      <Rect x={8} y={11} width={8} height={2} rx={0.5} fill="#fff" />
    </Svg>
  );
}

function DropletIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5c0 0-7 8.5-7 13a7 7 0 0 0 14 0c0-4.5-7-13-7-13z"
        fill="#fff"
      />
    </Svg>
  );
}

function ScissorsIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={6} cy={6} r={3} />
      <Circle cx={6} cy={18} r={3} />
      <Line x1={20} y1={4} x2={8.12} y2={15.88} />
      <Line x1={14.47} y1={14.48} x2={20} y2={20} />
      <Line x1={8.12} y1={8.12} x2={12} y2={12} />
    </Svg>
  );
}

function HammerIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 15l4-4" />
      <Path d="M2 21l4.5-4.5" />
      <Path d="M11 10l1.5-1.5" />
      <Path d="M13.5 7.5L19 2l3 3-5.5 5.5" />
      <Path d="M10 13l-7 7" />
    </Svg>
  );
}

function StethoscopeIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4.8 2.3A2 2 0 0 0 3 4.5v3a5 5 0 0 0 5 5 1 1 0 0 0 1-1V4.5A2 2 0 0 0 7.2 2.3" />
      <Path d="M14.8 2.3A2 2 0 0 0 13 4.5v3a5 5 0 0 1-5 5" />
      <Path d="M16.8 2.3A2 2 0 0 1 19 4.5v3a5 5 0 0 1-5 5 1 1 0 0 1-1-1V4.5a2 2 0 0 1 2.2-2.2" />
      <Path d="M19 7.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
      <Path d="M19 10.5V14a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5v-1" />
    </Svg>
  );
}

const ICON_MAP: Record<string, () => React.JSX.Element> = {
  natural: DumbbellIcon,
  softmaxxing: DropletIcon,
  hardmaxxing: ScissorsIcon,
  experimental: HammerIcon,
};

const DISCLAIMER_IDS = new Set(['hardmaxxing', 'experimental']);

interface CardOption {
  id: string;
  title: string;
  subtitle: string;
}

const CARDS: CardOption[] = [
  { id: 'natural', title: 'Natural', subtitle: 'Lifestyle-based improvement' },
  { id: 'softmaxxing', title: 'Softmaxxing', subtitle: 'Non-surgical enhancement' },
  { id: 'hardmaxxing', title: 'Hardmaxxing', subtitle: 'Surgical enhancement' },
  { id: 'experimental', title: 'Experimental', subtitle: 'Unverified cutting-edge methods' },
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
  const IconComponent = ICON_MAP[card.id];
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
    borderColor: borderProgress.value > 0.5 ? CYAN : Colors.border,
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
        <View style={styles.cardIcon}>
          {IconComponent && <IconComponent />}
        </View>
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
  const [disclaimerVisible, setDisclaimerVisible] = useState(false);
  const pendingId = useRef<string | null>(null);

  const toggleCard = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isDeselecting = selected.includes(id);
    if (isDeselecting) {
      setSelected((prev) => prev.filter((x) => x !== id));
      return;
    }

    if (DISCLAIMER_IDS.has(id)) {
      pendingId.current = id;
      setDisclaimerVisible(true);
      return;
    }

    setSelected((prev) => [...prev, id]);
  }, [selected]);

  const handleAcceptDisclaimer = useCallback(() => {
    if (pendingId.current) {
      setSelected((prev) => [...prev, pendingId.current!]);
      pendingId.current = null;
    }
    setDisclaimerVisible(false);
  }, []);

  const handleCancelDisclaimer = useCallback(() => {
    pendingId.current = null;
    setDisclaimerVisible(false);
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

      <Modal
        visible={disclaimerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDisclaimer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <StethoscopeIcon />
            </View>

            <Text style={styles.modalTitle}>Medical Disclaimer</Text>

            <Text style={styles.modalBody}>
              Surgical and experimental looksmaxxing recommendations provided by
              Peakd are AI-generated and for informational purposes only. They are
              not a substitute for professional medical advice, diagnosis, or
              treatment.
            </Text>
            <Text style={styles.modalBody}>
              Always consult a licensed healthcare provider before pursuing any
              surgical or experimental procedure. Peakd assumes no liability for
              actions taken based on app content. By proceeding, you acknowledge
              and accept these terms.
            </Text>

            <Pressable style={styles.modalAcceptBtn} onPress={handleAcceptDisclaimer}>
              <Text style={styles.modalAcceptText}>I Understand & Accept</Text>
            </Pressable>

            <Pressable onPress={handleCancelDisclaimer} hitSlop={12}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardIcon: {
    width: 32,
    height: 32,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  spacer: {
    flex: 1,
  },
  bottom: {
    paddingBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  modalIconWrap: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalAcceptBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#3A3A3A',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  modalAcceptText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalCancelText: {
    fontSize: 14,
    color: '#888888',
    paddingVertical: 4,
  },
});
