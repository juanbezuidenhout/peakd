import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  AppState,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Line, Circle as SvgCircle } from 'react-native-svg';
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors } from '@/constants/colors';
import {
  getDailyCompleted,
  setDailyCompleted,
  getDailyStreak,
  incrementDailyStreak,
} from '@/lib/storage';
import { getDailyTasks, getPhaseName, type DailyTask } from '@/lib/daily-tasks';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Category Colors ───

const CATEGORY_COLORS: Record<string, string> = {
  skincare: '#4A90D9',
  makeup: '#EC4899',
  hair: '#14B8A6',
  lifestyle: '#34C759',
};

// ─── Icons ───

function CloseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Line x1="6" y1="6" x2="18" y2="18" stroke="rgba(0,0,0,0.5)" strokeWidth={2} strokeLinecap="round" />
      <Line x1="18" y1="6" x2="6" y2="18" stroke="rgba(0,0,0,0.5)" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Confetti ───

const CONFETTI_COLORS = [Colors.primary, Colors.primaryLight, Colors.success, Colors.gold, '#EC4899', '#14B8A6'];

interface Particle { id: number; x: number; color: string; delay: number; }

function ConfettiParticle({ x, color, delay }: Omit<Particle, 'id'>) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    const xDrift = (Math.random() - 0.5) * 200;
    scale.value = withDelay(delay, withSpring(1, { damping: 4, stiffness: 200 }));
    translateY.value = withDelay(delay, withTiming(-350 - Math.random() * 120, { duration: 1400, easing: Easing.out(Easing.quad) }));
    translateX.value = withDelay(delay, withTiming(xDrift, { duration: 1400, easing: Easing.out(Easing.quad) }));
    rotate.value = withDelay(delay, withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 1400 }));
    opacity.value = withDelay(delay + 800, withTiming(0, { duration: 600 }));
  }, [delay, opacity, rotate, scale, translateX, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotate.value}deg` }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[{ position: 'absolute', left: x, bottom: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: color }, style]} />;
}

function ConfettiBurst() {
  const particles = useMemo<Particle[]>(() => Array.from({ length: 40 }, (_, i) => ({ id: i, x: 40 + Math.random() * 260, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], delay: Math.random() * 300 })), []);
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">{particles.map((p) => <ConfettiParticle key={p.id} {...p} />)}</View>;
}

// ─── Premium Checkbox ───

function PremiumCheckbox({ checked }: { checked: boolean }) {
  const scale = useSharedValue(checked ? 1 : 1);
  
  useEffect(() => {
    if (checked) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 4, stiffness: 250 }),
        withSpring(1, { damping: 6, stiffness: 200 })
      );
    }
  }, [checked, scale]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[checkboxStyles.container, animStyle]}>
      {checked ? (
        <LinearGradient colors={['#1d3fa8', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={checkboxStyles.checkedBg}>
          <CheckIcon />
        </LinearGradient>
      ) : (
        <View style={checkboxStyles.uncheckedBg} />
      )}
    </Animated.View>
  );
}

// ─── Task Card ───

function TaskCard({ task, completed, onToggle, index }: { task: DailyTask; completed: boolean; onToggle: () => void; index: number; }) {
  const catColor = CATEGORY_COLORS[task.category] ?? Colors.primary;
  const cardScale = useSharedValue(1);
  const cardAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));

  return (
    <Animated.View entering={FadeInUp.delay(200 + index * 100).duration(500)}>
      <AnimatedPressable
        onPressIn={() => { cardScale.value = withTiming(0.97, { duration: 100 }); }}
        onPressOut={() => { cardScale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
        onPress={onToggle}
        style={[cardStyles.card, completed && cardStyles.cardCompleted, cardAnimStyle]}
      >
        <View style={cardStyles.contentRow}>
          <View style={cardStyles.checkboxCol}>
            <PremiumCheckbox checked={completed} />
          </View>
          <View style={cardStyles.textCol}>
            <View style={cardStyles.categoryRow}>
              <View style={[cardStyles.dot, { backgroundColor: catColor }]} />
              <Text style={[cardStyles.categoryText, { color: catColor }]}>{task.category.toUpperCase()}</Text>
            </View>
            <Text style={[cardStyles.title, completed && cardStyles.titleCompleted]}>{task.title}</Text>
            <Text style={[cardStyles.desc, completed && cardStyles.descCompleted]}>{task.description}</Text>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

// ─── Main Screen ───

export default function DailyScreen() {
  const router = useRouter();
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [planContext, setPlanContext] = useState({ day: 1, phaseName: 'Phase 1: Foundation' });
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [allDoneToday, setAllDoneToday] = useState(false);
  const dateRef = useRef(new Date().toISOString().slice(0, 10));

  const completedCount = completedIds.length;

  const loadState = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== dateRef.current) {
      dateRef.current = today;
      setCompletedIds([]);
      setAllDoneToday(false);
    }

    const [saved, savedStreak, { tasks, planDay, phase }] = await Promise.all([
      getDailyCompleted(),
      getDailyStreak(),
      getDailyTasks(),
    ]);

    setDailyTasks(tasks);
    setPlanContext({ day: planDay, phaseName: getPhaseName(phase) });

    const today2 = new Date().toISOString().slice(0, 10);
    if (dateRef.current === today2) {
      setCompletedIds(saved);
      if (saved.length === tasks.length && tasks.length > 0) setAllDoneToday(true);
    }
    setStreak(savedStreak);
  }, []);

  useEffect(() => { loadState(); }, [loadState]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active') loadState(); });
    return () => sub.remove();
  }, [loadState]);

  const toggleTask = useCallback(async (taskId: string) => {
    const wasComplete = completedIds.includes(taskId);
    const next = wasComplete ? completedIds.filter((id) => id !== taskId) : [...completedIds, taskId];
    
    setCompletedIds(next);
    await setDailyCompleted(next);

    if (!wasComplete) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (next.length === dailyTasks.length && !allDoneToday && dailyTasks.length > 0) {
      setAllDoneToday(true);
      setShowConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newStreak = await incrementDailyStreak();
      setStreak(newStreak);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [completedIds, allDoneToday, dailyTasks.length]);

  const handleShare = async () => {
    await Share.share({ message: `I just completed all 3 daily glow-up tasks on Peakd! 🔥 Day ${streak} streak. #PeakdGlowUp` });
  };

  const formattedDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <SafeScreen style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Today's Plan</Text>
            <Text style={styles.headerDate}>{formattedDate}</Text>
          </View>
          <Pressable style={styles.closeBtn} hitSlop={12} onPress={() => router.back()}>
            <CloseIcon />
          </Pressable>
        </Animated.View>

        {/* Streak Row */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.streakRow}>
          <View style={styles.streakPill}>
            <Text style={styles.streakText}>🔥 Day {streak} streak</Text>
          </View>
          <View style={styles.donePill}>
            <Text style={styles.donePillText}>{completedCount}/{dailyTasks.length || 3} done</Text>
          </View>
        </Animated.View>

        {/* Section Title */}
        <Animated.View entering={FadeInUp.delay(150).duration(500)} style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Your 3 Daily Tasks</Text>
          <View style={styles.phaseBadge}>
            <Text style={styles.phaseLabel}>{planContext.phaseName}</Text>
          </View>
        </Animated.View>

        {/* Task List */}
        <View style={styles.taskList}>
          {dailyTasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              completed={completedIds.includes(task.id)}
              onToggle={() => toggleTask(task.id)}
              index={index}
            />
          ))}
        </View>

        {/* Celebration */}
        {allDoneToday && (
          <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} style={styles.celebrationCard}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>All done for today!</Text>
            <Text style={styles.celebrationSub}>Come back tomorrow for new tasks</Text>
            <View style={styles.shareButtonWrap}>
              <PrimaryButton label="Share My Progress" onPress={handleShare} />
            </View>
          </Animated.View>
        )}
      </ScrollView>
      {showConfetti && <ConfettiBurst />}
    </SafeScreen>
  );
}

