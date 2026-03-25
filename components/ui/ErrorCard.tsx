import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { PrimaryButton } from './PrimaryButton';
import { Colors } from '@/constants/colors';

interface ErrorCardProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorCard({
  message = 'Something went wrong. Try again.',
  onRetry,
}: ErrorCardProps) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.card}>
      <Text style={styles.emoji}>😔</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.buttonWrap}>
        <PrimaryButton label="Try Again" onPress={onRetry} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 28,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonWrap: {
    width: '100%',
  },
});
