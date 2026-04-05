import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Linking,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeOutDown,
  SlideInDown,
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { Colors } from '@/constants/colors';
import { getReferralCode } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { requestNativeReview } from '@/lib/review';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';

interface SettingsItem {
  id: string;
  title: string;
  emoji: string;
  destructive?: boolean;
  action: () => void;
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      exiting={FadeOutDown.duration(200)}
      style={styles.toast}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

export default function ExtrasScreen() {
  const router = useRouter();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, []);

  const handleCopyReferral = async () => {
    const code = (await getReferralCode()) ?? 'PEAKD2026';
    await Clipboard.setStringAsync(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('Copied!');
  };

  const handleRateUs = async () => {
    // Trigger the native in-app review prompt (SKStoreReviewController on iOS,
    // ReviewManager on Android).  Falls back silently if unavailable.
    await requestNativeReview(true);
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@peakd.app');
  };

  const handleLearnMore = () => {
    Linking.openURL('https://peakd.app');
  };

  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.access_token) {
                Alert.alert('Error', 'You must be signed in to delete your account.');
                return;
              }

              const res = await fetch(
                `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                    apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
                  },
                },
              );

              if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Deletion failed');
              }

              await supabase.auth.signOut();
              await AsyncStorage.clear();
              router.replace('/(onboarding)');
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Could not delete account. Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleRetakeScan = () => {
    router.push('/(tabs)/scan');
  };

  const items: SettingsItem[] = [
    { id: 'rate', title: 'Rate us', emoji: '⭐', action: handleRateUs },
    {
      id: 'referral',
      title: 'Copy my referral code',
      emoji: '#',
      action: handleCopyReferral,
    },
    {
      id: 'retake',
      title: 'Retake my scan',
      emoji: '💄',
      action: handleRetakeScan,
    },
    {
      id: 'support',
      title: 'Contact support',
      emoji: '✉️',
      action: handleContactSupport,
    },
    {
      id: 'learn',
      title: 'Learn more',
      emoji: '📋',
      action: handleLearnMore,
    },
    {
      id: 'delete',
      title: 'Delete my account',
      emoji: '❌',
      destructive: true,
      action: handleDeleteAccount,
    },
  ];

  return (
    <SafeScreen>
      {/* Header with close button */}
      <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Pressable
          onPress={() => router.replace('/(tabs)/home')}
          hitSlop={12}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 6L18 18M18 6L6 18"
              stroke={Colors.textPrimary}
              strokeWidth={3}
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>
      </Animated.View>

      {/* Bottom sheet card */}
      <Animated.View
        entering={SlideInDown.delay(150).duration(500).springify().damping(18)}
        style={styles.sheet}
      >
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {items.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInUp.delay(250 + index * 60).duration(400)}
            >
              <Pressable
                onPress={item.action}
                disabled={item.destructive && deleting}
                style={({ pressed }) => [
                  styles.row,
                  index < items.length - 1 && styles.rowBorder,
                  pressed && styles.rowPressed,
                  item.destructive && deleting && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.rowEmoji}>{item.emoji}</Text>
                <Text
                  style={[
                    styles.rowTitle,
                    item.destructive && styles.rowTitleDestructive,
                  ]}
                >
                  {item.title}
                </Text>
                {item.destructive && deleting && (
                  <ActivityIndicator size="small" color={Colors.error} />
                )}
              </Pressable>
            </Animated.View>
          ))}

          {/* Footer links */}
          <View style={styles.footer}>
            <Pressable onPress={() => Linking.openURL('https://peakd.app/privacy')}>
              <Text style={styles.footerLink}>Privacy</Text>
            </Pressable>
            <Text style={styles.footerDot}>·</Text>
            <Pressable onPress={() => Linking.openURL('https://peakd.app/terms')}>
              <Text style={styles.footerLink}>Terms</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Toast overlay */}
      <Toast message={toastMessage} visible={toastVisible} />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },

  sheet: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginHorizontal: -20,
    overflow: 'hidden',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowEmoji: {
    fontSize: 20,
    width: 36,
    textAlign: 'center',
  },
  rowTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  rowTitleDestructive: {
    color: Colors.error,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  footerLink: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  footerDot: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
