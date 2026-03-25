import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenLoader } from '@/components/ui/WaveformLoader';
import { Colors } from '@/constants/colors';
import { getItem, KEYS } from '@/lib/storage';
import { AnalysisResult } from '@/lib/openai';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 40;

const PLANS = [
  {
    id: 'weekly',
    label: 'Weekly',
    price: '$4.99/week',
    badge: null,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '$29.99/year',
    badge: 'Save 88%',
  },
] as const;

function ScoreGrid({ result }: { result: AnalysisResult | null }) {
  const items = [
    { label: 'Face Shape', value: result?.face_shape ?? '—' },
    { label: 'Eye Type', value: result?.eye_type ?? '—' },
    { label: 'Color Season', value: result?.color_season ?? '—' },
    { label: 'Skin Tone', value: result?.skin_tone ?? '—' },
    {
      label: 'Top Feature',
      value: result?.top_features?.[0] ?? '—',
    },
    { label: 'Archetype', value: result?.archetype ?? '—' },
  ];

  return (
    <View style={slideStyles.grid}>
      {items.map((item) => (
        <View key={item.label} style={slideStyles.gridCard}>
          <Text style={slideStyles.gridLabel}>{item.label}</Text>
          <Text style={slideStyles.gridValue} numberOfLines={2}>
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DailyPlanSlide({ result }: { result: AnalysisResult | null }) {
  const tasks = result?.daily_tasks?.slice(0, 3) ?? [
    { id: '1', title: 'Morning skincare routine', category: 'skincare' },
    { id: '2', title: 'Brow shaping guide', category: 'makeup' },
    { id: '3', title: 'Hydration tracking', category: 'lifestyle' },
  ];

  const categoryColors: Record<string, string> = {
    skincare: Colors.accent,
    makeup: Colors.primaryLight,
    hair: Colors.gold,
    lifestyle: Colors.success,
  };

  return (
    <View style={slideStyles.slideContent}>
      {tasks.map((task) => (
        <View key={task.id} style={slideStyles.taskCard}>
          <Text style={slideStyles.taskTitle}>{task.title}</Text>
          <View
            style={[
              slideStyles.categoryBadge,
              {
                backgroundColor:
                  (categoryColors[task.category] ?? Colors.accent) + '22',
              },
            ]}
          >
            <Text
              style={[
                slideStyles.categoryText,
                {
                  color: categoryColors[task.category] ?? Colors.accent,
                },
              ]}
            >
              {task.category}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function SkinGuideSlide() {
  const tips = [
    { icon: '🧴', text: 'Personalized skincare routine' },
    { icon: '💄', text: 'Color-matched makeup palette' },
    { icon: '💡', text: 'Archetype-specific style tips' },
  ];

  return (
    <View style={slideStyles.slideContent}>
      {tips.map((tip) => (
        <View key={tip.text} style={slideStyles.tipRow}>
          <Text style={slideStyles.tipIcon}>{tip.icon}</Text>
          <Text style={slideStyles.tipText}>{tip.text}</Text>
        </View>
      ))}
    </View>
  );
}

function GlowUpTrackerSlide() {
  return (
    <View style={slideStyles.slideContent}>
      <View style={slideStyles.trackerMockup}>
        <View style={slideStyles.trackerSide}>
          <Text style={slideStyles.trackerLabel}>Before</Text>
          <View style={slideStyles.trackerBox}>
            <Text style={slideStyles.trackerIcon}>📸</Text>
          </View>
        </View>
        <View style={slideStyles.trackerDivider} />
        <View style={slideStyles.trackerSide}>
          <Text style={slideStyles.trackerLabel}>After</Text>
          <View style={[slideStyles.trackerBox, slideStyles.trackerBoxGlow]}>
            <Text style={slideStyles.trackerIcon}>✨</Text>
          </View>
        </View>
      </View>
      <Text style={slideStyles.trackerCaption}>
        Track your glow-up journey over time
      </Text>
    </View>
  );
}

function DotIndicator({ count, active }: { count: number; active: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[dotStyles.dot, i === active && dotStyles.dotActive]}
        />
      ))}
    </View>
  );
}

export default function PaywallScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<string>('weekly');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const scanResult = await getItem<AnalysisResult>(KEYS.SCAN_RESULT);
      if (scanResult) setResult(scanResult);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.root}>
        <ScreenLoader />
      </View>
    );
  }

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    setActiveSlide(page);
  };

  const handlePurchase = () => {
    // TODO: RevenueCat integration
    router.back();
  };

  const SLIDES = [
    { title: 'Your Scores', key: 'scores' },
    { title: 'Your 30-Day Plan', key: 'plan' },
    { title: 'Skin & Makeup Guide', key: 'guide' },
    { title: 'Glow-Up Tracker', key: 'tracker' },
  ];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0A0A0F', Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <SafeScreen>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Close button */}
          <Pressable
            onPress={() => router.back()}
            style={styles.closeButton}
            hitSlop={16}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>

          {/* Header */}
          <Animated.View
            entering={FadeInUp.duration(500)}
            style={styles.header}
          >
            <Text style={styles.title}>GLOW UP</Text>
            <Text style={styles.subtitle}>
              Your personalized beauty blueprint, unlocked.
            </Text>
          </Animated.View>

          {/* Carousel */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(500)}
            style={styles.carouselSection}
          >
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
              decelerationRate="fast"
              snapToInterval={SLIDE_WIDTH}
              contentContainerStyle={styles.carouselContent}
            >
              {SLIDES.map((slide) => (
                <View
                  key={slide.key}
                  style={[styles.slide, { width: SLIDE_WIDTH }]}
                >
                  <Text style={styles.slideTitle}>{slide.title}</Text>
                  {slide.key === 'scores' && <ScoreGrid result={result} />}
                  {slide.key === 'plan' && <DailyPlanSlide result={result} />}
                  {slide.key === 'guide' && <SkinGuideSlide />}
                  {slide.key === 'tracker' && <GlowUpTrackerSlide />}
                </View>
              ))}
            </ScrollView>
            <DotIndicator count={SLIDES.length} active={activeSlide} />
          </Animated.View>

          {/* Pricing */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(500)}
            style={styles.pricingSection}
          >
            <Text style={styles.scanCount}>500,000 scans completed</Text>

            <View style={styles.planOptions}>
              {PLANS.map((plan) => (
                <Pressable
                  key={plan.id}
                  onPress={() => setSelectedPlan(plan.id)}
                  style={[
                    styles.planPill,
                    selectedPlan === plan.id && styles.planPillSelected,
                  ]}
                >
                  <View style={styles.planRow}>
                    <Text
                      style={[
                        styles.planLabel,
                        selectedPlan === plan.id && styles.planLabelSelected,
                      ]}
                    >
                      {plan.label}
                    </Text>
                    {plan.badge && (
                      <View style={styles.saveBadge}>
                        <Text style={styles.saveBadgeText}>{plan.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.planPrice,
                      selectedPlan === plan.id && styles.planPriceSelected,
                    ]}
                  >
                    {plan.price}
                  </Text>
                </Pressable>
              ))}
            </View>

            <PrimaryButton label="Unlock Now 🙌" onPress={handlePurchase} />

            <Text style={styles.priceNote}>
              {selectedPlan === 'weekly'
                ? '$4.99/week · Cancel anytime'
                : '$29.99/year · Cancel anytime'}
            </Text>
          </Animated.View>

          {/* Footer links */}
          <Animated.View
            entering={FadeIn.delay(600).duration(400)}
            style={styles.footer}
          >
            <Pressable
              onPress={() => Linking.openURL('https://peakd.app/terms')}
            >
              <Text style={styles.footerLink}>Terms of Use</Text>
            </Pressable>
            <Text style={styles.footerDivider}>|</Text>
            <Pressable onPress={handlePurchase}>
              <Text style={styles.footerLink}>Restore Purchase</Text>
            </Pressable>
            <Text style={styles.footerDivider}>|</Text>
            <Pressable
              onPress={() => Linking.openURL('https://peakd.app/privacy')}
            >
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeScreen>
    </View>
  );
}

const slideStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  gridCard: {
    width: '47%' as any,
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 14,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  slideContent: {
    marginTop: 12,
    gap: 10,
  },
  taskCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  categoryBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 16,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  trackerMockup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  trackerSide: {
    alignItems: 'center',
    gap: 8,
  },
  trackerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  trackerBox: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackerBoxGlow: {
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  trackerIcon: {
    fontSize: 28,
  },
  trackerDivider: {
    width: 2,
    height: 60,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  trackerCaption: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});

const dotStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: 'flex-start',
    padding: 4,
    marginTop: 4,
  },
  closeIcon: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    fontStyle: 'italic',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  carouselSection: {
    marginTop: 28,
  },
  carouselContent: {
    paddingRight: 0,
  },
  slide: {
    paddingHorizontal: 0,
  },
  slideTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  pricingSection: {
    marginTop: 28,
    alignItems: 'center',
  },
  scanCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  planOptions: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 16,
    backgroundColor: Colors.surface,
  },
  planPillSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '0D',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  planLabelSelected: {
    color: Colors.textPrimary,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  planPriceSelected: {
    color: Colors.primary,
  },
  saveBadge: {
    backgroundColor: Colors.success + '22',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  saveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  priceNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },
  footerLink: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  footerDivider: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
