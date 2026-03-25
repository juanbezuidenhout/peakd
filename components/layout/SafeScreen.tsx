import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

interface SafeScreenProps {
  children: React.ReactNode;
  className?: string;
}

export function SafeScreen({ children, className }: SafeScreenProps) {
  return (
    <SafeAreaView style={styles.safe} className={className}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

export default SafeScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
  },
});
