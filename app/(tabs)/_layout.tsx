import { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { getItem, KEYS, hasCompletedPurchase } from "@/lib/storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

export const unstable_settings = {
  initialRouteName: "scan",
};

function ScanIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8V5a2 2 0 012-2h3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ExtrasIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={5} r={1.5} fill={color} />
      <Circle cx={12} cy={12} r={1.5} fill={color} />
      <Circle cx={12} cy={19} r={1.5} fill={color} />
    </Svg>
  );
}

function DailyIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CoachIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const TAB_ICONS: Record<string, React.FC<{ size: number; color: string }>> = {
  scan: ScanIcon,
  extras: ExtrasIcon,
  daily: DailyIcon,
  coach: CoachIcon,
};

const SPRING_CONFIG = { damping: 20, stiffness: 190, mass: 0.75 };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BAR_HEIGHT = 64;
const BAR_RADIUS = 28;
const INDICATOR_H_PAD = 5;
const INDICATOR_V_PAD = 8;
const INDICATOR_HEIGHT = BAR_HEIGHT - INDICATOR_V_PAD * 2;
const INDICATOR_RADIUS = 20;

function TabBarButton({
  route,
  label,
  focused,
  onPress,
  onLongPress,
  showBadge,
  width,
}: {
  route: string;
  label: string;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  showBadge?: boolean;
  width: number;
}) {
  const scale = useSharedValue(1);
  const itemOpacity = useSharedValue(focused ? 1 : 0.4);
  const Icon = TAB_ICONS[route];

  useEffect(() => {
    itemOpacity.value = withTiming(focused ? 1 : 0.4, { duration: 220 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: itemOpacity.value,
  }));

  return (
    <AnimatedPressable
      style={[styles.tabButton, { width }, animatedStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.88, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 350 });
      }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onLongPress={onLongPress}
    >
      <View style={styles.iconContainer}>
        {Icon && <Icon size={21} color={Colors.navy} />}
        {showBadge && <View style={styles.badge} />}
      </View>
      <Text style={styles.tabLabel}>{label}</Text>
    </AnimatedPressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [hasScanResult, setHasScanResult] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const indicatorX = useSharedValue(0);
  const numTabs = state.routes.length;

  useEffect(() => {
    (async () => {
      const result = await getItem(KEYS.SCAN_RESULT);
      setHasScanResult(result != null);
    })();
  }, []);

  useEffect(() => {
    if (barWidth <= 0) return;
    const tabW = barWidth / numTabs;
    indicatorX.value = withSpring(
      state.index * tabW + INDICATOR_H_PAD,
      SPRING_CONFIG
    );
  }, [state.index, barWidth, numTabs]);

  const indicatorAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const tabW = barWidth > 0 ? barWidth / numTabs : 0;
  const indicW = tabW - INDICATOR_H_PAD * 2;

  return (
    <View
      style={[styles.outerWrapper, { paddingBottom: insets.bottom + 6 }]}
    >
      <View
        style={styles.glassBar}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {/* Glass base layer */}
        <View style={[StyleSheet.absoluteFill, styles.glassBase]} />

        {/* Top highlight — glass refraction */}
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.6)",
            "rgba(255,255,255,0.2)",
            "transparent",
          ]}
          locations={[0, 0.3, 0.6]}
          style={styles.topHighlight}
        />

        {/* Bottom subtle edge light */}
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.1)"]}
          style={styles.bottomEdge}
        />

        {/* Scrollable tab content */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          alwaysBounceHorizontal
          style={StyleSheet.absoluteFill}
          contentContainerStyle={styles.scrollInner}
        >
          <View style={styles.tabsRow}>
            {/* Liquid indicator pill */}
            {barWidth > 0 && (
              <Animated.View
                style={[
                  styles.indicator,
                  { width: indicW, height: INDICATOR_HEIGHT },
                  indicatorAnimStyle,
                ]}
              >
                <LinearGradient
                  colors={[
                    Colors.primaryGradientStart,
                    Colors.primaryGradientEnd,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    StyleSheet.absoluteFill,
                    { borderRadius: INDICATOR_RADIUS },
                  ]}
                />
                <View style={styles.indicatorShine} />
                <View style={styles.indicatorEdge} />
              </Animated.View>
            )}

            {/* Tab buttons */}
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const label = (options.title ?? route.name) as string;
              const focused = state.index === index;

              return (
                <TabBarButton
                  key={route.key}
                  route={route.name}
                  label={label}
                  focused={focused}
                  width={tabW}
                  showBadge={route.name === "scan" && hasScanResult}
                  onPress={() => {
                    const event = navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!focused && !event.defaultPrevented) {
                      navigation.navigate(route.name);
                    }
                  }}
                  onLongPress={() => {
                    navigation.emit({
                      type: "tabLongPress",
                      target: route.key,
                    });
                  }}
                />
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const [hasPaid, setHasPaid] = useState(false);

  useEffect(() => {
    (async () => {
      const paid = await hasCompletedPurchase();
      setHasPaid(paid);
    })();
  }, []);

  return (
    <Tabs
      tabBar={(props) => hasPaid ? <CustomTabBar {...props} /> : null}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="scan" options={{ title: "scan" }} />
      <Tabs.Screen name="extras" options={{ title: "extras" }} />
      <Tabs.Screen name="daily" options={{ title: "daily" }} />
      <Tabs.Screen name="coach" options={{ title: "coach" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  glassBar: {
    height: BAR_HEIGHT,
    borderRadius: BAR_RADIUS,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: Colors.border,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  glassBase: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
  },
  bottomEdge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  scrollInner: {
    flexGrow: 1,
  },
  tabsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: BAR_HEIGHT,
  },
  indicator: {
    position: "absolute",
    top: INDICATOR_V_PAD,
    borderRadius: INDICATOR_RADIUS,
    overflow: "hidden",
  },
  indicatorShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "42%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderTopLeftRadius: INDICATOR_RADIUS,
    borderTopRightRadius: INDICATOR_RADIUS,
  },
  indicatorEdge: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: INDICATOR_RADIUS,
    borderWidth: 0.5,
    borderColor: Colors.primaryLight,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    height: BAR_HEIGHT,
    gap: 3,
  },
  iconContainer: {
    position: "relative",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.navy,
    letterSpacing: 0.3,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
});
