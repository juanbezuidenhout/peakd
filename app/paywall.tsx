import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors } from '@/constants/colors';

const TESTIMONIALS = [
  {
    initial: 'M',
    name: 'Mia K.',
    handle: '@miakristine',
    title: 'Insane glow-up in 3 months',
    body: 'Easily the best investment I\u2019ve made in myself. My skin is glowing, my features look more defined, and I get compliments every single day. Peakd actually knows what they\u2019re doing.',
  },
  {
    initial: 'S',
    name: 'Sofia R.',
    handle: '@sofiarose',
    title: 'Worth every penny',
    body: 'I was skeptical at first but the personalised plan changed everything. My confidence is through the roof and my friends keep asking what I\u2019ve been doing differently.',
  },
  {
    initial: 'J',
    name: 'Jasmine T.',
    handle: '@jasminet_',
    title: 'Finally found what works',
    body: 'I\u2019ve tried so many beauty apps but Peakd is the only one that actually gave me a plan I could stick to. The AI coach is like having a personal beauty consultant.',
  },
];

const FEATURES = [
  'Full Facial Analysis & Glow Score',
  'Your Personal Beauty Archetype',
  'Personalised 30-Day Glow-Up Plan',
  'AI Beauty Coach (Unlimited)',
  'Weekly Progress Tracking',
];

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'weekly'>('yearly');
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const yearlyBorderColor = useSharedValue(1);
  const weeklyBorderColor = useSharedValue(0);

  const selectPlan = (plan: 'yearly' | 'weekly') => {
    setSelectedPlan(plan);
    yearlyBorderColor.value = withTiming(plan === 'yearly' ? 1 : 0, { duration: 250 });
    weeklyBorderColor.value = withTiming(plan === 'weekly' ? 1 : 0, { duration: 250 });
  };

  const yearlyBorderStyle = useAnimatedStyle(() => ({
    borderColor:
      yearlyBorderColor.value === 1
        ? Colors.primary
        : Colors.border,
  }));

  const weeklyBorderStyle = useAnimatedStyle(() => ({
    borderColor:
      weeklyBorderColor.value === 1
        ? Colors.primary
        : Colors.border,
  }));

  const testimonial = TESTIMONIALS[activeTestimonial];

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1 — Top section */}
        <Animated.View
          entering={FadeInUp.duration(500)}
          style={styles.topSection}
        >
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>P</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandName}>peakd</Text>
            <Text style={styles.brandPro}> Pro</Text>
          </View>
          <Text style={styles.stat}>50,000+ beauty analyses completed</Text>
          <Text style={styles.stat}>Ascend into the top 20% in 90 days</Text>
        </Animated.View>

        {/* 2 — Testimonial card */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(500)}
          style={styles.testimonialWrapper}
        >
          <View style={styles.testimonialCard}>
            <View style={styles.testimonialHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>{testimonial.initial}</Text>
              </View>
              <View style={styles.testimonialMeta}>
                <Text style={styles.testimonialName}>{testimonial.name}</Text>
                <Text style={styles.testimonialHandle}>{testimonial.handle}</Text>
              </View>
            </View>
            <Text style={styles.stars}>★★★★★</Text>
            <Text style={styles.testimonialTitle}>{testimonial.title}</Text>
            <Text style={styles.testimonialBody}>{testimonial.body}</Text>
            <View style={styles.dotRow}>
              {TESTIMONIALS.map((_, i) => (
                <Pressable key={i} onPress={() => setActiveTestimonial(i)}>
                  <View
                    style={[
                      styles.dot,
                      i === activeTestimonial && styles.dotActive,
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* 3 — Feature checklist */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.featureSection}
        >
          <Text style={styles.featureSectionTitle}>Everything included</Text>
          {FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
              <Text style={styles.featureText}>{feature}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          ))}
        </Animated.View>

        {/* 4 — Pricing cards */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500).springify().damping(18)}
          style={styles.pricingSection}
        >
          <View style={styles.pricingRow}>
            {/* Yearly */}
            <Pressable style={{ flex: 1 }} onPress={() => selectPlan('yearly')}>
              <Animated.View style={[styles.pricingCard, yearlyBorderStyle]}>
                <View style={styles.mostPopularBadge}>
                  <Text style={styles.mostPopularText}>MOST POPULAR</Text>
                </View>
                {selectedPlan === 'yearly' && (
                  <View style={styles.selectedCheck}>
                    <Text style={styles.selectedCheckMark}>✓</Text>
                  </View>
                )}
                <Text style={styles.planTier}>YEARLY</Text>
                <Text style={styles.planPrice}>$29.99</Text>
                <View style={styles.perUnitBadge}>
                  <Text style={styles.perUnitText}>$2.50/month</Text>
                </View>
                <Text style={styles.billedText}>Billed yearly</Text>
              </Animated.View>
            </Pressable>

            {/* Weekly */}
            <Pressable style={{ flex: 1 }} onPress={() => selectPlan('weekly')}>
              <Animated.View style={[styles.pricingCard, weeklyBorderStyle]}>
                {selectedPlan === 'weekly' && (
                  <View style={styles.selectedCheck}>
                    <Text style={styles.selectedCheckMark}>✓</Text>
                  </View>
                )}
                <Text style={styles.planTier}>WEEKLY</Text>
                <Text style={styles.planPrice}>$4.99</Text>
                <View style={styles.perUnitBadge}>
                  <Text style={styles.perUnitText}>$4.99/week</Text>
                </View>
                <Text style={styles.billedText}>Billed weekly</Text>
              </Animated.View>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      {/* 5 — Sticky bottom */}
      <View style={styles.stickyBottom}>
        <PrimaryButton
          label="Unlock My Glow-Up →"
          onPress={() => {
            // TODO: wire RevenueCat here
            console.log('Purchase:', selectedPlan);
          }}
        />
        <Text style={styles.cancelNote}>No commitment. Cancel anytime.</Text>
        <View style={styles.footerRow}>
          <Pressable onPress={() => Linking.openURL('https://peakd.app/privacy')}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Pressable>
          <Pressable onPress={() => console.log('Restore purchases')}>
            <Text style={styles.footerLink}>Restore Purchases</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://peakd.app/terms')}>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 160,
  },

  // 1 — Top
  topSection: {
    paddingTop: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  brandName: {
    fontWeight: '800',
    fontSize: 22,
    color: Colors.textPrimary,
  },
  brandPro: {
    fontWeight: '800',
    fontSize: 22,
    color: Colors.primary,
  },
  stat: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
  },

  // 2 — Testimonial
  testimonialWrapper: {
    marginHorizontal: 24,
    marginTop: 24,
  },
  testimonialCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  testimonialMeta: {
    marginLeft: 12,
  },
  testimonialName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  testimonialHandle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  stars: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 8,
  },
  testimonialTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  testimonialBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 6,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },

  // 3 — Features
  featureSection: {
    marginHorizontal: 24,
    marginTop: 28,
  },
  featureSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featureText: {
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: 14,
  },
  chevron: {
    fontSize: 18,
    color: Colors.textMuted,
  },

  // 4 — Pricing
  pricingSection: {
    marginHorizontal: 24,
    marginTop: 28,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 20,
    position: 'relative',
  },
  mostPopularBadge: {
    position: 'absolute',
    top: -12,
    right: 12,
    backgroundColor: Colors.primary,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mostPopularText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  selectedCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckMark: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  planTier: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  perUnitBadge: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  perUnitText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
  },
  billedText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
  },

  // 5 — Sticky bottom
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  cancelNote: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  footerLink: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
