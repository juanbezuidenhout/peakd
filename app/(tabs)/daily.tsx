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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
import * as Haptics from 'expo-haptics';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors } from '@/constants/colors';
import {
  getDailyCompleted,
  setDailyCompleted,
  getDailyStreak,
  incrementDailyStreak,
  getIsPro,
} from '@/lib/storage';

// ─── Category colors ───

const CATEGORY_COLORS: Record<string, string> = {
  skincare: '#A855F7',
  makeup: '#EC4899',
  hair: '#14B8A6',
  lifestyle: '#22C55E',
};

// ─── Task data ───

interface DailyTask {
  id: string;
  category: 'skincare' | 'makeup' | 'hair' | 'lifestyle';
  title: string;
  description: string;
}

const DAILY_TASKS: DailyTask[] = [
  {
    id: 'task_1',
    category: 'skincare',
    title: 'Morning Skincare Routine',
    description:
      'Cleanse, tone, and moisturize. Apply vitamin C serum before sunscreen for max protection.',
  },
  {
    id: 'task_2',
    category: 'makeup',
    title: 'Brow Shape & Define',
    description:
      'Brush brows upward, fill sparse areas with light strokes. Set with clear gel for all-day hold.',
  },
  {
    id: 'task_3',
    category: 'lifestyle',
    title: 'Hydration & Sleep Prep',
    description:
      'Drink 8 glasses of water today. Set a wind-down alarm 30 min before bed for better skin recovery.',
  },
];

// ─── Confetti Particle ───

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
}

function ConfettiParticle({ x, color, delay }: Omit<Particle, 'id'>) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    const xDrift = (Math.random() - 0.5) * 200;
    scale.value = withDelay(delay, withSpring(1, { damping: 4, stiffness: 200 }));
    translateY.value = withDelay(
      delay,
      withTiming(-350 - Math.random() * 120, {
        duration: 1400,
        easing: Easing.out(Easing.quad),
      }),
    );
    translateX.value = withDelay(
      delay,
      withTiming(xDrift, { duration: 1400, easing: Easing.out(Easing.quad) }),
    );
    rotate.value = withDelay(
      delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 1400 }),
    );
    opacity.value = withDelay(
      delay + 800,
      withTiming(0, { duration: 600 }),
    );
  }, [delay, opacity, rotate, scale, translateX, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          bottom: 0,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

const CONFETTI_COLORS = [
  Colors.primary,
  Colors.primaryLight,
  Colors.accent,
  Colors.success,
  Colors.gold,
  '#EC4899',
  '#14B8A6',
];

function ConfettiBurst() {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: 40 + Math.random() * 260,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 300,
    }));
  }, []);

  return (
    <View style={confettiStyles.container} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} x={p.x} color={p.color} delay={p.delay} />
      ))}
    </View>
  );
}

// ─── Animated Checkbox ───

function AnimatedCheckbox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  const scale = useSharedValue(checked ? 1 : 1);

  useEffect(() => {
    if (checked) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 3, stiffness: 300 }),
        withSpring(1, { damping: 6, stiffness: 200 }),
      );
    }
  }, [checked, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={onToggle} hitSlop={12}>
      <Animated.View
        style={[
          checkboxStyles.outer,
          checked && checkboxStyles.outerChecked,
          animStyle,
        ]}
      >
        {checked && <Text style={checkboxStyles.check}>✓</Text>}
      </Animated.View>
    </Pressable>
  );
}

// ─── Task Card ───

