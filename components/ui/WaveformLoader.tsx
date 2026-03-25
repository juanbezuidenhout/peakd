import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

interface WaveformLoaderProps {
  color?: string;
  size?: 'small' | 'large';
}

export function WaveformLoader({
  color = '#FFFFFF',
  size = 'small',
}: WaveformLoaderProps) {
  const bar1 = useSharedValue(0.4);
  const bar2 = useSharedValue(0.4);
  const bar3 = useSharedValue(0.4);

  const barHeight = size === 'large' ? 40 : 24;
  const barWidth = size === 'large' ? 6 : 4;
  const gap = size === 'large' ? 6 : 4;

  useEffect(() => {
    const duration = size === 'large' ? 400 : 300;
    const bounce = (d: number) =>
      withDelay(
        d,
        withRepeat(
          withSequence(
            withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
            withTiming(0.4, { duration, easing: Easing.in(Easing.ease) }),
          ),
          -1,
          false,
        ),
      );

    bar1.value = bounce(0);
    bar2.value = bounce(size === 'large' ? 150 : 100);
    bar3.value = bounce(size === 'large' ? 300 : 200);
  }, [bar1, bar2, bar3, size]);

  const style1 = useAnimatedStyle(() => ({
    transform: [{ scaleY: bar1.value }],
  }));
  const style2 = useAnimatedStyle(() => ({
    transform: [{ scaleY: bar2.value }],
  }));
  const style3 = useAnimatedStyle(() => ({
    transform: [{ scaleY: bar3.value }],
  }));

  const barStyle = {
    width: barWidth,
    height: barHeight,
    borderRadius: barWidth / 2,
    backgroundColor: color,
  };

  return (
    <View style={[styles.container, { gap, height: barHeight }]}>
      <Animated.View style={[barStyle, style1]} />
      <Animated.View style={[barStyle, style2]} />
      <Animated.View style={[barStyle, style3]} />
    </View>
  );
}

export function ScreenLoader() {
  return (
    <View style={styles.screenLoader}>
      <WaveformLoader color={Colors.textPrimary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  screenLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
