import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BottomSheet } from './BottomSheet';
import { getItem, KEYS } from '@/lib/storage';
import { Colors } from '@/constants/colors';
import type { FaceAnalysisResult, Recommendation, FeatureScores } from '@/lib/anthropic';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RoadmapSheetProps {
  visible: boolean;
  onClose: () => void;
}

interface PhaseData {
  phase: 1 | 2 | 3;
  title: string;
  subtitle: string;
  recommendations: Recommendation[];
}

interface ClinicalPhase {
  phase: 1 | 2 | 3;
  title: string;
  action: string;
  features: string[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CLINICAL_PHASES: Record<number, { title: string; action: string }> = {
  1: { title: 'Research & Education', action: 'Research & vet specialists for' },
  2: { title: 'Consultation Phase', action: 'Attend consultations with' },
  3: { title: 'Decision & Planning', action: 'Finalize treatment plan for' },
};

// ─── Icons ──────────────────────────────────────────────────────────────────

function SparkleIcon({ color = Colors.primary }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L14 9L21 12L14 15L12 22L10 15L3 12L10 9L12 2Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LeafIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.82 0 3.53-.5 5-1.35-2.5-1.5-4.5-4-5.5-7.15 1-3.15 3-5.65 5.5-7.15C15.53 2.5 13.82 2 12 2z" stroke={Colors.success} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TargetIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={Colors.primary} strokeWidth={1.5} />
      <Circle cx="12" cy="12" r="6" stroke={Colors.primary} strokeWidth={1.5} />
      <Circle cx="12" cy="12" r="2" stroke={Colors.primary} strokeWidth={1.5} />
    </Svg>
  );
}

function CrownIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M5 16L3 8L8 10L12 4L16 10L21 8L19 16H5Z" stroke={Colors.gold} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 16V19C5 19.55 5.45 20 6 20H18C18.55 20 19 19.55 19 19V16" stroke={Colors.gold} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FlaskIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 3L9 10C9 12 8 13 7 14L4 18C3 19 3 20 4 21L20 21C21 20 21 19 20 18L17 14C16 13 15 12 15 10L15 3" stroke={Colors.gold} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 3L16 3" stroke={Colors.gold} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={Colors.textSecondary} strokeWidth={1.5} />
      <Path d="M12 6V12L16 14" stroke={Colors.textSecondary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 6L18 18" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────

function Badge({ text, variant }: { text: string; variant: 'natural' | 'soft-maxxing' | 'clinical' | 'default' }) {
  const colors = {
    natural: { bg: 'rgba(52,199,89,0.1)', text: Colors.success, border: 'rgba(52,199,89,0.2)' },
    'soft-maxxing': { bg: Colors.primaryBg, text: Colors.primary, border: 'rgba(74,144,217,0.2)' },
    clinical: { bg: 'rgba(255,184,0,0.1)', text: Colors.gold, border: 'rgba(255,184,0,0.25)' },
    default: { bg: Colors.glassBackground, text: Colors.textSecondary, border: Colors.borderLight },
  };
  const c = colors[variant];

  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{text}</Text>
    </View>
  );
}

function RecommendationCard({ recommendation, index }: { recommendation: Recommendation; index: number }) {
  const getVariant = (): Parameters<typeof Badge>[0]['variant'] => {
    if (recommendation.category === 'natural') return 'natural';
    if (recommendation.category === 'soft-maxxing') return 'soft-maxxing';
    return 'default';
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{recommendation.title}</Text>
        <Badge text={recommendation.category} variant={getVariant()} />
      </View>
      <Text style={styles.cardAction}>{recommendation.action}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.timeBadge}>
          <ClockIcon />
          <Text style={styles.timeText}>{recommendation.timeframe}</Text>
        </View>
        {recommendation.potentialGain && (
          <Text style={styles.potentialText}>+{recommendation.potentialGain} pts</Text>
        )}
      </View>
    </Animated.View>
  );
}

function ClinicalCard({ phase, features }: { phase: ClinicalPhase; features: string[] }) {
  const uniqueFeatures = [...new Set(features)].slice(0, 3);

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.clinicalCard}>
      <View style={styles.clinicalHeader}>
        <View style={styles.clinicalIconBg}>
          {phase.phase === 1 ? <FlaskIcon /> : phase.phase === 2 ? <CrownIcon /> : <SparkleIcon color={Colors.gold} />}
        </View>
        <View style={styles.clinicalTitleRow}>
          <Text style={styles.clinicalTitle}>{phase.title}</Text>
          <View style={styles.clinicalBadge}>
            <Text style={styles.clinicalBadgeText}>Clinical Track</Text>
          </View>
        </View>
      </View>
      <Text style={styles.clinicalAction}>
        {phase.action} {uniqueFeatures.join(', ')}
      </Text>
      <View style={styles.clinicalPhaseRow}>
        <Text style={styles.clinicalPhaseText}>Phase {phase.phase} of 3</Text>
      </View>
    </Animated.View>
  );
}

