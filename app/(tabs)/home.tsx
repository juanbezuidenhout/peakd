import { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SvgCircle, Path, Rect, Polygon } from 'react-native-svg';
import { getUserName, getItem, setItem, KEYS } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { FaceAnalysisResult } from '@/lib/anthropic';
import { RoadmapSheet } from '@/components/ui/RoadmapSheet';

const PLAN_START_KEY = 'peakd_plan_start_date';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SettingsIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="rgba(0,0,0,0.4)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="rgba(0,0,0,0.4)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={5} width={20} height={15} rx={3} stroke="#2563eb" strokeWidth={1.5} />
      <Rect x={8} y={2} width={8} height={4} rx={1.5} stroke="#2563eb" strokeWidth={1.5} />
      <SvgCircle cx={12} cy={13} r={4} stroke="#2563eb" strokeWidth={1.5} />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <SvgCircle cx={12} cy={12} r={10} stroke="#2563eb" strokeWidth={1.5} />
      <Path d="M8 12.5l2.5 2.5L16 9.5" stroke="#2563eb" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CoachIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 17l10 5 10-5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 12l10 5 10-5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SendIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M12 5l7 7-7 7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StarIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        stroke="#2563eb"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PaperPlaneIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path d="M22 2L11 13" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 2L15 22 11 13 2 9l20-7z" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function GlowScoreRing({ score }: { score: number | null | undefined }) {
  const size = 130;
  const outerRadius = 57;
  const innerRadius = 47;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const progress = score != null ? Math.min(1, score / 10) : 0.68;
  const outerDash = outerCircumference * progress;
  const innerDash = innerCircumference * (progress * 0.85);
  const displayScore = score != null ? Math.round(score * 10) / 10 : '6.8';

  return (
    <View style={styles.ringContainer}>
      <Svg width={size} height={size} viewBox="0 0 130 130">
        <SvgCircle cx={65} cy={65} r={outerRadius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={5} />
        <SvgCircle cx={65} cy={65} r={outerRadius} fill="none" stroke="rgba(255,255,255,0.88)" strokeWidth={5} strokeDasharray={`${outerDash} ${outerCircumference}`} strokeLinecap="round" rotation="-90" origin="65, 65" />
        <SvgCircle cx={65} cy={65} r={innerRadius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={3} />
        <SvgCircle cx={65} cy={65} r={innerRadius} fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth={3} strokeDasharray={`${innerDash} ${innerCircumference}`} strokeLinecap="round" rotation="-90" origin="65, 65" />
      </Svg>
      <View style={styles.ringScoreOverlay}>
        <Text style={styles.ringScoreNumber}>{displayScore}</Text>
        <Text style={styles.ringScoreLabel}>SCORE</Text>
      </View>
    </View>
  );
}

function SubScoreRow({ label, value, fill }: { label: string; value: string; fill: number }) {
  return (
    <View style={styles.subScoreRow}>
      <View style={styles.subScoreBarBg}>
        <View style={[styles.subScoreBarFill, { width: `${fill}%` as any }]} />
      </View>
      <Text style={styles.subScoreLabel}>{label} {value}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<FaceAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [planDay, setPlanDay] = useState(1);

  // Feature request state
  const [featureText, setFeatureText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Roadmap modal state
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);

  useEffect(() => {
    (async () => {
      const [name, result] = await Promise.all([
        getUserName(),
        getItem<FaceAnalysisResult>(KEYS.SCAN_RESULT),
      ]);
      setFirstName(name || 'You');
      if (result) setScanResult(result);

      let startStr = await getItem<string>(PLAN_START_KEY);
      if (!startStr) {
        startStr = new Date().toISOString().slice(0, 10);
        await setItem(PLAN_START_KEY, startStr);
      }
      const start = new Date(startStr);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const dayNum = Math.max(1, Math.floor(diffMs / 86_400_000) + 1);
      setPlanDay(dayNum);
      setLoading(false);
    })();
  }, []);

  const greeting = getGreeting();
  const score = scanResult?.glowScore;
  const archetype = scanResult?.archetype?.name;
  const activeSegments = Math.min(6, Math.ceil(planDay / 15));

  // ── Feature request submit ─────────────────────────────────
  async function handleSendFeatureRequest() {
    const trimmed = featureText.trim();
    if (!trimmed) return;

    Keyboard.dismiss();
    setSending(true);

    const { error } = await supabase.from('feature_requests').insert({
      user_name: firstName,
      archetype: archetype ?? null,
      message: trimmed,
    });

    setSending(false);

    if (error) {
      Alert.alert('Something went wrong', 'We couldn\'t send your request. Please try again.');
      return;
    }

    setFeatureText('');
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Header ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>{greeting}</Text>
            <Text style={styles.greetingName}>{firstName ?? 'You'}</Text>
            {loading ? (
              <View style={styles.archetypePlaceholder} />
            ) : archetype ? (
              <View style={styles.archetypePill}>
                <View style={styles.archetypeDot} />
                <Text style={styles.archetypeText}>{archetype}</Text>
              </View>
            ) : null}
          </View>
          <Pressable style={styles.settingsBtn} hitSlop={12} onPress={() => router.push('/settings')}>
            <SettingsIcon />
          </Pressable>
        </Animated.View>

        {/* ── Hero Card: Glow Score ─────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.heroCardWrapper}>
          <Pressable onPress={() => router.push('/results')}>
            <LinearGradient colors={['#1d3fa8', '#2563eb', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <Text style={styles.heroLabel}>YOUR GLOW SCORE</Text>
                <View style={styles.viewReportPill}>
                  <Text style={styles.viewReportText}>View report</Text>
                </View>
              </View>
              <View style={styles.heroContent}>
                <GlowScoreRing score={score} />
                <View style={styles.subScores}>
                  <Text style={styles.percentileText}>Top 32% globally</Text>
                  <SubScoreRow label="Skin" value="7.2" fill={72} />
                  <SubScoreRow label="Form" value="6.5" fill={65} />
                  <SubScoreRow label="Eyes" value="7.0" fill={70} />
                  <SubScoreRow label="Lips" value="6.4" fill={64} />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* ── AI Coach Card ─────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.glassCard}>
          <View style={styles.coachHeader}>
            <LinearGradient colors={['#1d3fa8', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coachIconBg}>
              <CoachIcon />
            </LinearGradient>
            <Text style={styles.coachTitle}>AI Coach</Text>
          </View>
          <Pressable style={styles.coachInput} onPress={() => router.push('/coach')}>
            <Text style={styles.coachPlaceholder}>Ask anything about your results...</Text>
            <LinearGradient colors={['#1d3fa8', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coachSendBtn}>
              <SendIcon />
            </LinearGradient>
          </Pressable>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
            {['How can I improve?', 'Best skincare routine', 'My strengths', 'Routine tips'].map((chip) => (
              <Pressable key={chip} style={styles.chip} onPress={() => router.push('/coach')}>
                <Text style={styles.chipText}>{chip}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── 90-Day Roadmap Card ───────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.glassCard}>
          <Pressable onPress={() => setShowRoadmapModal(true)}>
            <View style={styles.roadmapHeader}>
              <Text style={styles.roadmapTitle}>90-Day Roadmap</Text>
              <View style={styles.roadmapHeaderRight}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>Day {planDay}</Text>
                </View>
                <View style={styles.viewRoadmapPill}>
                  <Text style={styles.viewRoadmapText}>View roadmap</Text>
                </View>
              </View>
            </View>
            <Text style={styles.roadmapSubtitle}>Your personalised transformation plan</Text>
            <View style={styles.progressSegments}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[styles.progressSeg, i < activeSegments ? styles.progressSegActive : null]} />
              ))}
            </View>
            <View style={styles.roadmapPills}>
              <View style={styles.pillBlue}><Text style={styles.pillBlueText}>Week 1: Foundation</Text></View>
              <View style={styles.pillGray}><Text style={styles.pillGrayText}>3 tasks remaining</Text></View>
            </View>
          </Pressable>
        </Animated.View>

        {/* ── Tool Cards Grid ───────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.toolGrid}>
          <Pressable style={styles.toolCard} onPress={() => router.push('/(tabs)/daily')}>
            <View style={styles.toolIconSquare}><CheckIcon /></View>
            <Text style={styles.toolName}>Daily tasks</Text>
            <Text style={styles.toolSub}>3 tasks today</Text>
            <View style={styles.toolProgressBar}>
              <View style={[styles.toolProgressSeg, styles.toolProgressSegActive]} />
              <View style={styles.toolProgressSeg} />
              <View style={styles.toolProgressSeg} />
            </View>
          </Pressable>
          <Pressable style={[styles.toolCard, styles.toolCardHorizontal]} onPress={() => router.push('/(tabs)/scan')}>
            <View style={[styles.toolIconSquare, { marginBottom: 0 }]}><CameraIcon /></View>
            <View>
              <Text style={styles.toolName}>New scan</Text>
              <Text style={styles.toolSub}>Retake</Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* ── Insight of the Day ────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={[styles.glassCard, styles.insightCard]}>
          <View style={styles.insightAccent} />
          <View style={styles.insightBody}>
            <Text style={styles.insightLabel}>INSIGHT OF THE DAY</Text>
            <Text style={styles.insightText}>Your skin clarity scored highest. Maintain hydration to keep this advantage.</Text>
          </View>
        </Animated.View>

        {/* ── Feature Request Card ──────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.glassCard}>
          {/* Header */}
          <View style={styles.featureHeader}>
            <View style={styles.featureIconBg}>
              <StarIcon />
            </View>
            <Text style={styles.featureTitle}>Request a Feature</Text>
          </View>

          {/* Subtitle */}
          <Text style={styles.featureSubtitle}>
            What would make Peakd better for you? We read every single one.
          </Text>

          {/* Text input */}
          <TextInput
            style={styles.featureInput}
            placeholder={'e.g. "I\'d love a weekly progress photo comparison..."'}
            placeholderTextColor="rgba(0,0,0,0.25)"
            multiline
            numberOfLines={3}
            value={featureText}
            onChangeText={setFeatureText}
            textAlignVertical="top"
            editable={!sending && !sent}
          />

          {/* Send button row */}
          <View style={styles.featureSendRow}>
            {sent ? (
              <View style={styles.featureSentConfirm}>
                <Text style={styles.featureSentText}>✓ Request sent — thank you!</Text>
              </View>
            ) : (
              <Pressable
                onPress={handleSendFeatureRequest}
                disabled={sending || featureText.trim().length === 0}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
              >
                <LinearGradient
                  colors={featureText.trim().length === 0 ? ['#b0bec5', '#b0bec5'] : ['#1d3fa8', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.featureSendBtn}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <PaperPlaneIcon />
                      <Text style={styles.featureSendBtnText}>Send request</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </Animated.View>

      </ScrollView>

      {/* Roadmap Modal */}
      <RoadmapSheet visible={showRoadmapModal} onClose={() => setShowRoadmapModal(false)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  safe: { flex: 1, backgroundColor: '#f2f3f7' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // ── Header ────────────────────────────────────────────────
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 24, marginBottom: 22 },
  headerLeft: { flex: 1, paddingRight: 12 },
  eyebrow: { fontSize: 12, fontWeight: '400', color: 'rgba(0,0,0,0.38)', letterSpacing: 0.1, marginBottom: 2 },
  greetingName: { fontSize: 28, fontWeight: '700', color: '#0a0a0a', letterSpacing: -0.6, lineHeight: 32 },
  archetypePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 8, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 100, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', paddingVertical: 4, paddingLeft: 8, paddingRight: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  archetypeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2563eb', marginRight: 6 },
  archetypeText: { fontSize: 12, fontWeight: '500', color: 'rgba(0,0,0,0.55)', letterSpacing: 0.1 },
  archetypePlaceholder: { marginTop: 8, width: 80, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.06)' },
  settingsBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },

  // ── Hero Card ─────────────────────────────────────────────
  heroCardWrapper: { marginBottom: 12, borderRadius: 26, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.30, shadowRadius: 24, elevation: 8 },
  heroCard: { borderRadius: 26, padding: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  heroLabel: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.2 },
  viewReportPill: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', paddingVertical: 5, paddingHorizontal: 12 },
  viewReportText: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.92)' },
  heroContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // Ring
  ringContainer: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center' },
  ringScoreOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringScoreNumber: { fontSize: 40, fontWeight: '300', color: '#fff', letterSpacing: -1, lineHeight: 44 },
  ringScoreLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.2, marginTop: 2 },

  // Sub-scores
  subScores: { flex: 1, paddingLeft: 16, alignItems: 'flex-end', gap: 8 },
  percentileText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  subScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subScoreBarBg: { width: 64, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  subScoreBarFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 2 },
  subScoreLabel: { fontSize: 11, fontWeight: '400', color: 'rgba(255,255,255,0.55)', width: 48, textAlign: 'right' },

  // ── Glass Card (shared base) ──────────────────────────────
  glassCard: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 2 },

  // ── AI Coach ──────────────────────────────────────────────
  coachHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  coachIconBg: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 3 },
  coachTitle: { fontSize: 16, fontWeight: '600', color: '#0a0a0a', letterSpacing: -0.2 },
  coachInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', paddingVertical: 12, paddingHorizontal: 14 },
  coachPlaceholder: { flex: 1, fontSize: 14, fontWeight: '400', color: 'rgba(0,0,0,0.28)' },
  coachSendBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 3 },
  chipsScroll: { marginTop: 11 },
  chipsContent: { gap: 7 },
  chip: { backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', paddingVertical: 7, paddingHorizontal: 12 },
  chipText: { fontSize: 12, fontWeight: '400', color: 'rgba(0,0,0,0.45)' },

  // ── Roadmap ───────────────────────────────────────────────
  roadmapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  roadmapHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roadmapTitle: { fontSize: 16, fontWeight: '600', color: '#0a0a0a', letterSpacing: -0.2 },
  dayBadge: { backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: 100, borderWidth: 1, borderColor: 'rgba(37,99,235,0.18)', paddingVertical: 4, paddingHorizontal: 12 },
  dayBadgeText: { fontSize: 12, fontWeight: '600', color: '#2563eb' },
  viewRoadmapPill: { backgroundColor: '#2563eb', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2 },
  viewRoadmapText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  roadmapSubtitle: { fontSize: 13, fontWeight: '400', color: 'rgba(0,0,0,0.38)', marginBottom: 14 },
  progressSegments: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.08)' },
  progressSegActive: { backgroundColor: '#3b82f6', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 2 },
  roadmapPills: { flexDirection: 'row', gap: 8 },
  pillBlue: { backgroundColor: 'rgba(37,99,235,0.09)', borderRadius: 100, borderWidth: 1, borderColor: 'rgba(37,99,235,0.15)', paddingVertical: 5, paddingHorizontal: 12 },
  pillBlueText: { fontSize: 11, fontWeight: '500', color: '#2563eb' },
  pillGray: { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 100, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', paddingVertical: 5, paddingHorizontal: 12 },
  pillGrayText: { fontSize: 11, fontWeight: '400', color: 'rgba(0,0,0,0.38)' },

  // ── Tool Grid ─────────────────────────────────────────────
  toolGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  toolCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 2 },
  toolCardHorizontal: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  toolIconSquare: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(37,99,235,0.1)', borderWidth: 1, borderColor: 'rgba(37,99,235,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  toolName: { fontSize: 14, fontWeight: '600', color: '#0a0a0a', letterSpacing: -0.1 },
  toolSub: { fontSize: 11, fontWeight: '400', color: 'rgba(0,0,0,0.35)', marginTop: 3 },
  toolProgressBar: { flexDirection: 'row', gap: 4, marginTop: 14 },
  toolProgressSeg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.08)' },
  toolProgressSegActive: { backgroundColor: '#3b82f6' },

  // ── Insight Card ──────────────────────────────────────────
  insightCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16 },
  insightAccent: { width: 3, minHeight: 36, backgroundColor: '#2563eb', borderRadius: 2, marginTop: 2, opacity: 0.7 },
  insightBody: { flex: 1 },
  insightLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(0,0,0,0.28)', letterSpacing: 1.0, marginBottom: 6 },
  insightText: { fontSize: 14, fontWeight: '400', color: 'rgba(0,0,0,0.62)', lineHeight: 21 },

  // ── Feature Request Card ──────────────────────────────────
  featureHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  featureIconBg: { width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(37,99,235,0.1)', borderWidth: 1, borderColor: 'rgba(37,99,235,0.15)', alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 16, fontWeight: '600', color: '#0a0a0a', letterSpacing: -0.2 },
  featureSubtitle: { fontSize: 13, fontWeight: '400', color: 'rgba(0,0,0,0.38)', marginBottom: 14, lineHeight: 18 },
  featureInput: { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', paddingVertical: 13, paddingHorizontal: 14, fontSize: 14, fontWeight: '400', color: '#0a0a0a', minHeight: 88, lineHeight: 21 },
  featureSendRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  featureSendBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 100, paddingVertical: 10, paddingHorizontal: 18, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 4 },
  featureSendBtnText: { fontSize: 13, fontWeight: '600', color: '#fff', letterSpacing: -0.1 },
  featureSentConfirm: { backgroundColor: 'rgba(37,99,235,0.08)', borderRadius: 100, borderWidth: 1, borderColor: 'rgba(37,99,235,0.15)', paddingVertical: 10, paddingHorizontal: 18 },
  featureSentText: { fontSize: 13, fontWeight: '500', color: '#2563eb' },
});