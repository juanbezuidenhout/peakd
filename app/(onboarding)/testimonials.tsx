import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

const AVATAR_COLORS = [Colors.primary, '#EC4899', '#F59E0B', '#10B981', Colors.primaryLight];
const AVATAR_INITIALS = ['M', 'S', 'J', 'A', 'K'];

const TESTIMONIALS = [
  {
    name: 'Mia K.',
    handle: '@miakristine',
    initial: 'M',
    avatarBg: Colors.primary,
    title: 'Literally changed my face',
    body: 'I followed Peakd\'s Dark Feminine protocol for 6 weeks and the difference is insane. My skin is glowing, my features look more defined, and I get compliments every single day.',
  },
  {
    name: 'Sophia R.',
    handle: '@sophiarose_',
    initial: 'S',
    avatarBg: '#EC4899',
    title: 'Finally found my aesthetic',
    body: 'I always knew I wanted to look a certain way but had no idea how to get there. Peakd gave me a step-by-step plan and I actually stuck to it. Best investment I\'ve made in myself.',
  },
  {
    name: 'Jade L.',
    handle: '@jadel.glow',
    initial: 'J',
    avatarBg: '#F59E0B',
    title: 'The glow-up is real',
    body: '3 months in and I look like a completely different person. Not in a fake way — in a \'I finally unlocked my potential\' way. The AI skin care coaching is actually smart.',
  },
];

export default function TestimonialsScreen() {
  const router = useRouter();

  return (
    <SafeScreen>
      <View style={styles.backRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar current={2} total={4} />
      </View>

      <Text style={styles.sectionLabel}>WHAT WOMEN SAY</Text>
      <Text style={styles.headline}>{'Join 50,000+\nwomen glowing up.'}</Text>

      <View style={styles.starsRow}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Text key={i} style={styles.starBig}>★</Text>
        ))}
        <Text style={styles.ratingText}>4.9 · 12,400 ratings</Text>
      </View>

      <View style={styles.avatarsRow}>
        {AVATAR_INITIALS.map((initial, i) => (
          <View
            key={i}
            style={[
              styles.avatarSmall,
              { backgroundColor: AVATAR_COLORS[i] },
              i > 0 && { marginLeft: -10 },
            ]}
          >
            <Text style={styles.avatarSmallText}>{initial}</Text>
          </View>
        ))}
        <Text style={styles.avatarCountText}>+50,000 women</Text>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {TESTIMONIALS.map((t, index) => (
          <Animated.View
            key={t.name}
            entering={FadeInUp.delay(index * 100).duration(400)}
            style={styles.card}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.avatar, { backgroundColor: t.avatarBg }]}>
                <Text style={styles.avatarText}>{t.initial}</Text>
              </View>
              <View style={styles.nameBlock}>
                <Text style={styles.expertName}>{t.name}</Text>
              </View>
            </View>
            <View style={styles.cardStarsRow}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Text key={i} style={styles.starSmall}>★</Text>
              ))}
            </View>
            <Text style={styles.cardTitle}>{t.title}</Text>
            <Text style={styles.cardBody}>{t.body}</Text>
          </Animated.View>
        ))}
      </ScrollView>

      <Text style={styles.disclaimer}>
        Individual results may vary. Peakd provides personalised guidance, not medical advice.
      </Text>

      <View style={styles.bottom}>
        <PrimaryButton
          label="Build my plan →"
          onPress={() => router.push('/(onboarding)/scan-prompt')}
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
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starBig: {
    fontSize: 22,
    color: Colors.primary,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  avatarCountText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
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
    color: Colors.white,
  },
  nameBlock: {
    marginLeft: 12,
  },
  expertName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardStarsRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
  },
  starSmall: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingTop: 12,
  },
  bottom: {
    paddingBottom: 24,
    paddingTop: 12,
  },
});
