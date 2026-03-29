import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Linking,
  StyleSheet,
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
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const handleRateUs = () => {
    // Placeholder — replace with actual App Store / Play Store URL
    Linking.openURL('https://apps.apple.com');
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@peakd.app');
  };

  const handleLearnMore = () => {
    Linking.openURL('https://peakd.app');
  };

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
            await AsyncStorage.clear();
            router.replace('/(onboarding)');
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
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
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
                style={({ pressed }) => [
                  styles.row,
                  index < items.length - 1 && styles.rowBorder,
                  pressed && styles.rowPressed,
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
    marginTop: 16,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
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
