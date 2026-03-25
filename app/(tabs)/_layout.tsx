import { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { getItem, KEYS } from "@/lib/storage";

export const unstable_settings = {
  initialRouteName: "coach",
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabBarButton({
  route,
  label,
  focused,
  onPress,
  onLongPress,
  showBadge,
}: {
  route: string;
  label: string;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  showBadge?: boolean;
}) {
  const scale = useSharedValue(1);
  const Icon = TAB_ICONS[route];
  const color = focused ? "#FFFFFF" : Colors.textMuted;
  const iconSize = focused ? 26 : 22;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.tabButton, animatedStyle]}
      onPressIn={() => {
        scale.value = withSpring(1.1, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View>
        {Icon && <Icon size={iconSize} color={color} />}
        {showBadge && <View style={styles.badge} />}
      </View>
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </AnimatedPressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [hasScanResult, setHasScanResult] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await getItem(KEYS.SCAN_RESULT);
      setHasScanResult(result != null);
    })();
  }, []);

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
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
              navigation.emit({ type: "tabLongPress", target: route.key });
            }}
          />
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#0A0A0A",
    borderTopWidth: 1,
    borderTopColor: "#1A1A1A",
    paddingTop: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
