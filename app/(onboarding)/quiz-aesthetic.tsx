import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ImageSourcePropType,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
  useSharedValue,
} from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
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

function Dot({ index, progressValue }: { index: number; progressValue: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const dist = Math.abs(progressValue.value - index);
    const clamped = interpolate(dist, [0, 1], [1, 0], Extrapolation.CLAMP);

    return {
      width: interpolate(clamped, [0, 1], [6, 24]),
      opacity: interpolate(clamped, [0, 1], [0.3, 1]),
      backgroundColor: clamped > 0.5 ? Colors.primary : Colors.border,
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

function CarouselCard({
  item,
  animationValue,
}: {
  item: Aesthetic;
  animationValue: SharedValue<number>;
}) {
  const cardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      animationValue.value,
      [-1, 0, 1],
      [0.85, 1, 0.85],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      animationValue.value,
      [-1, 0, 1],
      [0.4, 1, 0.4],
      Extrapolation.CLAMP,
    );

    const translateY = interpolate(
      animationValue.value,
      [-1, 0, 1],
      [20, 0, 20],
      Extrapolation.CLAMP,
    );

    const rotateZ = interpolate(
      animationValue.value,
      [-1, 0, 1],
      [-2, 0, 2],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { scale },
        { translateY },
        { rotateZ: `${rotateZ}deg` },
      ],
      opacity,
    };
  });

  const borderStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      Math.abs(animationValue.value),
      [0, 0.5],
      [1, 0],
      Extrapolation.CLAMP,
    );

    return {
      borderColor: progress > 0.5 ? Colors.primary : Colors.border,
    };
  });

  return (
    <Animated.View style={[styles.cardOuter, cardStyle]}>
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

export default function QuizAestheticScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedAesthetic, setSelectedAesthetic] = useState<string>(aesthetics[0].name);
  const progressValue = useSharedValue(0);

  const CARD_WIDTH = width * 0.74;

  const onSnapToItem = useCallback((index: number) => {
    setSelectedAesthetic(aesthetics[index].name);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

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
        <Carousel
          width={CARD_WIDTH + 20}
          height={380}
          data={aesthetics}
          loop={false}
          scrollAnimationDuration={600}
          onSnapToItem={onSnapToItem}
          onProgressChange={(_, absoluteProgress) => {
            progressValue.value = absoluteProgress;
          }}
          style={{ width }}
          renderItem={({ item, animationValue }) => (
            <CarouselCard item={item} animationValue={animationValue} />
          )}
          panGestureHandlerProps={{
            activeOffsetX: [-10, 10],
          }}
        />
      </View>

      <View style={styles.dotsRow}>
        {aesthetics.map((item, i) => (
          <Dot key={item.id} index={i} progressValue={progressValue} />
        ))}
      </View>

      <View style={styles.spacer} />

      <View style={styles.bottom}>
        <PrimaryButton
          label="Next →"
          disabled={!selectedAesthetic}
          onPress={async () => {
            await setUserAesthetic(selectedAesthetic);
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
    alignItems: 'center',
  },
  cardOuter: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
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
