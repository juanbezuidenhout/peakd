import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { setUserAge } from '@/lib/storage';

const ITEM_HEIGHT = 52;
const VISIBLE_COUNT = 3;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS = Array.from({ length: 31 }, (_, i) => `${i + 1}`);
const YEARS = Array.from({ length: 21 }, (_, i) => `${2010 - i}`);

interface PickerColumnProps {
  data: string[];
  initialIndex: number;
  onIndexChange: (index: number) => void;
  flex?: number;
}

function PickerColumn({ data, initialIndex, onIndexChange, flex = 1 }: PickerColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [selected, setSelected] = useState(initialIndex);

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, data.length - 1));
      setSelected(clamped);
      onIndexChange(clamped);
    },
    [data.length, onIndexChange],
  );

  return (
    <View style={[styles.columnOuter, { flex }]}>
      <View style={styles.selectionOverlay} pointerEvents="none">
        <View style={styles.selectionBorderTop} />
        <View style={styles.selectionBorderBottom} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.columnScroll}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentOffset={{ x: 0, y: initialIndex * ITEM_HEIGHT }}
      >
        {data.map((item, i) => {
          const isSelected = i === selected;
          return (
            <View key={item} style={styles.item}>
              <Text
                style={[
                  styles.itemText,
                  isSelected && styles.itemTextSelected,
                ]}
              >
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function QuizAgeScreen() {
  const router = useRouter();
  const currentMonthIndex = new Date().getMonth();
  const defaultYearIndex = YEARS.indexOf('2000');

  const [selectedMonth, setSelectedMonth] = useState(currentMonthIndex);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedYear, setSelectedYear] = useState(defaultYearIndex);

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

      <View style={styles.pickerRow}>
        <PickerColumn
          data={MONTHS}
          initialIndex={currentMonthIndex}
          onIndexChange={setSelectedMonth}
          flex={2}
        />
        <PickerColumn
          data={DAYS}
          initialIndex={0}
          onIndexChange={setSelectedDay}
        />
        <PickerColumn
          data={YEARS}
          initialIndex={defaultYearIndex}
          onIndexChange={setSelectedYear}
        />
      </View>

      <Pressable
        style={styles.skipWrap}
        onPress={() => router.push('/(onboarding)/quiz-weight')}
        hitSlop={8}
      >
        <Text style={styles.skipText}>Skip this step</Text>
      </Pressable>

      <View style={styles.spacer} />

      <View style={styles.bottom}>
        <PrimaryButton
          label="Next →"
          onPress={async () => {
            const age = `${MONTHS[selectedMonth]} ${DAYS[selectedDay]}, ${YEARS[selectedYear]}`;
            await setUserAge(age);
            router.push('/(onboarding)/quiz-weight');
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
    marginBottom: 40,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  columnOuter: {
    height: CONTAINER_HEIGHT,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  selectionBorderTop: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  selectionBorderBottom: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  columnScroll: {
    height: CONTAINER_HEIGHT,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  itemTextSelected: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  skipWrap: {
    alignItems: 'center',
    marginTop: 16,
  },
  skipText: {
    fontSize: 13,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  spacer: {
    flex: 1,
  },
  bottom: {
    paddingBottom: 24,
  },
});
