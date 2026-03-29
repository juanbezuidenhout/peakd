import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '@/constants/colors';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function WaveformLoader() {
  const bar1 = useSharedValue(0.4);
  const bar2 = useSharedValue(0.4);
  const bar3 = useSharedValue(0.4);

  useEffect(() => {
    const bounce = (delay: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }),
            withTiming(0.4, { duration: 300, easing: Easing.in(Easing.ease) }),
          ),
          -1,
          false,
        ),
      );

    bar1.value = bounce(0);
    bar2.value = bounce(100);
    bar3.value = bounce(200);
  }, [bar1, bar2, bar3]);

  const style1 = useAnimatedStyle(() => ({ transform: [{ scaleY: bar1.value }] }));
  const style2 = useAnimatedStyle(() => ({ transform: [{ scaleY: bar2.value }] }));
  const style3 = useAnimatedStyle(() => ({ transform: [{ scaleY: bar3.value }] }));

  return (
    <View style={styles.waveContainer}>
      <Animated.View style={[styles.waveBar, style1]} />
      <Animated.View style={[styles.waveBar, style2]} />
      <Animated.View style={[styles.waveBar, style3]} />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: PrimaryButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const gesture = Gesture.Tap()
    .enabled(!disabled && !loading)
    .onBegin(() => {
      scale.value = withTiming(0.98, { duration: 100 });
      opacity.value = withTiming(0.85, { duration: 100 });
    })
    .onFinalize(() => {
      scale.value = withTiming(1, { duration: 150 });
      opacity.value = withTiming(1, { duration: 150 });
    })
    .onEnd(() => {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      runOnJS(onPress)();
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.wrapper,
          animatedStyle,
          disabled && styles.disabled,
        ]}
      >
        <View style={styles.inner}>
          {loading ? (
            <WaveformLoader />
          ) : (
            <Text style={styles.label}>{label}</Text>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.navy,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
  },
  waveBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});
