import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Share,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { ScreenLoader } from '@/components/ui/WaveformLoader';
import { Colors } from '@/constants/colors';
import { getItem, KEYS } from '@/lib/storage';
import type { FaceAnalysisResult, FeatureScores } from '@/lib/anthropic';

const FEATURE_ORDER: (keyof FeatureScores)[] = [
  'facialStructure',
  'skinQuality',
  'eyes',
  'overallHarmony',
  'lipsAndMouth',
  'nose',
  'hair',
  'eyebrows',
];

const FEATURE_DISPLAY_NAMES: Record<keyof FeatureScores, string> = {
  facialStructure: 'Facial Structure',
  skinQuality: 'Skin Quality',
  eyes: 'Eyes',
  overallHarmony: 'Overall Harmony',
  lipsAndMouth: 'Lips & Mouth',
  nose: 'Nose',
  hair: 'Hair',
  eyebrows: 'Eyebrows',
};

function getScoreLabel(score: number): { text: string; color: string } {
  if (score >= 8.0) return { text: 'Exceptional', color: Colors.success };
  if (score >= 6.5) return { text: 'Above Average', color: Colors.gold };
  if (score >= 5.0) return { text: 'Room to Glow', color: Colors.textSecondary };
  return { text: 'Early Journey', color: Colors.textSecondary };
}

function getScoreColor(score: number): string {
  if (score >= 7.5) return Colors.success;
  if (score >= 5.5) return Colors.gold;
  return Colors.error;
}

