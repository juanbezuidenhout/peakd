import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { getItem, KEYS } from '@/lib/storage';
import type { FaceAnalysisResult, Recommendation } from '@/lib/anthropic';
import { TAB_BAR_HEIGHT } from '@/components/ui/LiquidGlassTabBar';

const Colors = {
  primary: '#2563eb',
  primaryBg: 'rgba(37,99,235,0.08)',
  primaryBgSolid: 'rgba(37,99,235,0.06)',
  success: '#34C759',
  gold: '#FFB800',
  textPrimary: '#0a0a0a',
  textSecondary: 'rgba(0,0,0,0.5)',
  textMuted: 'rgba(0,0,0,0.3)',
  white: '#ffffff',
  borderLight: 'rgba(0,0,0,0.07)',
  glassBackground: 'rgba(255,255,255,0.72)',
};

const PLAN_START_KEY = 'peakd_plan_start_date';

const CLINICAL_PHASES: Record<number, { title: string; action: string }> = {
  1: { title: 'Research & Education', action: 'Research & vet specialists for' },
  2: { title: 'Consultation Phase', action: 'Attend consultations with' },
  3: { title: 'Decision & Planning', action: 'Finalize treatment plan for' },
};

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

function Badge({ text, variant }: { text: string; variant: 'natural' | 'soft-maxxing' | 'clinical' | 'default' }) {
  const colors = {
    natural: { bg: 'rgba(52,199,89,0.1)', text: Colors.success, border: 'rgba(52,199,89,0.2)' },
    'soft-maxxing': { bg: Colors.primaryBg, text: Colors.primary, border: 'rgba(37,99,235,0.2)' },
    clinical: { bg: 'rgba(255,184,0,0.1)', text: Colors.gold, border: 'rgba(255,184,0,0.25)' },
    default: { bg: Colors.glassBackground, text: Colors.textSecondary, border: Colors.borderLight },
  };
  const c = colors[variant];
  return (
    <View style={[s.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[s.badgeText, { color: c.text }]}>{text}</Text>
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
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)} style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>{recommendation.title}</Text>
        <Badge text={recommendation.category} variant={getVariant()} />
      </View>
      <Text style={s.cardAction}>{recommendation.action}</Text>
      <View style={s.cardFooter}>
        <View style={s.timeBadge}>
          <ClockIcon />
          <Text style={s.timeText}>{recommendation.timeframe}</Text>
        </View>
        {recommendation.potentialGain && (
          <Text style={s.potentialText}>+{recommendation.potentialGain} pts</Text>
        )}
      </View>
    </Animated.View>
  );
}

function ClinicalCard({ phase }: { phase: ClinicalPhase }) {
  const uniqueFeatures = [...new Set(phase.features)].slice(0, 3);
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={s.clinicalCard}>
      <View style={s.clinicalHeader}>
        <View style={s.clinicalIconBg}>
          {phase.phase === 1 ? <FlaskIcon /> : phase.phase === 2 ? <CrownIcon /> : <SparkleIcon color={Colors.gold} />}
        </View>
        <View style={s.clinicalTitleRow}>
          <Text style={s.clinicalTitle}>{phase.title}</Text>
          <View style={s.clinicalBadge}>
            <Text style={s.clinicalBadgeText}>Clinical Track</Text>
          </View>
        </View>
      </View>
      <Text style={s.clinicalAction}>
        {phase.action} {uniqueFeatures.join(', ')}
      </Text>
      <View style={s.clinicalPhaseRow}>
        <Text style={s.clinicalPhaseText}>Phase {phase.phase} of 3</Text>
      </View>
    </Animated.View>
  );
}

