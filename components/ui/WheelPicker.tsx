import { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Colors } from '@/constants/colors';

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_COUNT / 2);

interface WheelColumnProps {
  items: string[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  width: number | string;
}

function WheelColumn({ items, selectedIndex, onIndexChange, width }: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const isUserScroll = useRef(true);

  useEffect(() => {
    isUserScroll.current = false;
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    const t = setTimeout(() => { isUserScroll.current = true; }, 100);
    return () => clearTimeout(t);
  }, [selectedIndex]);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isUserScroll.current) return;
      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      if (clamped !== selectedIndex) onIndexChange(clamped);
    },
    [items.length, selectedIndex, onIndexChange],
  );

  return (
    <View style={[styles.column, { width: width as any }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{ paddingVertical: PADDING }}
      >
        {items.map((label, i) => {
          const active = i === selectedIndex;
          return (
            <View key={`${label}-${i}`} style={styles.item}>
              <Text
                style={[
                  styles.itemText,
                  active && styles.itemTextActive,
                  !active && styles.itemTextInactive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View pointerEvents="none" style={styles.overlayTop} />
      <View pointerEvents="none" style={styles.overlayBottom} />
      <View pointerEvents="none" style={styles.highlightBand} />
    </View>
  );
}

export function DateWheelPicker({
  date,
  onDateChange,
  minimumYear = 1990,
  maximumYear = 2010,
}: {
  date: Date;
  onDateChange: (d: Date) => void;
  minimumYear?: number;
  maximumYear?: number;
}) {
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const years: number[] = [];
  for (let y = minimumYear; y <= maximumYear; y++) years.push(y);

  const selectedMonth = date.getMonth();
  const selectedYear = date.getFullYear();
  const yearIdx = years.indexOf(selectedYear);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const days: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const selectedDay = Math.min(date.getDate(), daysInMonth);
  const dayIdx = selectedDay - 1;

  const handleChange = useCallback(
    (col: number, idx: number) => {
      let m = selectedMonth;
      let d = selectedDay;
      let y = selectedYear;

      if (col === 0) m = idx;
      else if (col === 1) d = idx + 1;
      else if (col === 2) y = years[idx];

      const maxD = new Date(y, m + 1, 0).getDate();
      if (d > maxD) d = maxD;

      onDateChange(new Date(y, m, d));
    },
    [selectedMonth, selectedDay, selectedYear, years, onDateChange],
  );

  return (
    <View style={styles.root}>
      <WheelColumnGroup>
        <WheelColumn
          items={months}
          selectedIndex={selectedMonth}
          onIndexChange={(i) => handleChange(0, i)}
          width="42%"
        />
        <WheelColumn
          items={days.map(String)}
          selectedIndex={dayIdx}
          onIndexChange={(i) => handleChange(1, i)}
          width="20%"
        />
        <WheelColumn
          items={years.map(String)}
          selectedIndex={yearIdx < 0 ? 0 : yearIdx}
          onIndexChange={(i) => handleChange(2, i)}
          width="30%"
        />
      </WheelColumnGroup>
    </View>
  );
}

function WheelColumnGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    height: PICKER_HEIGHT,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: PICKER_HEIGHT,
  },
  column: {
    height: PICKER_HEIGHT,
    overflow: 'hidden',
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  itemTextActive: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemTextInactive: {
    color: Colors.textSecondary,
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PADDING,
    backgroundColor: Colors.background,
    opacity: 0.25,
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PADDING,
    backgroundColor: Colors.background,
    opacity: 0.25,
  },
  highlightBand: {
    position: 'absolute',
    top: PADDING,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
});
