import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Line, Rect, Circle } from 'react-native-svg';
import { setCompletedPurchase, setRejectedMainPaywall } from '@/lib/storage';
import { LEGAL_URLS } from '@/constants/links';
import { getPromoPackage, purchasePackage, restorePurchases } from '@/lib/purchases';

// ── Design tokens (matching paywall.tsx) ──────────────────────────────────
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
};

// ── SVG Icons ─────────────────────────────────────────────────────────────

function IconSmallCheck() {
  return (
    <Svg width={10} height={8} viewBox="0 0 12 9" fill="none">
      <Path d="M1 4.5L4.5 8L11 1" stroke={C.white} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
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

function IconCheckCircle() {
  return (
    <Svg width={15} height={15} viewBox="0 0 16 16" fill="none">
      <Circle cx={8} cy={8} r={6} stroke={C.blue} strokeWidth={1.3} fill="rgba(74,144,217,0.08)" />
      <Path d="M5.5 8.2L7 9.8L10.5 6.2" stroke={C.blue} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
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

function IconTrendUp() {
  return (
    <Svg width={15} height={15} viewBox="0 0 16 16" fill="none">
      <Path d="M2 12L6 7.5 9 10l5-6" stroke={C.blue} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11 4h3v3" stroke={C.blue} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconStar() {
  return (
    <Svg width={15} height={15} viewBox="0 0 16 16" fill="none">
      <Path d="M8 2l1.5 3.5L13 6l-2.5 2.5.5 3.5L8 10.5 5 12l.5-3.5L3 6l3.5-.5L8 2z" stroke={C.blue} strokeWidth={1.3} strokeLinejoin="round" fill="rgba(74,144,217,0.1)" />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PROMO SCREEN
// ══════════════════════════════════════════════════════════════════════════

export default function PromoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [promoPkg, setPromoPkg] = useState<PurchasesPackage | null>(null);
  const [packageLoaded, setPackageLoaded] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    setRejectedMainPaywall();
    (async () => {
      const pkg = await getPromoPackage();
      setPromoPkg(pkg);
      setPackageLoaded(true);
    })();
  }, []);

  const purchase = async (pkg: PurchasesPackage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasing(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        await setCompletedPurchase();
        router.replace('/(onboarding)/auth');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const success = await restorePurchases();
      if (success) {
        await setCompletedPurchase();
        router.replace('/(onboarding)/auth');
      } else {
        Alert.alert('No Purchases Found', "We couldn't find any previous purchases to restore.");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const priceString = promoPkg?.product.priceString ?? '$14.99';

  const FEATURES = [
    { icon: IconClipboard, text: 'Full 12-point facial analysis' },
    { icon: IconTrendUp, text: 'Personalised 90-day action plan' },
    { icon: IconStar, text: 'Tailored to your unique profile' },
    { icon: IconCheckCircle, text: 'Progress tracking with re-scans' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[C.gradTop, C.gradBottom]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20 }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: C.navy, letterSpacing: -0.3 }}>
            Exclusive Offer
          </Text>
          <Text style={{ fontSize: 14, color: C.textSecondary, marginTop: 6, textAlign: 'center' }}>
            Unlock your full transformation plan at a special price
          </Text>
        </View>

        {/* Feature list */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: '#8B9BB5', letterSpacing: 2, marginBottom: 12 }}>
            EVERYTHING INCLUDED
          </Text>
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: i < FEATURES.length - 1 ? 10 : 0 }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: C.success, alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconSmallCheck />
                </View>
                <Text style={{ fontSize: 13, color: C.textSecondary, flex: 1 }}>{feat.text}</Text>
              </View>
            );
          })}
        </View>

        {/* Pricing Card */}
        <View style={[s.planCard, s.planCardActive, { flexDirection: 'column', alignItems: 'stretch' }]}>
          {/* ONE-TIME OFFER badge */}
          <View style={s.offerBadge}>
            <Text style={s.offerBadgeText}>ONE-TIME OFFER</Text>
          </View>

          <Text style={{ fontSize: 17, fontWeight: '700', color: C.navy, marginBottom: 4 }}>
            Lifetime Access
          </Text>
          <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16 }}>
            Your complete personalised roadmap, built from your scan.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            {!packageLoaded ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', height: 40, gap: 8 }}>
                <ActivityIndicator size="small" color={C.blue} />
                <Text style={{ fontSize: 14, color: C.textMuted }}>Loading price...</Text>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 32, fontWeight: '700', color: C.navy }}>
                  {priceString}
                </Text>
                <Text style={{ fontSize: 13, color: C.textMuted, marginLeft: 6 }}>
                  one-time payment
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Disclaimer */}
        <Text style={{ fontSize: 11, color: '#8B9BB5', textAlign: 'center', marginTop: 16, lineHeight: 16 }}>
          Peakd Pro is required to access your detailed 90-day action plan.
        </Text>

        {/* CTA */}
        <View style={{ marginTop: 12 }}>
          <Pressable
            style={[s.ctaBtn, { backgroundColor: C.success, shadowColor: C.success }, purchasing && { opacity: 0.6 }]}
            onPress={() => {
              if (!promoPkg) {
                Alert.alert('Unable to connect to the App Store. Please check your connection and try again.');
                return;
              }
              purchase(promoPkg);
            }}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={s.ctaBtnText}>Unlock Now</Text>
            )}
          </Pressable>
        </View>

        {/* Restore */}
        <Pressable onPress={handleRestore} disabled={purchasing} style={{ alignItems: 'center', marginTop: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: C.textMuted }}>Restore Purchases</Text>
        </Pressable>

        {/* Footer */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }}>
          <IconShield />
          <Text style={{ fontSize: 11, color: C.textMuted }}>Secure payment</Text>
        </View>

        {/* Legal links */}
        <View style={s.legalRow}>
          <Pressable onPress={() => Linking.openURL(LEGAL_URLS.privacy)}>
            <Text style={s.legalLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={s.legalDot}>·</Text>
          <Pressable onPress={() => Linking.openURL(LEGAL_URLS.terms)}>
            <Text style={s.legalLink}>Terms & Conditions</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: C.cardBg,
    borderWidth: 2,
    borderColor: C.border,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardActive: {
    borderColor: C.blue,
    backgroundColor: C.blueBgSolid,
  },
  offerBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    backgroundColor: '#1A6FE0',
  },
  offerBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.6,
  },
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
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  legalLink: {
    fontSize: 11,
    color: C.textMuted,
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontSize: 11,
    color: C.textMuted,
  },
});