function PhaseSection({ data }: { data: PhaseData }) {
  const getPhaseIcon = () => {
    switch (data.phase) {
      case 1: return <LeafIcon />;
      case 2: return <TargetIcon />;
      case 3: return <CrownIcon />;
    }
  };
  return (
    <Animated.View entering={FadeInDown.delay(data.phase * 100).duration(400)} style={s.phaseSection}>
      <View style={s.phaseHeader}>
        <View style={s.phaseIconBg}>{getPhaseIcon()}</View>
        <View style={s.phaseTitleGroup}>
          <Text style={s.phaseTitle}>{data.title}</Text>
          <Text style={s.phaseSubtitle}>{data.subtitle}</Text>
        </View>
        <View style={s.phaseNumberBadge}>
          <Text style={s.phaseNumberText}>{data.phase}</Text>
        </View>
      </View>
      <View style={s.cardsContainer}>
        {data.recommendations.map((rec, idx) => (
          <RecommendationCard key={`${rec.title}-${idx}`} recommendation={rec} index={idx} />
        ))}
        {data.recommendations.length === 0 && (
          <Text style={s.emptyText}>No recommendations for this phase. Continue your current routine.</Text>
        )}
      </View>
    </Animated.View>
  );
}

export default function RoadmapScreen() {
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState<FaceAnalysisResult | null>(null);
  const [glowLevel, setGlowLevel] = useState<string | null>(null);
  const [planDay, setPlanDay] = useState(1);

  useEffect(() => {
    (async () => {
      const [result, level, startStr] = await Promise.all([
        getItem<FaceAnalysisResult>(KEYS.SCAN_RESULT),
        getItem<string>(KEYS.USER_GLOW_LEVEL),
        getItem<string>(PLAN_START_KEY),
      ]);
      setScanResult(result);
      setGlowLevel(level);
      if (startStr) {
        const start = new Date(startStr);
        const now = new Date();
        const diffMs = now.getTime() - start.getTime();
        setPlanDay(Math.max(1, Math.floor(diffMs / 86_400_000) + 1));
      }
      setLoading(false);
    })();
  }, []);

  const isClinical = useMemo(() => {
    if (!glowLevel) return false;
    const level = glowLevel.toLowerCase();
    return level.includes('hardmaxxing') || level.includes('hard-maxxing') || level.includes('experimental');
  }, [glowLevel]);

  const phases = useMemo((): PhaseData[] => {
    if (!scanResult?.recommendations) {
      return [
        { phase: 1, title: 'Phase 1: Foundation', subtitle: 'Days 1-30', recommendations: [] },
        { phase: 2, title: 'Phase 2: Targeted Correction', subtitle: 'Days 31-60', recommendations: [] },
        { phase: 3, title: 'Phase 3: Advanced & Maintenance', subtitle: 'Days 61-90', recommendations: [] },
      ];
    }
    const nonClinicalRecs = scanResult.recommendations.filter(
      (r) => r.category !== 'hard-maxxing' && (r.category as string) !== 'hardmaxxing' && r.category !== 'experimental'
    );
    const chunkSize = Math.ceil(nonClinicalRecs.length / 3);
    return [
      { phase: 1, title: 'Phase 1: Foundation', subtitle: 'Days 1-30', recommendations: nonClinicalRecs.slice(0, chunkSize) },
      { phase: 2, title: 'Phase 2: Targeted Correction', subtitle: 'Days 31-60', recommendations: nonClinicalRecs.slice(chunkSize, chunkSize * 2) },
      { phase: 3, title: 'Phase 3: Advanced & Maintenance', subtitle: 'Days 61-90', recommendations: nonClinicalRecs.slice(chunkSize * 2) },
    ];
  }, [scanResult]);

  const clinicalPhases = useMemo((): ClinicalPhase[] => {
    if (!isClinical || !scanResult?.recommendations) return [];
    const clinicalRecs = scanResult.recommendations.filter(
      (r) => r.category === 'hard-maxxing' || (r.category as string) === 'hardmaxxing' || r.category === 'experimental'
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
        .filter((r) => r.category === 'hard-maxxing' || (r.category as string) === 'hardmaxxing' || r.category === 'experimental')
        .map((r) => r.feature)
    )];
  }, [scanResult]);

  const activeSegments = Math.min(6, Math.ceil(planDay / 15));

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={s.header}>
          <Text style={s.headerTitle}>90-Day Roadmap</Text>
          <Text style={s.headerSubtitle}>Your personalised transformation plan</Text>
          <View style={s.headerMeta}>
            <View style={s.dayBadge}>
              <Text style={s.dayBadgeText}>Day {planDay}</Text>
            </View>
            <View style={s.progressSegments}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[s.progressSeg, i < activeSegments && s.progressSegActive]} />
              ))}
            </View>
          </View>
        </Animated.View>

        {loading ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={s.loadingText}>Loading your roadmap...</Text>
          </View>
        ) : !scanResult ? (
          <View style={s.emptyContainer}>
            <SparkleIcon color={Colors.textMuted} />
            <Text style={s.emptyTitle}>No Scan Data</Text>
            <Text style={s.emptyDescription}>
              Complete a face scan to generate your personalized 90-day roadmap.
            </Text>
          </View>
        ) : (
          <>
            {isClinical && clinicalFeatures.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400)} style={s.clinicalBanner}>
                <View style={s.clinicalBannerIcon}>
                  <FlaskIcon />
                </View>
                <View style={s.clinicalBannerContent}>
                  <Text style={s.clinicalBannerTitle}>Clinical Exploration Track</Text>
                  <Text style={s.clinicalBannerText}>
                    Advanced procedures require careful research and specialist consultation.
                  </Text>
                </View>
              </Animated.View>
            )}

            {isClinical && clinicalPhases.length > 0 && (
              <View style={s.clinicalSection}>
                <Text style={s.sectionTitle}>Clinical Journey</Text>
                <View style={s.clinicalCardsContainer}>
                  {clinicalPhases.map((phase) => (
                    <ClinicalCard key={phase.phase} phase={phase} />
                  ))}
                </View>
              </View>
            )}

            <View style={s.phasesContainer}>
              {phases.map((phase) => (
                <PhaseSection key={phase.phase} data={phase} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f2f3f7' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: TAB_BAR_HEIGHT + 40 },

  header: { paddingTop: 24, marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.6, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, fontWeight: '400', color: Colors.textSecondary, marginBottom: 16 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayBadge: { backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: 100, borderWidth: 1, borderColor: 'rgba(37,99,235,0.18)', paddingVertical: 5, paddingHorizontal: 14 },
  dayBadgeText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  progressSegments: { flex: 1, flexDirection: 'row', gap: 4 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.08)' },
  progressSegActive: { backgroundColor: '#3b82f6' },

  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  loadingText: { marginTop: 16, fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  emptyDescription: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  clinicalBanner: { flexDirection: 'row', backgroundColor: 'rgba(255,184,0,0.08)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)', padding: 16, marginBottom: 20 },
  clinicalBannerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,184,0,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  clinicalBannerContent: { flex: 1 },
  clinicalBannerTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  clinicalBannerText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  clinicalSection: { marginBottom: 24 },
  clinicalCardsContainer: { gap: 12 },
  phasesContainer: { gap: 24 },

  clinicalCard: { backgroundColor: '#FFFDF8', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,184,0,0.3)', padding: 16, shadowColor: '#FFB800', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  clinicalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  clinicalIconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,184,0,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  clinicalTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clinicalTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  clinicalBadge: { backgroundColor: 'rgba(255,184,0,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  clinicalBadgeText: { fontSize: 10, fontWeight: '600', color: Colors.gold, letterSpacing: 0.2 },
  clinicalAction: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 8 },
  clinicalPhaseRow: { flexDirection: 'row', alignItems: 'center' },
  clinicalPhaseText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },

  phaseSection: { gap: 12 },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  phaseIconBg: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.primaryBgSolid, borderWidth: 1, borderColor: 'rgba(37,99,235,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  phaseTitleGroup: { flex: 1 },
  phaseTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.2, marginBottom: 2 },
  phaseSubtitle: { fontSize: 13, color: Colors.textSecondary },
  phaseNumberBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  phaseNumberText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  cardsContainer: { gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },

  card: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary, lineHeight: 20 },
  cardAction: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  potentialText: { fontSize: 12, fontWeight: '600', color: Colors.success },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
});