function PhaseSection({ data, clinicalFeatures }: { data: PhaseData; clinicalFeatures: string[] }) {
  const getPhaseIcon = () => {
    switch (data.phase) {
      case 1:
        return <LeafIcon />;
      case 2:
        return <TargetIcon />;
      case 3:
        return <CrownIcon />;
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(data.phase * 100).duration(400)} style={styles.phaseSection}>
      <View style={styles.phaseHeader}>
        <View style={styles.phaseIconBg}>{getPhaseIcon()}</View>
        <View style={styles.phaseTitleGroup}>
          <Text style={styles.phaseTitle}>{data.title}</Text>
          <Text style={styles.phaseSubtitle}>{data.subtitle}</Text>
        </View>
        <View style={styles.phaseNumberBadge}>
          <Text style={styles.phaseNumberText}>{data.phase}</Text>
        </View>
      </View>
      <View style={styles.cardsContainer}>
        {data.recommendations.map((rec, idx) => (
          <RecommendationCard key={`${rec.title}-${idx}`} recommendation={rec} index={idx} />
        ))}
        {data.recommendations.length === 0 && (
          <Text style={styles.emptyText}>No recommendations for this phase. Continue your current routine.</Text>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function RoadmapSheet({ visible, onClose }: RoadmapSheetProps) {
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState<FaceAnalysisResult | null>(null);
  const [glowLevel, setGlowLevel] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    const [result, level] = await Promise.all([
      getItem<FaceAnalysisResult>(KEYS.SCAN_RESULT),
      getItem<string>(KEYS.USER_GLOW_LEVEL),
    ]);
    setScanResult(result);
    setGlowLevel(level);
    setLoading(false);
  };

  const isClinical = useMemo(() => {
    if (!glowLevel) return false;
    const level = glowLevel.toLowerCase();
    return level.includes('hardmaxxing') || level.includes('experimental');
  }, [glowLevel]);

  const getLowestScoreFeatures = useCallback((scores: FeatureScores): string[] => {
    const entries = Object.entries(scores)
      .map(([key, value]) => ({ key, score: value.score }))
      .sort((a, b) => a.score - b.score);
    return entries.slice(0, 3).map((e) => e.key);
  }, []);

  const phases = useMemo((): PhaseData[] => {
    if (!scanResult?.recommendations) {
      return [
        { phase: 1, title: 'Phase 1: Foundation', subtitle: 'Days 1-30', recommendations: [] },
        { phase: 2, title: 'Phase 2: Targeted Correction', subtitle: 'Days 31-60', recommendations: [] },
        { phase: 3, title: 'Phase 3: Advanced & Maintenance', subtitle: 'Days 61-90', recommendations: [] },
      ];
    }

    const { recommendations, featureScores } = scanResult;
    const lowestFeatures = getLowestScoreFeatures(featureScores);

    // Filter clinical recommendations
    const nonClinicalRecs = recommendations.filter(
      (r) => r.category !== 'hard-maxxing' && r.category !== 'experimental'
    );

    // Phase 1: Natural + Soft-maxxing
    const phase1Recs = nonClinicalRecs.filter(
      (r) => r.category === 'natural' || r.category === 'soft-maxxing'
    );

    // Phase 2: Remaining soft-maxxing, prioritized by lowest scores
    const phase2Recs = nonClinicalRecs
      .filter((r) => r.category === 'soft-maxxing' && !phase1Recs.includes(r))
      .sort((a, b) => {
        const aIsLow = lowestFeatures.some((f) => a.feature.toLowerCase().includes(f.toLowerCase()));
        const bIsLow = lowestFeatures.some((f) => b.feature.toLowerCase().includes(f.toLowerCase()));
        return aIsLow === bIsLow ? 0 : aIsLow ? -1 : 1;
      });

    // Phase 3: Everything else (remaining)
    const usedInPhase1 = new Set(phase1Recs.map((r) => r.title));
    const usedInPhase2 = new Set(phase2Recs.map((r) => r.title));
    const phase3Recs = nonClinicalRecs.filter(
      (r) => !usedInPhase1.has(r.title) && !usedInPhase2.has(r.title)
    );

    return [
      { phase: 1, title: 'Phase 1: Foundation', subtitle: 'Days 1-30', recommendations: phase1Recs },
      { phase: 2, title: 'Phase 2: Targeted Correction', subtitle: 'Days 31-60', recommendations: phase2Recs },
      { phase: 3, title: 'Phase 3: Advanced & Maintenance', subtitle: 'Days 61-90', recommendations: phase3Recs },
    ];
  }, [scanResult, getLowestScoreFeatures]);

  const clinicalPhases = useMemo((): ClinicalPhase[] => {
    if (!isClinical || !scanResult?.recommendations) return [];

    const clinicalRecs = scanResult.recommendations.filter(
      (r) => r.category === 'hard-maxxing' || r.category === 'experimental'
    );

    if (clinicalRecs.length === 0) return [];

    const features = [...new Set(clinicalRecs.map((r) => r.feature))];

    return [1, 2, 3].map((phaseNum) => ({
      phase: phaseNum as 1 | 2 | 3,
      title: CLINICAL_PHASES[phaseNum].title,
      action: CLINICAL_PHASES[phaseNum].action,
      features,
    }));
  }, [scanResult, isClinical]);

  const clinicalFeatures = useMemo(() => {
    if (!scanResult?.recommendations) return [];
    return [...new Set(
      scanResult.recommendations
        .filter((r) => r.category === 'hard-maxxing' || r.category === 'experimental')
        .map((r) => r.feature)
    )];
  }, [scanResult]);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>90-Day Roadmap</Text>
            <Text style={styles.headerSubtitle}>Your personalized transformation plan</Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <CloseIcon />
          </Pressable>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading your roadmap...</Text>
          </View>
        ) : !scanResult ? (
          <View style={styles.emptyContainer}>
            <SparkleIcon color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Scan Data</Text>
            <Text style={styles.emptyDescription}>
              Complete a face scan to generate your personalized 90-day roadmap.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Clinical Track Banner */}
            {isClinical && clinicalFeatures.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.clinicalBanner}>
                <View style={styles.clinicalBannerIcon}>
                  <FlaskIcon />
                </View>
                <View style={styles.clinicalBannerContent}>
                  <Text style={styles.clinicalBannerTitle}>Clinical Exploration Track</Text>
                  <Text style={styles.clinicalBannerText}>
                    Advanced procedures require careful research and specialist consultation.
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Clinical Phase Cards */}
            {isClinical && clinicalPhases.length > 0 && (
              <View style={styles.clinicalSection}>
                <Text style={styles.sectionTitle}>Clinical Journey</Text>
                <View style={styles.clinicalCardsContainer}>
                  {clinicalPhases.map((phase) => (
                    <ClinicalCard key={phase.phase} phase={phase} features={clinicalFeatures} />
                  ))}
                </View>
              </View>
            )}

            {/* Phase Sections */}
            <View style={styles.phasesContainer}>
              {phases.map((phase) => (
                <PhaseSection
                  key={phase.phase}
                  data={phase}
                  clinicalFeatures={clinicalFeatures}
                />
              ))}
            </View>

            {/* Bottom Spacer */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}
      </View>
    </BottomSheet>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingTop: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.glassBackground,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  // Clinical Banner
  clinicalBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,184,0,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.2)',
    padding: 16,
    marginBottom: 20,
  },
  clinicalBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,184,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  clinicalBannerContent: {
    flex: 1,
  },
  clinicalBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  clinicalBannerText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  clinicalSection: {
    marginBottom: 24,
  },
  clinicalCardsContainer: {
    gap: 12,
  },
  phasesContainer: {
    gap: 24,
  },

  // Clinical Card
  clinicalCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.3)',
    padding: 16,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  clinicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  clinicalIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,184,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  clinicalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clinicalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  clinicalBadge: {
    backgroundColor: 'rgba(255,184,0,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  clinicalBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 0.2,
  },
  clinicalAction: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  clinicalPhaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clinicalPhaseText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // Phase Section
  phaseSection: {
    gap: 12,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  phaseIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primaryBgSolid,
    borderWidth: 1,
    borderColor: 'rgba(74,144,217,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  phaseTitleGroup: {
    flex: 1,
  },
  phaseTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  phaseSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  phaseNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  cardsContainer: {
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Recommendation Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E9F2',
    padding: 14,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  cardAction: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  potentialText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },

  // Badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Spacer
  bottomSpacer: {
    height: 20,
  },
});
