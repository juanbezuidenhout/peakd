import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { setUserName } from '@/lib/storage';

export default function QuizNameScreen() {
  const router = useRouter();
  const [name, setName] = useState('');

  return (
    <SafeScreen>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.backRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>
        </View>

        <View style={styles.progressWrap}>
          <ProgressBar current={1} total={6} />
        </View>

        <Text style={styles.stepLabel}>STEP 1 OF 6</Text>
        <Text style={styles.headline}>{"What's your\nname?"}</Text>
        <Text style={styles.subtext}>
          This will be used to personalise your experience.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Your first name"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="done"
          onChangeText={setName}
          value={name}
          selectionColor={Colors.primary}
        />

        <View style={styles.spacer} />

        <View style={styles.bottom}>
          <PrimaryButton
            label="Next →"
            disabled={name.trim().length === 0}
            onPress={async () => {
              await setUserName(name.trim());
              router.push('/(onboarding)/quiz-age');
            }}
          />
        </View>
      </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  backChevron: {
    fontSize: 28,
    color: Colors.textSecondary,
  },
  progressWrap: {
    paddingTop: 20,
    marginBottom: 32,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 40,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 40,
  },
  input: {
    height: 60,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  spacer: {
    flex: 1,
  },
  bottom: {
    paddingBottom: 24,
  },
});
