import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { DateWheelPicker } from '@/components/ui/WheelPicker';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { setUserAge } from '@/lib/storage';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function QuizAgeScreen() {
  const router = useRouter();
  const [date, setDate] = useState(new Date(2000, new Date().getMonth(), 1));

  const onChange = (selectedDate: Date) => setDate(selectedDate);

  return (
    <SafeScreen>
      <View style={styles.backRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar current={2} total={8} />
      </View>

      <Text style={styles.stepLabel}>STEP 2 OF 8</Text>
      <Text style={styles.headline}>{'When were\nyou born?'}</Text>
      <Text style={styles.subtext}>
        We use this to calibrate your personalised glow-up plan.
      </Text>

      <View style={styles.pickerContainer}>
        <DateWheelPicker
          date={date}
          onDateChange={onChange}
          minimumYear={1990}
          maximumYear={2010}
        />
      </View>

      <View style={styles.spacer} />

      <View style={styles.bottom}>
        <PrimaryButton
          label="Next →"
          onPress={async () => {
            const age = `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
            await setUserAge(age);
            router.push('/(onboarding)/quiz-height');
          }}
        />
      </View>
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
    marginBottom: 32,
  },
  pickerContainer: {
    alignItems: 'center',
    marginHorizontal: -16,
  },
  spacer: {
    flex: 1,
  },
  bottom: {
    paddingBottom: 24,
  },
});
