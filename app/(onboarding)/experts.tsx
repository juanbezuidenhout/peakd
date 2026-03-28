import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

type ExpertKind = 'person' | 'institution';

interface Expert {
  kind: ExpertKind;
  name: string;
  handle?: string;
  initial: string;
  brandColor: string;
  image?: ImageSourcePropType;
  quote: string;
  source?: string;
}

const EXPERTS: Expert[] = [
  {
    kind: 'person',
    name: 'Dr. Mike Mew',
    handle: '@mewingbymikemew',
    initial: 'M',
    brandColor: '#374151',
    image: require('@/assets/experts/mike-mew.png'),
    quote:
      'Although there\'s a very strong genetic influence on how you grow and how you look, clearly there are also some environmental influences and the environmental influences can be affected.',
  },
  {
    kind: 'institution',
    name: 'Harvard T.H. Chan School of Public Health',
    initial: 'H',
    brandColor: '#A51C30',
    image: require('@/assets/experts/harvard.png'),
    quote:
      'Facial bone structure and development are influenced by environmental factors including posture, breathing patterns, and muscular habits during critical growth periods.',
    source: '(2021) Craniofacial Development Research',
  },
  {
    kind: 'person',
    name: 'Dr. Andrew Huberman',
    handle: '@hubermanlab',
    initial: 'A',
    brandColor: '#374151',
    image: require('@/assets/experts/andrew-huberman.png'),
    quote: 'Facial structure is something that can be modified.',
  },
  {
    kind: 'institution',
    name: 'Stanford Medicine',
    initial: 'S',
    brandColor: '#8C1515',
    image: require('@/assets/experts/stanford.png'),
    quote:
      'Physical attractiveness significantly impacts social perception, career opportunities, and overall quality of life across multiple domains.',
    source: '(2022) Social Psychology and Medicine',
  },
  {
    kind: 'person',
    name: 'Bryan Johnson',
    handle: '@bryanjohnson_',
    initial: 'B',
    brandColor: '#374151',
    image: require('@/assets/experts/bryan-johnson.png'),
    quote:
      "Pursuing 'hotness' and pursuing longevity are closely related in principle.",
  },
  {
    kind: 'institution',
    name: 'Yale School of Medicine',
    initial: 'Y',
    brandColor: '#00356B',
    image: require('@/assets/experts/yale.png'),
    quote:
      'Early intervention with lifestyle and postural modifications can significantly influence craniofacial development and aesthetic outcomes in young adults.',
    source: '(2023) Orthodontics & Craniofacial Research',
  },
];

function Avatar({ expert }: { expert: Expert }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (expert.image && !imgFailed) {
    if (expert.kind === 'institution') {
      return (
        <View style={styles.institutionAvatarContainer}>
          <Image
            source={expert.image}
            style={styles.institutionAvatarImage}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        </View>
      );
    }
    return (
      <Image
        source={expert.image}
        style={styles.avatarImage}
        resizeMode="cover"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <View style={[styles.avatar, { backgroundColor: expert.brandColor }]}>
      <Text
        style={[
          styles.avatarText,
          expert.kind === 'institution' && styles.avatarTextInstitution,
        ]}
      >
        {expert.initial}
      </Text>
    </View>
  );
}

export default function ExpertsScreen() {
  const router = useRouter();

  return (
    <SafeScreen>
      <View style={styles.backRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backChevron}>←</Text>
        </Pressable>
        <View style={styles.progressInline}>
          <ProgressBar current={2} total={3} />
        </View>
      </View>

      <Text style={styles.headline}>
        {'Backed by experts.\nDesigned for you.'}
      </Text>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {EXPERTS.map((expert, index) => (
          <Animated.View
            key={expert.name}
            entering={FadeInUp.delay(index * 80).duration(400)}
            style={styles.card}
          >
            <View style={styles.cardTopRow}>
              <Avatar expert={expert} />
              <View style={styles.nameBlock}>
                <Text style={styles.expertName}>{expert.name}</Text>
                {expert.handle && (
                  <Text style={styles.handle}>{expert.handle}</Text>
                )}
              </View>
            </View>

            <Text style={styles.quote}>"{expert.quote}"</Text>

            {expert.source && (
              <Text style={styles.source}>{expert.source}</Text>
            )}
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <PrimaryButton
          label="Next"
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
    gap: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  backChevron: {
    fontSize: 22,
    color: Colors.textPrimary,
  },
  progressInline: {
    flex: 1,
  },
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 38,
    marginTop: 20,
    marginBottom: 24,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A2E',
  },
  institutionAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  institutionAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarTextInstitution: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'serif',
  },
  nameBlock: {
    marginLeft: 12,
    flex: 1,
  },
  expertName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  handle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quote: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 21,
  },
  source: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  bottom: {
    paddingBottom: 24,
    paddingTop: 12,
  },
});
