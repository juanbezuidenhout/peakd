import { StyleSheet, View, ScrollView, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

const MAX_CONTENT_WIDTH = 500;

interface SafeScreenProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  scrollable?: boolean;
}

export function SafeScreen({ children, className, style, scrollable = false }: SafeScreenProps) {
  return (
    <SafeAreaView style={[styles.safe, style]} className={className}>
      {scrollable ? (
        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="always"
        >
          <View style={styles.innerScrollable}>{children}</View>
        </ScrollView>
      ) : (
        <View style={styles.inner}>{children}</View>
      )}
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
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  innerScrollable: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  scrollFlex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
