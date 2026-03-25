import { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { setUserGlowLevel } from '@/lib/storage';

const CARDS = [
  { id: 'natural', emoji: '🌿', label: 'Natural', sublabel: 'Lifestyle & skincare only' },
  { id: 'soft-maxxing', emoji: '✨', label: 'Soft-maxxing', sublabel: 'Makeup, styling & habits' },
  { id: 'hard-maxxing', emoji: '💎', label: 'Hard-maxxing', sublabel: 'Non-invasive procedures' },
  { id: 'experimental', emoji: '⚡', label: 'Experimental', sublabel: 'Cutting-edge & trending' },
] as const;

const DISCLAIMER_IDS = new Set(['hard-maxxing', 'experimental']);

export default function QuizGlowScreen() {
  const router = useRouter();
  const [selectedGlow, setSelectedGlow] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  function handleCardPress(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGlow(id);
    if (DISCLAIMER_IDS.has(id)) {
      setModalVisible(true);
    }
  }

  return (
    <SafeScreen>
      <View style={styles.backRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar current={4} total={8} />
      </View>

      <Text style={styles.stepLabel}>STEP 4 OF 8</Text>
      <Text style={styles.headline}>{'What are you\nopen to?'}</Text>
      <Text style={styles.subtext}>
        No judgment. Be honest with yourself. This calibrates your plan.
      </Text>

      <View style={styles.grid}>
        {CARDS.map((card) => {
          const selected = selectedGlow === card.id;
          return (
            <Pressable
              key={card.id}
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => handleCardPress(card.id)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.emoji}>{card.emoji}</Text>
                <View style={[styles.circle, selected && styles.circleSelected]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </View>
              <View style={styles.cardSpacer} />
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardSublabel}>{card.sublabel}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={styles.skipWrap}
        onPress={() => router.push('/(onboarding)/quiz-aesthetic')}
        hitSlop={8}
      >
        <Text style={styles.skipText}>Skip this step</Text>
      </Pressable>

      <View style={styles.spacer} />

      <View style={styles.bottom}>
        <PrimaryButton
          label="Next →"
          disabled={!selectedGlow}
          onPress={async () => {
            await setUserGlowLevel(selectedGlow!);
            router.push('/(onboarding)/quiz-aesthetic');
          }}
        />
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetIcon}>🩺</Text>
            <Text style={styles.sheetTitle}>Just so you know</Text>
            <Text style={styles.sheetBody}>
              Peakd's recommendations are for non-surgical enhancement only.
              {'\n'}For medical procedures, always consult a qualified professional.
            </Text>
            <View style={styles.sheetButton}>
              <PrimaryButton label="I understand" onPress={() => setModalVisible(false)} />
            </View>
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
    color: Colors.textSecondary,
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
    width: '47%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  emoji: {
    fontSize: 28,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSelected: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
  },
  checkmark: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardSpacer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardSublabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  skipWrap: {
    alignItems: 'center',
    marginTop: 16,
  },
  skipText: {
    fontSize: 13,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  spacer: {
    flex: 1,
  },
  bottom: {
    paddingBottom: 24,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
  },
  sheetIcon: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  sheetBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },
  sheetButton: {
    marginTop: 24,
  },
});
