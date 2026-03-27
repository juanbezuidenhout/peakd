import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ViewToken,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { setUserAesthetic } from '@/lib/storage';

interface Aesthetic {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

const aesthetics: Aesthetic[] = [
  { id: '1', name: 'Dark Feminine', emoji: '🌙', description: 'Dramatic, bold, magnetic' },
  { id: '2', name: 'Clean Girl', emoji: '🤍', description: 'Minimal, dewy, effortless' },
  { id: '3', name: 'Ethereal', emoji: '🦋', description: 'Soft, angelic, otherworldly' },
  { id: '4', name: 'Siren', emoji: '🔥', description: 'Alluring, confident, powerful' },
  { id: '5', name: 'Edgy', emoji: '⚡', description: 'Sharp, alternative, cool' },
  { id: '6', name: 'Classic Beauty', emoji: '👑', description: 'Timeless, polished, refined' },
];

function Dot({ active }: { active: boolean }) {
  const width = useSharedValue(active ? 20 : 6);

  width.value = withTiming(active ? 20 : 6, { duration: 200 });

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: active ? Colors.primary : Colors.border },
        animatedStyle,
      ]}
    />
  );
}

export default function QuizAestheticScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedAesthetic, setSelectedAesthetic] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const CARD_WIDTH = width * 0.72;
  const CARD_MARGIN = 10;
  const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const centered = viewableItems[0];
        setActiveIndex(centered.index ?? 0);
        setSelectedAesthetic((centered.item as Aesthetic).name);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Aesthetic }) => {
      const isSelected = selectedAesthetic === item.name;
      return (
        <View
          style={[
            styles.card,
            {
              width: CARD_WIDTH,
              marginHorizontal: CARD_MARGIN,
              borderColor: isSelected ? Colors.primary : Colors.border,
            },
          ]}
        >
          <View style={styles.cardImage}>
            <Text style={styles.cardEmoji}>{item.emoji}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
        </View>
      );
    },
    [CARD_WIDTH, CARD_MARGIN, selectedAesthetic],
  );

  return (
    <SafeScreen>
      <View style={styles.backRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar current={6} total={8} />
      </View>

      <Text style={styles.stepLabel}>STEP 6 OF 8</Text>
      <Text style={styles.headline}>{"Who's your\ndream aesthetic?"}</Text>
      <Text style={styles.subtext}>Your starting point, not a limit.</Text>

      <View style={styles.carouselWrap}>
        <FlatList
          horizontal
          data={aesthetics}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          snapToInterval={SNAP_INTERVAL}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: (width - CARD_WIDTH) / 2,
          }}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      </View>

      <View style={styles.dotsRow}>
        {aesthetics.map((item, i) => (
          <Dot key={item.id} active={i === activeIndex} />
        ))}
      </View>

      <View style={styles.spacer} />

      <View style={styles.bottom}>
        <PrimaryButton
          label="Next →"
          disabled={!selectedAesthetic}
          onPress={async () => {
            await setUserAesthetic(selectedAesthetic!);
            router.push('/(onboarding)/commitment');
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
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 0,
  },
  carouselWrap: {
    marginTop: 24,
    marginHorizontal: -20,
  },
  card: {
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 2,
  },
  cardImage: {
    flex: 3,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 64,
  },
  cardInfo: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 16,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  spacer: {
    flex: 1,
  },
  bottom: {
    paddingBottom: 24,
  },
});
