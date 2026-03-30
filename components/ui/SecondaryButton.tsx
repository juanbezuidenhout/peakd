import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '@/constants/colors';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
}: SecondaryButtonProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pressed.value,
      [0, 1],
      ['transparent', Colors.surface],
    ),
  }));

  const gesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      pressed.value = withTiming(1, { duration: 100 });
    })
    .onFinalize(() => {
      pressed.value = withTiming(0, { duration: 150 });
    })
    .onEnd(() => {
      runOnJS(onPress)();
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.button,
          animatedStyle,
          disabled && styles.disabled,
        ]}
      >
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 60,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
});
