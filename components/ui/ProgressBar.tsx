import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

interface ProgressBarProps {
  total?: number;
  current: number;
}

function Segment({ active, index }: { active: boolean; index: number }) {
  const opacity = useSharedValue(0);
  const backgroundColor = useSharedValue(
    active ? Colors.primary : Colors.border,
  );

  useEffect(() => {
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 300 }));
    backgroundColor.value = withTiming(
      active ? Colors.primary : Colors.border,
      { duration: 300 },
    );
  }, [active, opacity, backgroundColor, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.segment, animatedStyle]} />;
}

export function ProgressBar({ total = 5, current }: ProgressBarProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, i) => (
        <Segment key={i} active={i < current} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});
