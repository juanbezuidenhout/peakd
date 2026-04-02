import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  SlideInRight,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import { getItem, KEYS, setCompletedPurchase } from '@/lib/storage';
import { requestNativeReview } from '@/lib/review';
import type { FaceAnalysisResult, FeatureScores } from '@/lib/anthropic';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Design tokens (light theme) ───────────────────────────────────────────
const C = {
  bg: '#FFFFFF',
  gradTop: '#EDF2FF',
  gradBottom: '#FFFFFF',
  navy: '#1A1A2E',
  blue: '#4A90D9',
  blueLight: '#7BB3F0',
  blueBg: 'rgba(74,144,217,0.08)',
  blueBgSolid: '#F0F4FF',
  cardBg: '#FAFBFC',
  cardBorder: '#F0F2F5',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E8EDF3',
  success: '#34C759',
  successBg: 'rgba(52,199,89,0.1)',
  white: '#FFFFFF',
  lock: '#B0B8C9',
};

// ── SVG Icons ─────────────────────────────────────────────────────────────

function IconChevronLeft() {
  return (
    <Svg width={10} height={18} viewBox="0 0 10 18" fill="none">
      <Path d="M9 1L1 9L9 17" stroke={C.navy} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconLock() {
  return (
    <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
      <Rect x={3} y={7} width={10} height={7} rx={2} fill={C.lock} />
      <Path d="M5 7V5a3 3 0 116 0v2" stroke={C.lock} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function IconCheck() {
  return (
    <Svg width={18} height={18} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={10} fill={C.navy} />
      <Path d="M6 10.5L8.5 13L14 7.5" stroke={C.white} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconSmallCheck() {
  return (
    <Svg width={10} height={8} viewBox="0 0 12 9" fill="none">
      <Path d="M1 4.5L4.5 8L11 1" stroke={C.white} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconDroplet() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d="M8 2C8 2 3.5 7.5 3.5 10a4.5 4.5 0 109 0C12.5 7.5 8 2 8 2z" stroke={C.blue} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" fill="rgba(74,144,217,0.1)" />
    </Svg>
  );
}

function IconDiamond() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d="M8 1.5L14.5 8L8 14.5L1.5 8L8 1.5z" stroke={C.blue} strokeWidth={1.4} strokeLinejoin="round" fill="rgba(74,144,217,0.1)" />
    </Svg>
  );
}

function IconStar() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d="M8 2l1.5 3.5L13 6l-2.5 2.5.5 3.5L8 10.5 5 12l.5-3.5L3 6l3.5-.5L8 2z" stroke={C.blue} strokeWidth={1.3} strokeLinejoin="round" fill="rgba(74,144,217,0.1)" />
    </Svg>
  );
}

function IconCamera() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Rect x={1.5} y={4.5} width={13} height={9} rx={2} stroke={C.blue} strokeWidth={1.3} fill="rgba(74,144,217,0.1)" />
      <Path d="M5.5 4.5L6.5 2.5h3l1 2" stroke={C.blue} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={8} cy={9} r={2.2} stroke={C.blue} strokeWidth={1.3} />
    </Svg>
  );
}

