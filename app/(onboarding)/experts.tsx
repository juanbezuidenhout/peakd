import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

const EXPERTS = [
  {
    name: 'Dr. Whitney Bowe',
    handle: '@drwhitneybowe',
    initial: 'D',
    avatarBg: Colors.primary,
    quote:
      'The skin-brain connection is real. When you look good, you feel good — and that confidence loop is scientifically measurable.',
    source: 'Journal of Dermatology, 2023',
  },
  {
    name: 'Dr. Andrew Huberman',
    handle: '@hubermanlab',
    initial: 'D',
    avatarBg: Colors.surfaceElevated,
    quote:
      'Facial structure and skin quality are far more malleable than most people realise. The right protocol, consistently applied, produces remarkable results.',
    source: 'Stanford Neuroscience Lab',
  },
  {
    name: 'Harvard T.H. Chan',
    handle: '@HarvardChan',
    initial: 'H',
    avatarBg: Colors.primary,
    quote:
      'Appearance-based confidence significantly impacts social outcomes, career trajectory, and mental health in young women.',
    source: 'Harvard Public Health, 2022',
  },
  {
    name: 'Princeton University',
    handle: '@Princeton',
    initial: 'P',
    avatarBg: Colors.surfaceElevated,
    quote:
      'Judgements of competence based on facial appearance predicted outcomes more accurately than chance in 70% of cases studied.',
    source: 'Princeton Social Perception Lab, 2021',
  },
];

export default function ExpertsScreen() {
  const router = useRouter();

  return (
    <SafeScreen>
      <View style={styles.backRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar current={1} total={4} />
      </View>

      <Text style={styles.sectionLabel}>BACKED BY SCIENCE</Text>
      <Text style={styles.headline}>{'Backed by experts.\nDesigned for you.'}</Text>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {EXPERTS.map((expert, index) => (
          <Animated.View
            key={expert.name}
            entering={FadeInUp.delay(index * 100).duration(400)}
            style={styles.card}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.avatar, { backgroundColor: expert.avatarBg }]}>
                <Text style={styles.avatarText}>{expert.initial}</Text>
              </View>
              <View style={styles.nameBlock}>
                <Text style={styles.expertName}>{expert.name}</Text>
                <Text style={styles.handle}>{expert.handle}</Text>
              </View>
            </View>
            <Text style={styles.quote}>{expert.quote}</Text>
            <Text style={styles.source}>{expert.source}</Text>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <PrimaryButton
          label="Next →"
          onPress={() => router.push('/(onboarding)/testimonials')}
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 34,
    marginTop: 24,
    marginBottom: 24,
  },
  scrollArea: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nameBlock: {
    marginLeft: 12,
  },
  expertName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  handle: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
  quote: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  source: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 8,
  },
  bottom: {
    paddingBottom: 24,
    paddingTop: 12,
  },
});