function TaskCard({
  task,
  completed,
  locked,
  onToggle,
  onLockedPress,
  index,
}: {
  task: DailyTask;
  completed: boolean;
  locked: boolean;
  onToggle: () => void;
  onLockedPress: () => void;
  index: number;
}) {
  const catColor = CATEGORY_COLORS[task.category] ?? Colors.accent;
  const cardScale = useSharedValue(1);
  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <Animated.View entering={FadeInUp.delay(200 + index * 100).duration(500)}>
      <AnimatedPressable
        onPressIn={() => {
          cardScale.value = withTiming(0.97, { duration: 100 });
        }}
        onPressOut={() => {
          cardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={locked ? onLockedPress : undefined}
        style={[
          cardStyles.card,
          completed && { borderLeftWidth: 4, borderLeftColor: Colors.primary },
          cardAnimStyle,
        ]}
      >
        {/* Category dot + badge row */}
        <View style={cardStyles.topRow}>
          <View style={[cardStyles.dot, { backgroundColor: catColor }]} />
          <View
            style={[
              cardStyles.categoryBadge,
              { backgroundColor: catColor + '33' },
            ]}
          >
            <Text style={[cardStyles.categoryText, { color: catColor }]}>
              {task.category.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Content + checkbox */}
        <View style={cardStyles.contentRow}>
          <View style={cardStyles.textCol}>
            <Text style={cardStyles.title}>{task.title}</Text>
            <Text
              style={[cardStyles.desc, locked && cardStyles.descBlurred]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          </View>

          {locked ? (
            <View style={cardStyles.lockPill}>
              <Text style={cardStyles.lockText}>🔒 Pro</Text>
            </View>
          ) : (
            <AnimatedCheckbox checked={completed} onToggle={onToggle} />
          )}
        </View>

        {/* Lock overlay */}
        {locked && (
          <View style={cardStyles.lockOverlay}>
            <Text style={cardStyles.lockOverlayText}>
              🔒 Unlock with Peakd Pro
            </Text>
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

// ─── Main Screen ───

export default function DailyScreen() {
  const router = useRouter();
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [isPro, setIsPro] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [allDoneToday, setAllDoneToday] = useState(false);
  const dateRef = useRef(new Date().toISOString().slice(0, 10));

  const completedCount = completedIds.length;

  // ── Load persisted state ──
  const loadState = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== dateRef.current) {
      dateRef.current = today;
      setCompletedIds([]);
      setAllDoneToday(false);
    }

    const [saved, savedStreak, pro] = await Promise.all([
      getDailyCompleted(),
      getDailyStreak(),
      getIsPro(),
    ]);

    const today2 = new Date().toISOString().slice(0, 10);
    if (dateRef.current === today2) {
      setCompletedIds(saved);
      if (saved.length === DAILY_TASKS.length) setAllDoneToday(true);
    }
    setStreak(savedStreak);
    setIsPro(pro);
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // ── Midnight reset on app focus ──
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadState();
    });
    return () => sub.remove();
  }, [loadState]);

  // ── Toggle task ──
  const toggleTask = useCallback(
    async (taskId: string) => {
      const wasComplete = completedIds.includes(taskId);
      const next = wasComplete
        ? completedIds.filter((id) => id !== taskId)
        : [...completedIds, taskId];

      setCompletedIds(next);
      await setDailyCompleted(next);

      if (!wasComplete) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (next.length === DAILY_TASKS.length && !allDoneToday) {
        setAllDoneToday(true);
        setShowConfetti(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newStreak = await incrementDailyStreak();
        setStreak(newStreak);
        setTimeout(() => setShowConfetti(false), 2000);
      }
    },
    [completedIds, allDoneToday],
  );

  const handleShare = async () => {
    await Share.share({
      message: `I just completed all 3 daily glow-up tasks on Peakd! 🔥 Day ${streak} streak. #PeakdGlowUp`,
    });
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeScreen>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Header */}
        <Animated.View
          entering={FadeInUp.duration(500)}
          style={styles.headerRow}
        >
          <Text style={styles.headerTitle}>Today's Plan</Text>
          <Text style={styles.headerDate}>{formattedDate}</Text>
        </Animated.View>

        {/* Streak row */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(500)}
          style={styles.streakRow}
        >
          <Text style={styles.streakText}>
            🔥 Day {streak} streak
          </Text>
          <View style={styles.donePill}>
            <Text style={styles.donePillText}>
              {completedCount}/{DAILY_TASKS.length} done
            </Text>
          </View>
        </Animated.View>

        {/* Section title */}
        <Animated.View entering={FadeInUp.delay(150).duration(500)}>
          <Text style={styles.sectionTitle}>Your 3 Daily Tasks</Text>
        </Animated.View>

        {/* Task cards */}
        <View style={styles.taskList}>
          {DAILY_TASKS.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              completed={completedIds.includes(task.id)}
              locked={!isPro}
              onToggle={() => toggleTask(task.id)}
              onLockedPress={() => router.push('/paywall')}
              index={index}
            />
          ))}
        </View>

        {/* All-done celebration */}
        {allDoneToday && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(600).springify()}
            style={styles.celebrationCard}
          >
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>All done for today!</Text>
            <Text style={styles.celebrationSub}>
              Come back tomorrow for new tasks
            </Text>
            <View style={styles.shareButtonWrap}>
              <PrimaryButton label="Share My Progress" onPress={handleShare} />
            </View>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Confetti overlay */}
      {showConfetti && <ConfettiBurst />}
    </SafeScreen>
  );
}

// ─── Styles ───

const checkboxStyles = StyleSheet.create({
  outer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  check: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: -1,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  desc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  descBlurred: {
    opacity: 0.15,
  },
  lockPill: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  lockText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: 'rgba(10,10,10,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlayText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});

const confettiStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
});

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  streakText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  donePill: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  donePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 14,
  },
  taskList: {
    gap: 14,
  },
  celebrationCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
  },
  celebrationEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  celebrationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  celebrationSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  shareButtonWrap: {
    width: '100%',
  },
});
