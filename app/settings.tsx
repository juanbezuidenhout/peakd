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
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { Colors } from '@/constants/colors';
import { getReferralCode } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsItem {
  id: string;
  title: string;
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

export default function SettingsScreen() {
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
            await supabase.auth.signOut();
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
    { id: 'rate', title: 'Rate us', action: handleRateUs },
    {
      id: 'referral',
      title: 'Copy my referral code',
      action: handleCopyReferral,
    },
    {
      id: 'retake',
      title: 'Retake my scan',
      action: handleRetakeScan,
    },
    {
      id: 'support',
      title: 'Contact support',
      action: handleContactSupport,
    },
    {
      id: 'learn',
      title: 'Learn more',
      action: handleLearnMore,
    },
    {
      id: 'delete',
      title: 'Delete my account',
      destructive: true,
      action: handleDeleteAccount,
    },
  ];

  return (
    <SafeScreen style={{ backgroundColor: Colors.surface }}>
      {/* Header with title and close button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Pressable
          onPress={() => router.replace('/(tabs)/home')}
          hitSlop={12}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 6L18 18M18 6L6 18"
              stroke={Colors.textSecondary}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>
      </View>

      {/* Drag handle below header */}
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
    marginTop: 8,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 8,
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
