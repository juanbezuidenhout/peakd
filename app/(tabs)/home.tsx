import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SvgCircle, Path } from 'react-native-svg';
import { getUserName, getItem, setItem, KEYS } from '@/lib/storage';
import type { FaceAnalysisResult } from '@/lib/anthropic';

const PLAN_START_KEY = 'peakd_plan_start_date';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function SettingsIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="#8B9BB5"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="#8B9BB5"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProgressArc({ progress, day }: { progress: number; day: number }) {
  const size = 52;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <SvgCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E9F2"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <SvgCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#4A90D9"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill as any}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#1A1A2E' }}>
            Day {day}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<FaceAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [planDay, setPlanDay] = useState(1);

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
  const planProgress = Math.min(1, Math.max(0, planDay / 90));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              {greeting}, {firstName ?? 'You'}
            </Text>
            {loading ? (
              <View style={styles.archetypePlaceholder} />
            ) : archetype ? (
              <Text style={styles.archetype}>{archetype}</Text>
            ) : null}
          </View>
          <Pressable
            style={styles.settingsBtn}
            hitSlop={12}
            onPress={() => {
              // TODO: navigate to settings
            }}
          >
            <SettingsIcon />
          </Pressable>
        </View>

        {/* ── Section Label ──────────────────────────────── */}
        <Text style={styles.sectionLabel}>YOUR DASHBOARD</Text>

        {/* ── Feature Cards ──────────────────────────────── */}
        <View style={styles.cardsRow}>
          {/* Card 1 — Face Report */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.cardWrapper}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => router.push('/results')}
            >
              <LinearGradient
                colors={['#1B6FE0', '#3451CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.reportCard}
              >
                <Text style={styles.reportLabel}>YOUR ANALYSIS</Text>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={styles.reportTitle}>Face Report</Text>
                  <Text style={styles.reportSubtitle}>See your full results</Text>
                </View>
                <View style={styles.scoreOrb}>
                  <Text style={styles.scoreNumber}>
                    {loading ? '...' : score != null ? Math.round(score * 10) / 10 : '—'}
                  </Text>
                  <Text style={styles.scoreLabel}>SCORE</Text>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Card 2 — 90-Day Plan */}
          <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.cardWrapper}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => {
                // TODO: navigate to plan screen
              }}
            >
              <View style={styles.planCard}>
                <Text style={styles.planLabel}>YOUR PLAN</Text>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={styles.planTitle}>90-Day Roadmap</Text>
                  <Text style={styles.planSubtitle}>
                    Your personalised transformation plan
                  </Text>
                </View>
                <View style={styles.progressArcContainer}>
                  <ProgressArc progress={planProgress} day={planDay} />
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  scrollContent: {
    paddingBottom: 32,
  },

  /* ── Header ─────────────────────────────────────────── */
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  archetype: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B9BB5',
    marginTop: 4,
  },
  archetypePlaceholder: {
    marginTop: 4,
    width: 80,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E9F2',
  },
  settingsBtn: {
    marginTop: 4,
  },

  /* ── Section Label ──────────────────────────────────── */
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B9BB5',
    letterSpacing: 2,
    marginTop: 24,
    paddingHorizontal: 20,
  },

  /* ── Cards Row ──────────────────────────────────────── */
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
    height: 180,
  },

  /* ── Face Report Card ───────────────────────────────── */
  reportCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    overflow: 'hidden',
  },
  reportLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reportSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  scoreOrb: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },

  /* ── 90-Day Plan Card ───────────────────────────────── */
  planCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E2E9F2',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  planLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4A90D9',
    letterSpacing: 1.5,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  planSubtitle: {
    fontSize: 12,
    color: '#8B9BB5',
    marginTop: 2,
  },
  progressArcContainer: {
    position: 'absolute',
    bottom: 14,
    right: 14,
  },
});
