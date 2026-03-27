import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ViewToken,
  ImageSourcePropType,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useSharedValue,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { setUserAesthetic } from '@/lib/storage';

interface Aesthetic {
  id: string;
  name: string;
  image: ImageSourcePropType;
}

const aesthetics: Aesthetic[] = [
  { id: '1', name: 'Adriana Lima', image: require('@/assets/aesthetics/adriana-lima.png') },
  { id: '2', name: 'Anja Winkelmann', image: require('@/assets/aesthetics/anja-winkelmann.png') },
  { id: '3', name: 'Taylor Hill', image: require('@/assets/aesthetics/taylor-hill.png') },
  { id: '4', name: 'Megan Fox', image: require('@/assets/aesthetics/megan-fox.png') },
  { id: '5', name: 'Madison Beer', image: require('@/assets/aesthetics/madison-beer.png') },
  { id: '6', name: 'Barbara Palvin', image: require('@/assets/aesthetics/barbara-palvin.png') },
  { id: '7', name: 'Angelina Jolie', image: require('@/assets/aesthetics/angelina-jolie.png') },
  { id: '8', name: 'Zoe Kravitz', image: require('@/assets/aesthetics/zoe-kravitz.png') },
  { id: '9', name: 'Sui He', image: require('@/assets/aesthetics/sui-he.png') },
  { id: '10', name: 'Yael Shelbia', image: require('@/assets/aesthetics/yael-shelbia.png') },
  { id: '11', name: 'Brooke Shields', image: require('@/assets/aesthetics/brooke-shields.png') },
  { id: '12', name: 'Sydney Thomas', image: require('@/assets/aesthetics/sydney-thomas.png') },
];

function Dot({ index, scrollX, snapInterval }: { index: number; scrollX: SharedValue<number>; snapInterval: number }) {
  const animatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollX.value,
      [(index - 1) * snapInterval, index * snapInterval, (index + 1) * snapInterval],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );

    return {
      width: interpolate(progress, [0, 1], [6, 24]),
      backgroundColor: progress > 0.5 ? Colors.primary : Colors.border,
      opacity: interpolate(progress, [0, 1], [0.4, 1]),
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

function CarouselCard({
  item,
  index,
  scrollX,
  cardWidth,
  cardMargin,
  snapInterval,
}: {
  item: Aesthetic;
  index: number;
  scrollX: SharedValue<number>;
  cardWidth: number;
  cardMargin: number;
  snapInterval: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * snapInterval,
      index * snapInterval,
      (index + 1) * snapInterval,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.88, 1, 0.88],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP,
    );

    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [12, 0, 12],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  const borderStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollX.value,
      [(index - 1) * snapInterval, index * snapInterval, (index + 1) * snapInterval],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );

    return {
      borderColor: progress > 0.5 ? Colors.primary : Colors.border,
    };
  });

  return (
    <Animated.View
      style={[
        animatedStyle,
        { width: cardWidth, height: 360, marginHorizontal: cardMargin },
      ]}
    >
      <Animated.View style={[styles.card, borderStyle]}>
        <View style={styles.cardImageWrap}>
          <Image source={item.image} style={styles.cardImage} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const AnimatedFlatList = Animated.FlatList<Aesthetic>;

export default function QuizAestheticScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedAesthetic, setSelectedAesthetic] = useState<string | null>(null);
  const scrollX = useSharedValue(0);

  const CARD_WIDTH = width * 0.72;
  const CARD_MARGIN = 10;
  const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const centered = viewableItems[0];
        setSelectedAesthetic((centered.item as Aesthetic).name);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Aesthetic; index: number }) => (
      <CarouselCard
        item={item}
        index={index}
        scrollX={scrollX}
        cardWidth={CARD_WIDTH}
        cardMargin={CARD_MARGIN}
        snapInterval={SNAP_INTERVAL}
      />
    ),
    [CARD_WIDTH, CARD_MARGIN, SNAP_INTERVAL, scrollX],
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
        <AnimatedFlatList
          horizontal
          data={aesthetics}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          snapToInterval={SNAP_INTERVAL}
          decelerationRate={0.92}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: (width - CARD_WIDTH) / 2,
          }}
          onScroll={scrollHandler}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      </View>

      <View style={styles.dotsRow}>
        {aesthetics.map((item, i) => (
          <Dot key={item.id} index={i} scrollX={scrollX} snapInterval={SNAP_INTERVAL} />
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
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 2,
  },
  cardImageWrap: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardInfo: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
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
