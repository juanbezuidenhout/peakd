import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
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
import { setPendingBase64, setPendingImageUri } from '@/lib/scan-data';

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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  const handleTakePhoto = useCallback(async () => {
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
        setImageUri(result.assets[0].uri);
        setPendingImageUri(result.assets[0].uri);
        if (result.assets[0].base64) {
          setPendingBase64(result.assets[0].base64);
        }
      }
    } catch {
      showToast('Photo capture failed. Please try again.');
    }
  }, [showToast]);

  const handleUploadPhoto = useCallback(async () => {
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
        setImageUri(result.assets[0].uri);
        setPendingImageUri(result.assets[0].uri);
        if (result.assets[0].base64) {
          setPendingBase64(result.assets[0].base64);
        }
      }
    } catch {
      showToast('Image upload failed. Please try again.');
    }
  }, [showToast]);

  const handleReset = useCallback(() => {
    setImageUri(null);
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!imageUri) return;
    router.push({
      pathname: '/scan-processing',
      params: { imageUri },
    });
  }, [imageUri, router]);

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/extras')}
          hitSlop={12}
        >
          <Text style={styles.gearIcon}>⚙️</Text>
        </Pressable>
      </View>

      <Animated.View
        entering={FadeInUp.duration(500)}
        style={styles.previewArea}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.emptyState}>
            <FaceOutlineIcon />
            <Text style={styles.emptyTitle}>
              Upload a front-facing selfie
            </Text>
            <Text style={styles.emptyCaption}>
              Good lighting = better results
            </Text>
          </View>
        )}
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(300).duration(400)}
        style={styles.buttons}
      >
        {imageUri ? (
          <>
            <SecondaryButton label="Use Another" onPress={handleReset} />
            <PrimaryButton label="Analyze My Face" onPress={handleAnalyze} />
          </>
        ) : (
          <>
            <PrimaryButton label="Take a Selfie" onPress={handleTakePhoto} />
            <SecondaryButton
              label="Upload from Library"
              onPress={handleUploadPhoto}
            />
          </>
        )}
      </Animated.View>

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
    borderColor: 'rgba(255, 255, 255, 0.45)',
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
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
});