function IconCheckCircle() {
  return (
    <Svg width={15} height={15} viewBox="0 0 16 16" fill="none">
      <Circle cx={8} cy={8} r={6} stroke={C.blue} strokeWidth={1.3} fill="rgba(74,144,217,0.08)" />
      <Path d="M5.5 8.2L7 9.8L10.5 6.2" stroke={C.blue} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconSearch() {
  return (
    <Svg width={15} height={15} viewBox="0 0 16 16" fill="none">
      <Circle cx={7} cy={7} r={4.5} stroke={C.blue} strokeWidth={1.4} />
      <Path d="M10.5 10.5L14 14" stroke={C.blue} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

function IconClipboard() {
  return (
    <Svg width={15} height={15} viewBox="0 0 16 16" fill="none">
      <Rect x={3} y={2.5} width={10} height={12} rx={2} stroke={C.blue} strokeWidth={1.3} fill="rgba(74,144,217,0.05)" />
      <Path d="M6 2.5V2a2 2 0 014 0v.5" stroke={C.blue} strokeWidth={1.3} />
      <Line x1={6} y1={7} x2={10} y2={7} stroke={C.blue} strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={6} y1={9.5} x2={9} y2={9.5} stroke={C.blue} strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

function IconLightbulb() {
  return (
    <Svg width={15} height={15} viewBox="0 0 16 16" fill="none">
      <Path d="M6.5 13h3M8 1.5a4.5 4.5 0 00-2 8.5v1.5h4V10A4.5 4.5 0 008 1.5z" stroke={C.blue} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" fill="rgba(74,144,217,0.06)" />
    </Svg>
  );
}

function IconTrendUp() {
  return (
    <Svg width={15} height={15} viewBox="0 0 16 16" fill="none">
      <Path d="M2 12L6 7.5 9 10l5-6" stroke={C.blue} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11 4h3v3" stroke={C.blue} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconShield() {
  return (
    <Svg width={13} height={13} viewBox="0 0 16 16" fill="none">
      <Path d="M8 1.5L2.5 4v4c0 3.5 2.5 5.5 5.5 6.5 3-1 5.5-3 5.5-6.5V4L8 1.5z" stroke={C.textMuted} strokeWidth={1.2} fill="rgba(156,163,175,0.08)" />
      <Path d="M6 8.2L7.3 9.5 10 6.5" stroke={C.textMuted} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconStarFilled() {
  return (
    <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
      <Path d="M8 1l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 11.8 3.8 14l.8-4.7L1.2 6l4.7-.7z" fill="#FFB800" />
    </Svg>
  );
}

function IconArrowRight() {
  return (
    <Svg width={16} height={12} viewBox="0 0 16 12" fill="none">
      <Path d="M0 6h12M10 2l4 4-4 4" stroke={C.blue} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const CATEGORY_ICONS = [IconDroplet, IconDiamond, IconStar, IconCamera, IconCheckCircle, IconDroplet, IconDiamond, IconStar];
const PHASE_ICONS = [IconDroplet, IconDiamond, IconStar, IconCamera];

const CATEGORY_KEYS: (keyof FeatureScores)[] = [
  'skinQuality', 'facialStructure', 'eyes', 'nose', 'lipsAndMouth', 'eyebrows', 'hair', 'overallHarmony',
];

const CATEGORY_LABELS: Record<keyof FeatureScores, string> = {
  skinQuality: 'Skin Clarity',
  facialStructure: 'Symmetry',
  eyes: 'Eyes',
  nose: 'Nose',
  lipsAndMouth: 'Lips',
  eyebrows: 'Brows',
  hair: 'Hair & Grooming',
  overallHarmony: 'Overall Harmony',
};

// ── Helpers ───────────────────────────────────────────────────────────────

function getTopCategories(fs: FeatureScores, count = 5) {
  return CATEGORY_KEYS
    .map((key, i) => ({
      key,
      name: CATEGORY_LABELS[key],
      score: fs[key].score,
      potential: `+${(Math.random() * 1.5 + 0.5).toFixed(1)}`,
      IconComponent: CATEGORY_ICONS[i],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

// ── Animated Score Ring ───────────────────────────────────────────────────

function ScoreRing({ score, size = 90 }: { score: number; size?: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = score >= 7.5 ? C.success : score >= 5.5 ? C.blue : '#FF6B6B';
  const offset = circumference * (1 - score / 10);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={C.border} strokeWidth={strokeWidth} />
        <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${circumference}`} strokeDashoffset={offset} strokeLinecap="round" />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: C.navy }}>{score.toFixed(1)}</Text>
        <Text style={{ fontSize: 10, color: C.textMuted, fontWeight: '500' }}>/10</Text>
      </View>
    </View>
  );
}

// ── Progress Dots ─────────────────────────────────────────────────────────

function Dots({ current }: { current: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{
          width: i === current ? 20 : 6, height: 6, borderRadius: 3,
          backgroundColor: i === current ? C.blue : '#E2E8F0',
        }} />
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SCREEN 1 — Glow Card + What You Unlock
// ══════════════════════════════════════════════════════════════════════════

function Screen1({
  user,
  onNext,
}: {
  user: { name: string; rating: number; categories: { name: string; score: number; potential: string; IconComponent: React.FC }[] };
  onNext: () => void;
}) {
  const UNLOCK_ITEMS = [
    'Personalized 90 day transformation blueprint',
    'Week by week action items for your face',
    'Product and routine recommendations',
    'Progress tracking with re-scans',
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Glow Card */}
      <View style={s.glowCard}>
        <View style={s.glowCardGlow} />
        {/* User header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <LinearGradient colors={[C.blue, C.blueLight]} style={s.avatar}>
            <Text style={s.avatarText}>{user.name ? user.name[0].toUpperCase() : 'P'}</Text>
          </LinearGradient>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: C.navy }}>{user.name || 'Your'}'s Glow Card</Text>
            <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>Scanned just now</Text>
          </View>
        </View>

        {/* Score */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 18 }}>
          <ScoreRing score={user.rating} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.navy, marginBottom: 6 }}>Your Rating</Text>
            <Text style={{ fontSize: 12, color: C.textSecondary, lineHeight: 18 }}>
              With the right plan, our users typically improve{' '}
              <Text style={{ color: C.blue, fontWeight: '600' }}>+1.5 points</Text> in 90 days.
            </Text>
          </View>
        </View>

        {/* Categories */}
        <View style={{ gap: 8 }}>
          {user.categories.map((cat, i) => {
            const CatIcon = cat.IconComponent;
            return (
              <View key={i} style={s.catRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CatIcon />
                  <Text style={{ fontSize: 13, color: C.navy, fontWeight: '500' }}>{cat.name}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.navy }}>{cat.score.toFixed(1)}</Text>
                  <View style={s.blurredPotential}>
                    <Text style={{ fontSize: 11, color: C.blue, fontWeight: '600' }}>{cat.potential}</Text>
                  </View>
                  <IconLock />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Unlock list */}
      <View style={{ paddingHorizontal: 4, marginTop: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: C.navy, marginBottom: 10 }}>What you'll unlock</Text>
        {UNLOCK_ITEMS.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <LinearGradient colors={[C.blue, C.blueLight]} style={s.checkBubble}>
              <IconSmallCheck />
            </LinearGradient>
            <Text style={{ fontSize: 13, color: C.textSecondary, lineHeight: 18, flex: 1 }}>{item}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <Pressable style={s.ctaBtn} onPress={onNext}>
        <Text style={s.ctaBtnText}>Unlock My Blueprint</Text>
      </Pressable>
      <Text style={s.ctaSub}>See how to reach your full potential</Text>
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SCREEN 2 — 90 Day Transformation Timeline
// ══════════════════════════════════════════════════════════════════════════

const PHASES = [
  { weeks: 'Week 1 to 2', title: 'Skin Foundation', desc: 'Targeted skincare routine based on your scan' },
  { weeks: 'Week 3 to 4', title: 'Structure & Definition', desc: 'Facial exercises and grooming upgrades' },
  { weeks: 'Week 5 to 6', title: 'Style & Presence', desc: 'Hair, brows and personal style optimization' },
  { weeks: 'Week 7 to 8', title: 'Final Polish and Re-scan', desc: 'Refinements and measure your transformation' },
];

function Screen2({
  rating,
  onNext,
}: {
  rating: number;
  onNext: () => void;
}) {
  const projected = Math.min(10, rating + 1.5).toFixed(1);
  const gain = (Number(projected) - rating).toFixed(1);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: C.navy, letterSpacing: -0.3 }}>Your 90 Day Transformation</Text>
        <Text style={{ fontSize: 14, color: C.textSecondary, marginTop: 6 }}>A step by step plan built from your scan</Text>
      </View>

      {/* Score projection */}
      <View style={s.projectionBar}>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.projLabel}>NOW</Text>
          <Text style={s.projScore}>{rating.toFixed(1)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 40, height: 2, backgroundColor: C.blue, borderRadius: 1, opacity: 0.3 }} />
          <IconArrowRight />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={[s.projLabel, { color: C.blue }]}>DAY 90</Text>
          <Text style={[s.projScore, { color: C.blue }]}>{projected}</Text>
        </View>
        <View style={s.gainBadge}>
          <Text style={s.gainText}>+{gain}</Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={{ paddingLeft: 20, marginTop: 20 }}>
        <View style={s.timelineLine} />
        {PHASES.map((phase, i) => {
          const PhaseIcon = PHASE_ICONS[i];
          return (
            <View key={i} style={{ flexDirection: 'row', marginBottom: i < PHASES.length - 1 ? 16 : 0, paddingLeft: 20, position: 'relative' }}>
              <View style={[s.timelineDot, i === 0 && s.timelineDotActive]} />
              <View style={s.timelineCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={s.timelineWeek}>{phase.weeks}</Text>
                  <PhaseIcon />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: C.navy, marginBottom: 3 }}>{phase.title}</Text>
                <Text style={{ fontSize: 12, color: C.textMuted, lineHeight: 17 }}>{phase.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* CTA */}
      <View style={{ marginTop: 24 }}>
        <Pressable style={s.ctaBtn} onPress={onNext}>
          <Text style={s.ctaBtnText}>Get My Plan</Text>
        </Pressable>
        <Text style={s.ctaSub}>Tailored to your unique scan results</Text>
      </View>
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SCREEN 3 — Pricing
// ══════════════════════════════════════════════════════════════════════════

function Screen3({
  onPurchase,
}: {
  onPurchase: () => void;
}) {
  const [pricingMode, setPricingMode] = useState<'onetime' | 'weekly'>('onetime');

  const TOGGLE_WIDTH = SCREEN_WIDTH - 40;
  const PILL_WIDTH = (TOGGLE_WIDTH - 6) / 2;

  const pillTranslateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  const pillAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillTranslateX.value }],
  }));

  const cardContentAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  const switchMode = (mode: 'onetime' | 'weekly') => {
    if (mode === pricingMode) return;
    pillTranslateX.value = withSpring(mode === 'weekly' ? PILL_WIDTH : 0, {
      damping: 20,
      stiffness: 250,
    });
    cardOpacity.value = withSequence(
      withTiming(0, { duration: 150 }),
      withTiming(1, { duration: 150 }),
    );
    setTimeout(() => setPricingMode(mode), 150);
  };

  const isOneTime = pricingMode === 'onetime';

  const SHARED_FEATURES = [
    'Full 12-point facial analysis',
    'Week-by-week 90-day action plan',
    'Personalised to your archetype',
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: C.navy, letterSpacing: -0.3 }}>Choose Your Plan</Text>
        <Text style={{ fontSize: 14, color: C.textSecondary, marginTop: 6 }}>Invest in your glow up</Text>
      </View>

      {/* Shared Feature List */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 10, fontWeight: '600', color: '#8B9BB5', letterSpacing: 2, marginBottom: 12 }}>
          EVERYTHING INCLUDED
        </Text>
        {SHARED_FEATURES.map((feat, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: i < SHARED_FEATURES.length - 1 ? 10 : 0 }}>
            <View style={{
              width: 22, height: 22, borderRadius: 11,
              backgroundColor: C.success, alignItems: 'center', justifyContent: 'center',
            }}>
              <IconSmallCheck />
            </View>
            <Text style={{ fontSize: 13, color: C.textSecondary, flex: 1 }}>{feat}</Text>
          </View>
        ))}
      </View>

      {/* Pricing Toggle */}
      <View style={{
        height: 44,
        backgroundColor: 'rgba(26,115,232,0.06)',
        borderRadius: 22,
        padding: 3,
        flexDirection: 'row',
        marginBottom: 20,
      }}>
        <Animated.View style={[{
          position: 'absolute',
          top: 3,
          left: 3,
          width: PILL_WIDTH,
          height: 38,
          backgroundColor: C.white,
          borderRadius: 20,
          shadowColor: '#1A73E8',
          shadowOpacity: 0.12,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }, pillAnimStyle]} />
        <Pressable style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }} onPress={() => switchMode('onetime')}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: isOneTime ? '#1A1A2E' : '#8B9BB5' }}>One-Time</Text>
          <View style={{ backgroundColor: '#1A6FE0', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
            <Text style={{ fontSize: 8, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 }}>BEST VALUE</Text>
          </View>
        </Pressable>
        <Pressable style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={() => switchMode('weekly')}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: !isOneTime ? '#1A1A2E' : '#8B9BB5' }}>Weekly</Text>
        </Pressable>
      </View>

      {/* Pricing Card */}
      <View style={[s.planCard, s.planCardActive, { flexDirection: 'column', alignItems: 'stretch' }]}>
        <Animated.View style={cardContentAnimStyle}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.navy, marginBottom: 4 }}>
            {isOneTime ? '90-Day Transformation Plan' : 'Peakd Membership'}
          </Text>
          <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16 }}>
            {isOneTime
              ? 'Your complete personalised roadmap, built from your scan.'
              : 'Unlimited scans, new plans, and AI skin care coach.'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 32, fontWeight: '700', color: C.navy }}>
              {isOneTime ? '$24.99' : '$4.99'}
            </Text>
            <Text style={{ fontSize: 13, color: C.textMuted, marginLeft: 6 }}>
              {isOneTime ? 'one-time payment' : 'per week'}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* CTA */}
      <View style={{ marginTop: 20 }}>
        <Pressable style={s.ctaBtn} onPress={onPurchase}>
          {/* TODO: 'peakd_plan_onetime_3499' (one-time) / 'peakd_membership_monthly_999' (monthly) */}
          <Text style={s.ctaBtnText}>Start My Plan</Text>
        </Pressable>
        {!isOneTime && (
          <Text style={{ fontSize: 10, color: '#8B9BB5', textAlign: 'center', marginTop: 10 }}>
            Cancel anytime. Billed through Apple.
          </Text>
        )}
      </View>

      {/* Footer */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 }}>
        <IconShield />
        <Text style={{ fontSize: 11, color: C.textMuted }}>Secure payment</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12 }}>
        {[1, 2, 3, 4, 5].map((i) => <IconStarFilled key={i} />)}
        <Text style={{ fontSize: 12, color: C.textSecondary, marginLeft: 4 }}>Loved by 10,000+ users</Text>
      </View>
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAYWALL COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [result, setResult] = useState<FaceAnalysisResult | null>(null);

  useEffect(() => {
    (async () => {
      const [name, scan] = await Promise.all([
        getItem<string>(KEYS.USER_NAME),
        getItem<FaceAnalysisResult>(KEYS.SCAN_RESULT),
      ]);
      setUserName(name ?? '');
      if (scan) setResult(scan);
    })();
  }, []);

  const goBack = () => {
    if (step === 1) router.back();
    else { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep((s) => s - 1); }
  };

  const advance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => s + 1);
  };

  const purchase = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Wire RevenueCat here. Call setCompletedPurchase() ONLY after
    // RevenueCat confirms a successful transaction. Example:
    //
    // try {
    //   const purchaserInfo = await Purchases.purchasePackage(selectedPackage);
    //   if (purchaserInfo.customerInfo.entitlements.active["pro"]) {
    //     await setCompletedPurchase();
    //     // Show the native App Store / Play Store rating prompt immediately
    //     // after a confirmed purchase — the highest-intent moment in the app.
    //     await requestNativeReview();
    //     router.replace('/(tabs)/home');
    //   }
    // } catch (e) {
    //   // Handle error, do NOT set purchase flag
    // }
    //
    // For now (testing), set it immediately:
    await setCompletedPurchase();
    // Show the native App Store / Play Store rating prompt immediately
    // after a confirmed purchase — the highest-intent moment in the app.
    await requestNativeReview();
    router.replace('/(onboarding)/auth');
  };

  const rating = result?.glowScore ?? 0;
  const categories = result?.featureScores ? getTopCategories(result.featureScores) : [];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[C.gradTop, C.gradBottom]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Nav: Dots only (NO Back, NO Skip) */}
      <View style={[s.nav, { paddingTop: insets.top + 8 }]}>
        <View style={{ width: 36 }} />
        <Dots current={step - 1} />
        <View style={{ width: 36 }} />
      </View>

      {/* Step content */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {step === 1 && (
          <Animated.View key="s1" entering={SlideInRight.duration(300)} exiting={SlideOutLeft.duration(300)} style={{ flex: 1 }}>
            <Screen1 user={{ name: userName, rating, categories }} onNext={advance} />
          </Animated.View>
        )}
        {step === 2 && (
          <Animated.View key="s2" entering={SlideInRight.duration(300)} exiting={SlideOutLeft.duration(300)} style={{ flex: 1 }}>
            <Screen2 rating={rating} onNext={advance} />
          </Animated.View>
        )}
        {step === 3 && (
          <Animated.View key="s3" entering={SlideInRight.duration(300)} exiting={SlideOutLeft.duration(300)} style={{ flex: 1 }}>
            <Screen3 onPurchase={purchase} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Glow Card
  glowCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 0,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: 'rgba(230,237,255,0.8)',
    shadowColor: '#4A6DA7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  glowCardGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(74,144,217,0.12)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: C.white,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(230,237,255,0.6)',
  },
  blurredPotential: {
    backgroundColor: C.blueBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    opacity: 0.35,
  },
  checkBubble: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Projection bar
  projectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: C.blueBgSolid,
    borderWidth: 1,
    borderColor: 'rgba(74,144,217,0.1)',
  },
  projLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  projScore: {
    fontSize: 28,
    fontWeight: '700',
    color: C.navy,
  },
  gainBadge: {
    backgroundColor: C.successBg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
  },
  gainText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.success,
  },

  // Timeline
  timelineLine: {
    position: 'absolute',
    left: 9,
    top: 8,
    bottom: 8,
    width: 2,
    backgroundColor: C.border,
    borderRadius: 1,
  },
  timelineDot: {
    position: 'absolute',
    left: -15.5,
    top: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: C.white,
  },
  timelineDotActive: {
    backgroundColor: C.blue,
    borderWidth: 3,
    borderColor: 'rgba(74,144,217,0.2)',
  },
  timelineCard: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineWeek: {
    fontSize: 11,
    fontWeight: '600',
    color: C.blue,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Plan cards
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: C.cardBg,
    borderWidth: 2,
    borderColor: C.border,
    position: 'relative',
  },
  planCardActive: {
    borderColor: C.blue,
    backgroundColor: C.blueBgSolid,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestValueBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    backgroundColor: C.blue,
  },
  bestValueText: {
    fontSize: 9,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.6,
  },

  // Included box
  includedBox: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },

  // CTA
  ctaBtn: {
    backgroundColor: C.navy,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: C.white,
  },
  ctaSub: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
});
