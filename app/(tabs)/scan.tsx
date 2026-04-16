import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { hasCompletedPurchase, getScanCooldownStatus } from '@/lib/storage';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors } from '@/constants/colors';
import {
  setPendingBase64,
  setPendingImageUri,
  setPendingSideImageUri,
  setPendingSideBase64,
} from '@/lib/scan-data';
import { requestNativeReview } from '@/lib/review';

function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      exiting={FadeOutDown.duration(200)}
      style={toastStyles.toast}
    >
      <Text style={toastStyles.toastText}>{message}</Text>
    </Animated.View>
  );
}

function FaceOutlineIcon() {
  return (
    <View style={iconStyles.container}>
      <View style={[iconStyles.corner, iconStyles.topLeft]} />
      <View style={[iconStyles.corner, iconStyles.topRight]} />
      <View style={[iconStyles.corner, iconStyles.bottomLeft]} />
      <View style={[iconStyles.corner, iconStyles.bottomRight]} />
      <View style={iconStyles.face} />
    </View>
  );
}

export default function ScanScreen() {
  const router = useRouter();
  const [hasPaid, setHasPaid] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [sideImageUri, setSideImageUri] = useState<string | null>(null);
  const [captureStep, setCaptureStep] = useState<'front' | 'side' | 'ready'>(
    'front',
  );
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  useEffect(() => {
    (async () => {
      const paid = await hasCompletedPurchase();
      setHasPaid(paid);

      // Check scan cooldown - redirect to home if not available
      const cooldown = await getScanCooldownStatus();
      if (!cooldown.canRetake) {
        showToast(`Scan available in ${cooldown.daysRemaining} days`);
        router.replace('/(tabs)/home');
      }
    })();
  }, [router, showToast]);

  const takePhoto = useCallback(
    async (target: 'front' | 'side') => {
      try {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
          base64: true,
          cameraType: ImagePicker.CameraType.front,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          if (target === 'front') {
            setImageUri(asset.uri);
            if (asset.base64) setPendingBase64(asset.base64);
            if (captureStep === 'front') setCaptureStep('side');
          } else {
            setSideImageUri(asset.uri);
            if (asset.base64) setPendingSideBase64(asset.base64);
            setCaptureStep('ready');
          }
        }
      } catch {
        showToast('Photo capture failed. Please try again.');
      }
    },
    [showToast, captureStep],
  );

  const uploadPhoto = useCallback(
    async (target: 'front' | 'side') => {
      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          if (target === 'front') {
            setImageUri(asset.uri);
            if (asset.base64) setPendingBase64(asset.base64);
            if (captureStep === 'front') setCaptureStep('side');
          } else {
            setSideImageUri(asset.uri);
            if (asset.base64) setPendingSideBase64(asset.base64);
            setCaptureStep('ready');
          }
        }
      } catch {
        showToast('Image upload failed. Please try again.');
      }
    },
    [showToast, captureStep],
  );

  const handleStartOver = useCallback(() => {
    setImageUri(null);
    setSideImageUri(null);
    setCaptureStep('front');
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!imageUri || !sideImageUri) return;

    setPendingImageUri(imageUri);
    setPendingSideImageUri(sideImageUri);

    // Fire the native iOS review prompt at the moment of peak anticipation —
    // just after the user commits to the scan, before the loading screen appears.
    // The once-per-install guard inside requestNativeReview ensures this never
    // shows more than once. It is non-blocking so navigation proceeds regardless.
    requestNativeReview();

    router.push({
      pathname: '/(onboarding)/analyzing',
      params: { imageUri },
    });
  }, [imageUri, sideImageUri, router]);

  return (
    <SafeScreen scrollable>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(tabs)/home')} hitSlop={12}>
          <Text style={{ fontSize: 28, color: Colors.navy }}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Scan</Text>
        {hasPaid && (
          <Pressable
            onPress={() => router.push('/(tabs)/extras')}
            hitSlop={12}
          >
            <Text style={styles.gearIcon}>⚙️</Text>
          </Pressable>
        )}
      </View>

      {captureStep === 'front' && (
        <>
          <Animated.View
            entering={FadeInUp.duration(500)}
            style={styles.previewArea}
          >
            <View style={styles.emptyState}>
              <FaceOutlineIcon />
              <Text style={styles.emptyTitle}>
                Upload a front-facing selfie
              </Text>
              <Text style={styles.emptyCaption}>
                Good lighting = better results
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(300).duration(400)}
            style={styles.buttons}
          >
            <PrimaryButton
              label="Take a Selfie"
              onPress={() => takePhoto('front')}
            />
            <SecondaryButton
              label="Upload from Library"
              onPress={() => uploadPhoto('front')}
            />
          </Animated.View>
        </>
      )}

      {captureStep === 'side' && (
        <>
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.thumbRow}
          >
            <View style={styles.thumbContainer}>
              <Image source={{ uri: imageUri! }} style={styles.thumbImage} />
              <View style={styles.checkBadge}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(500)}
            style={styles.previewArea}
          >
            <View style={styles.emptyState}>
              <FaceOutlineIcon />
              <Text style={styles.emptyTitle}>Now take a side profile</Text>
              <Text style={styles.emptyCaption}>
                Turn your head to show your profile
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(300).duration(400)}
            style={styles.buttons}
          >
            <PrimaryButton
              label="Take Side Photo"
              onPress={() => takePhoto('side')}
            />
            <SecondaryButton
              label="Upload from Library"
              onPress={() => uploadPhoto('side')}
            />
          </Animated.View>
        </>
      )}

      {captureStep === 'ready' && (
        <>
          <Animated.View
            entering={FadeInUp.duration(500)}
            style={styles.photoRow}
          >
            <Pressable
              style={styles.photoWrapper}
              onPress={() => takePhoto('front')}
            >
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: imageUri! }}
                  style={styles.photoImage}
                />
              </View>
              <Text style={styles.photoLabel}>Front</Text>
            </Pressable>
            <Pressable
              style={styles.photoWrapper}
              onPress={() => takePhoto('side')}
            >
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: sideImageUri! }}
                  style={styles.photoImage}
                />
              </View>
              <Text style={styles.photoLabel}>Side</Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(300).duration(400)}
            style={styles.buttons}
          >
            <PrimaryButton label="Analyze My Face" onPress={handleAnalyze} />
            <SecondaryButton label="Start Over" onPress={handleStartOver} />
          </Animated.View>
        </>
      )}

      <Toast message={toastMessage} visible={toastVisible} />
    </SafeScreen>
  );
}

const toastStyles = StyleSheet.create({
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

const iconStyles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: Colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 6,
  },
  face: {
    width: 42,
    height: 56,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  gearIcon: {
    fontSize: 22,
  },
  previewArea: {
    flexGrow: 1,
    aspectRatio: 3 / 4,
    maxHeight: 480,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '100%',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyCaption: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  buttons: {
    gap: 12,
    paddingTop: 20,
    paddingBottom: 8,
  },
  thumbRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  thumbContainer: {
    width: 60,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  photoRow: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    alignItems: 'center',
    minHeight: 200,
  },
  photoWrapper: {
    width: '45%',
    alignItems: 'center',
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