// ─── Styles ───

const checkboxStyles = StyleSheet.create({
  container: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden' },
  uncheckedBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.04)', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 14 },
  checkedBg: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
});

const cardStyles = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  cardCompleted: { opacity: 0.65, backgroundColor: 'rgba(255,255,255,0.5)', shadowOpacity: 0 },
  contentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  checkboxCol: { marginRight: 14, marginTop: 2 },
  textCol: { flex: 1 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  categoryText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 4, letterSpacing: -0.3 },
  titleCompleted: { textDecorationLine: 'line-through', color: '#6B7280' },
  desc: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  descCompleted: { color: '#9CA3AF' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f2f3f7' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 24 },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#0a0a0a', letterSpacing: -0.6, marginBottom: 4 },
  headerDate: { fontSize: 15, color: 'rgba(0,0,0,0.45)', fontWeight: '500' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  streakPill: { backgroundColor: 'rgba(255,255,255,0.75)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  streakText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
  donePill: { backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  donePillText: { fontSize: 13, fontWeight: '600', color: 'rgba(0,0,0,0.5)' },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 0.8 },
  phaseBadge: { backgroundColor: 'rgba(74,144,217,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  phaseLabel: { fontSize: 11, fontWeight: '700', color: '#4A90D9' },
  taskList: { gap: 12 },
  celebrationCard: { backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', marginTop: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 24 },
  celebrationEmoji: { fontSize: 48, marginBottom: 12 },
  celebrationTitle: { fontSize: 22, fontWeight: '700', color: '#0a0a0a', marginBottom: 6 },
  celebrationSub: { fontSize: 15, color: 'rgba(0,0,0,0.5)', marginBottom: 24 },
  shareButtonWrap: { width: '100%' },
});
