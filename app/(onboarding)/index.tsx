import { View, Text, StyleSheet, ImageBackground, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.55;

export default function HeroScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <ImageBackground
        source={require('@/assets/splash-icon.png')}
        style={styles.image}
        resizeMode="cover"
      >
        <View style={styles.logoRow}>
          <Text style={styles.logoPeak}>peak</Text>
          <Text style={styles.logoD}>d</Text>
        </View>

        <LinearGradient
          colors={['transparent', Colors.background]}
          style={styles.gradient}
        />
      </ImageBackground>

      <View style={styles.bottom}>
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <Text style={styles.label}>AI BEAUTY INTELLIGENCE</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(350).duration(500)}>
          <Text style={styles.headline}>{'Become Your\nMost Beautiful\nSelf'}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(500)}>
          <Text style={styles.subtext}>
            Get your beauty archetype, glow score, and 30-day soft-maxxing plan in 60 seconds.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(650).duration(500)}>
          <PrimaryButton
            label="Get Started →"
            onPress={() => router.push('/(onboarding)/pain-dating')}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(800).duration(500)}>
          <Text style={styles.socialProof}>50,000+ women already glowing up</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  image: {
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  logoRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 56,
    left: 20,
  },
  logoPeak: {
    fontWeight: '800',
    fontSize: 22,
    color: '#FFFFFF',
  },
  logoD: {
    fontWeight: '800',
    fontSize: 22,
    color: Colors.primary,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottom: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headline: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 46,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtext: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 32,
  },
  socialProof: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 16,
    textAlign: 'center',
  },
});