function getTop3Features(featureScores: FeatureScores) {
  return FEATURE_ORDER
    .map((key) => ({ key, ...featureScores[key] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export default function ResultsFullScreen() {
  const router = useRouter();
  const [result, setResult] = useState<FaceAnalysisResult | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [scanResult, uri, name] = await Promise.all([
        getItem<FaceAnalysisResult>(KEYS.SCAN_RESULT),
        getItem<string>(KEYS.SCAN_IMAGE_URI),
        getItem<string>(KEYS.USER_NAME),
      ]);
      if (scanResult) setResult(scanResult);
      if (uri) setImageUri(uri);
      setUserName(name ?? '');
      setLoading(false);
    })();
  }, []);

  if (loading || !result) {
    return (
      <SafeScreen>
        <ScreenLoader />
      </SafeScreen>
    );
  }

  const scoreLabel = getScoreLabel(result.glowScore);
  const top3 = getTop3Features(result.featureScores);
  let sectionIndex = 0;

  return (
    <SafeScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section 1 — Glow Card */}
        <Animated.View
          entering={FadeInUp.delay((sectionIndex++) * 100).duration(400)}
          style={styles.cardWrapper}
        >
          <View style={styles.glowCard}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.avatar} />
            )}
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.archetype}>{result.archetype.name}</Text>

            <View style={styles.divider} />

            <View style={styles.scoreRow}>
              <Text style={styles.glowScoreBig}>
                {result.glowScore.toFixed(1)}
              </Text>
              <Text style={styles.glowScoreDenom}>/10</Text>
            </View>
            <Text style={[styles.scoreLabelText, { color: scoreLabel.color }]}>
              {scoreLabel.text}
            </Text>

            <View style={styles.divider} />

            <View style={styles.top3Row}>
              {top3.map((f) => (
                <View key={f.key} style={styles.top3Item}>
                  <Text style={styles.top3Name}>
                    {FEATURE_DISPLAY_NAMES[f.key]}
                  </Text>
                  <Text style={styles.top3Score}>{f.score.toFixed(1)}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.watermark}>peakd</Text>
          </View>

          <Pressable
            style={styles.shareButton}
            onPress={() =>
              Share.share({
                message: 'I just got my Peakd glow score! ✨',
              })
            }
          >
            <Text style={styles.shareText}>Share Your Glow Card</Text>
          </Pressable>
        </Animated.View>

        {/* Section 2 — Full Feature Breakdown */}
        <Animated.View
          entering={FadeInUp.delay((sectionIndex++) * 100).duration(400)}
        >
          <Text style={styles.sectionHeader}>Feature Analysis</Text>
        </Animated.View>

        {FEATURE_ORDER.map((key) => {
          const feature = result.featureScores[key];
          const color = getScoreColor(feature.score);
          const idx = sectionIndex++;
          return (
            <Animated.View
              key={key}
              entering={FadeInUp.delay(idx * 100).duration(400)}
              style={styles.featureCard}
            >
              <View style={styles.featureTopRow}>
                <Text style={styles.featureName}>
                  {FEATURE_DISPLAY_NAMES[key]}
                </Text>
                <Text style={[styles.featureScore, { color }]}>
                  {feature.score.toFixed(1)}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(feature.score / 10) * 100}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.featureSummary}>{feature.summary}</Text>
            </Animated.View>
          );
        })}

        {/* Section 3 — Recommendations */}
        <Animated.View
          entering={FadeInUp.delay((sectionIndex++) * 100).duration(400)}
        >
          <Text style={styles.sectionHeader}>Your Glow Protocol</Text>
          <Text style={styles.sectionSubheader}>
            Personalized actions to maximize your glow
          </Text>
        </Animated.View>

        {result.recommendations.slice(0, 5).map((rec, i) => {
          const idx = sectionIndex++;
          return (
            <Animated.View
              key={i}
              entering={FadeInUp.delay(idx * 100).duration(400)}
              style={styles.recCard}
            >
              <Text style={styles.recTitle}>{rec.title}</Text>
              <View style={styles.recMetaRow}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{rec.category}</Text>
                </View>
                <Text style={styles.timeframeText}>{rec.timeframe}</Text>
              </View>
              <Text style={styles.recAction}>{rec.action}</Text>
              <Text style={styles.recScoreChange}>
                Current: {rec.currentScore.toFixed(1)} → Potential: +
                {rec.potentialGain}
              </Text>
            </Animated.View>
          );
        })}

        {/* Section 4 — Personal Note */}
        <Animated.View
          entering={FadeInUp.delay((sectionIndex++) * 100).duration(400)}
          style={styles.noteCard}
        >
          <Text style={styles.noteLabel}>A NOTE FOR YOU</Text>
          <Text style={styles.noteText}>{result.personalNote}</Text>
        </Animated.View>

        {/* Section 5 — Bottom Actions */}
        <Animated.View
          entering={FadeInUp.delay((sectionIndex++) * 100).duration(400)}
          style={styles.bottomActions}
        >
          <PrimaryButton
            label="Start My 90-Day Plan →"
            onPress={() => router.replace('/(tabs)/home')}
          />
          <View style={{ marginTop: 12 }}>
            <SecondaryButton
              label="Retake Scan"
              onPress={() => router.push('/(tabs)/scan')}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },

  // Section 1 — Glow Card
  cardWrapper: {
    marginHorizontal: 24,
    marginTop: 24,
  },
  glowCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
    textAlign: 'center',
  },
  archetype: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
    marginTop: 4,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
    width: '100%',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  glowScoreBig: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  glowScoreDenom: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  scoreLabelText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  top3Row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  top3Item: {
    alignItems: 'center',
  },
  top3Name: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  top3Score: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  watermark: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  shareButton: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 50,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignSelf: 'center',
    marginTop: 16,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },

  // Section 2 — Feature Breakdown
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 32,
    marginHorizontal: 24,
  },
  featureCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 12,
  },
  featureTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  featureScore: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    width: '100%',
    marginTop: 10,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  featureSummary: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 10,
  },

  // Section 3 — Recommendations
  sectionSubheader: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginHorizontal: 24,
  },
  recCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 12,
  },
  recTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  recMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  categoryPill: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
    textTransform: 'capitalize',
  },
  timeframeText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  recAction: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 8,
  },
  recScoreChange: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 8,
  },

  // Section 4 — Personal Note
  noteCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 32,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 1.5,
  },
  noteText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: 8,
  },

  // Section 5 — Bottom Actions
  bottomActions: {
    marginTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
});
