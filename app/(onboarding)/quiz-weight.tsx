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
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { SafeScreen } from '@/components/layout/SafeScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { setUserWeight } from '@/lib/storage';

const ITEM_HEIGHT = 64;
const VISIBLE_COUNT = 3;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;

const LBS_VALUES = Array.from({ length: 211 }, (_, i) => `${90 + i}`);
const KG_VALUES = Array.from({ length: 101 }, (_, i) => `${40 + i}`);

const DEFAULT_LBS_INDEX = LBS_VALUES.indexOf('140');
const DEFAULT_KG_INDEX = KG_VALUES.indexOf('63');

type Unit = 'lbs' | 'kg';

interface PickerColumnProps {
  data: string[];
  initialIndex: number;
  onIndexChange: (index: number) => void;
  unitLabel: string;
}

function PickerColumn({ data, initialIndex, onIndexChange, unitLabel }: PickerColumnProps) {
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
    <View style={styles.columnOuter}>
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
              <View style={styles.itemRow}>
                <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                  {item}
                </Text>
                {isSelected && <Text style={styles.unitLabel}>{unitLabel}</Text>}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function QuizWeightScreen() {
  const router = useRouter();
  const [unit, setUnit] = useState<Unit>('lbs');
  const [lbsIndex, setLbsIndex] = useState(DEFAULT_LBS_INDEX);
  const [kgIndex, setKgIndex] = useState(DEFAULT_KG_INDEX);

  const selectedWeight = unit === 'lbs' ? LBS_VALUES[lbsIndex] : KG_VALUES[kgIndex];

  return (
    <SafeScreen>
      <View style={styles.backRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar current={3} total={8} />
      </View>

      <Text style={styles.stepLabel}>STEP 3 OF 8</Text>
      <Text style={styles.headline}>{'What do\nyou weigh?'}</Text>
      <Text style={styles.subtext}>
        This is factored into your personalised glow-up plan.
      </Text>

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.pill, unit === 'lbs' ? styles.pillActive : styles.pillInactive]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setUnit('lbs'); }}
        >
          <Text style={[styles.pillText, unit === 'lbs' ? styles.pillTextActive : styles.pillTextInactive]}>
            lbs
          </Text>
        </Pressable>
        <Pressable
          style={[styles.pill, unit === 'kg' ? styles.pillActive : styles.pillInactive]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setUnit('kg'); }}
        >
          <Text style={[styles.pillText, unit === 'kg' ? styles.pillTextActive : styles.pillTextInactive]}>
            kg
          </Text>
        </Pressable>
      </View>

      {unit === 'lbs' ? (
        <PickerColumn
          key="lbs"
          data={LBS_VALUES}
          initialIndex={DEFAULT_LBS_INDEX}
          onIndexChange={setLbsIndex}
          unitLabel="lbs"
        />
      ) : (
        <PickerColumn
          key="kg"
          data={KG_VALUES}
          initialIndex={DEFAULT_KG_INDEX}
          onIndexChange={setKgIndex}
          unitLabel="kg"
        />
      )}

      <Pressable
        style={styles.skipWrap}
        onPress={() => router.push('/(onboarding)/quiz-glow')}
        hitSlop={8}
      >
        <Text style={styles.skipText}>Skip this step</Text>
      </Pressable>

      <View style={styles.spacer} />

      <View style={styles.bottom}>
        <PrimaryButton
          label="Next →"
          onPress={async () => {
            await setUserWeight(`${selectedWeight} ${unit}`);
            router.push('/(onboarding)/quiz-glow');
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
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
  },
  pillActive: {
    backgroundColor: Colors.primary,
  },
  pillInactive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextInactive: {
    color: Colors.textSecondary,
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  itemText: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  itemTextSelected: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  unitLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 8,
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
