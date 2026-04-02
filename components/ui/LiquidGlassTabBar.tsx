import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function HomeIcon({ active, dark }: { active: boolean; dark: boolean }) {
  const color = active
    ? '#007AFF'
    : dark
    ? 'rgba(235,235,245,0.4)'
    : 'rgba(60,60,67,0.42)';
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 01-1.5 1.5h-4a1 1 0 01-1-1v-4.5a1 1 0 00-1-1h-3a1 1 0 00-1 1V20.5a1 1 0 01-1 1.5h-4A1.5 1.5 0 013 20V9.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'rgba(0,122,255,0.12)' : 'none'}
      />
    </Svg>
  );
}

function CoachIcon({ active, dark }: { active: boolean; dark: boolean }) {
  const color = active
    ? '#007AFF'
    : dark
    ? 'rgba(235,235,245,0.4)'
    : 'rgba(60,60,67,0.42)';
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L2 7l10 5 10-5-10-5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'rgba(0,122,255,0.1)' : 'none'}
      />
      <Path d="M2 17l10 5 10-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 12l10 5 10-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RoadmapIcon({ active, dark }: { active: boolean; dark: boolean }) {
  const color = active
    ? '#007AFF'
    : dark
    ? 'rgba(235,235,245,0.4)'
    : 'rgba(60,60,67,0.42)';
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'rgba(0,122,255,0.1)' : 'none'}
      />
      <Path d="M9 3v15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M15 6v15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

interface TabItemProps {
  label: string;
  active: boolean;
  dark: boolean;
  icon: React.ReactNode;
  onPress: () => void;
}

function TabItem({ label, active, dark, icon, onPress }: TabItemProps) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 200 });
  }, [active]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelAnim = useAnimatedStyle(() => ({
    opacity: 0.55 + progress.value * 0.45,
  }));

  const dotAnim = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.88, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 200 }); }}
      style={[styles.tabItem, pressStyle]}
      hitSlop={8}
    >
      {icon}
      <Animated.Text
        style={[
          styles.tabLabel,
          dark && styles.tabLabelDark,
          active && styles.tabLabelActive,
          labelAnim,
        ]}
      >
        {label}
      </Animated.Text>
      <Animated.View style={[styles.activeDot, dotAnim]} />
    </AnimatedPressable>
  );
}

interface LiquidGlassTabBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  dark?: boolean;
}

export function LiquidGlassTabBar({ activeTab, onTabPress, dark = false }: LiquidGlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom - 6, 4);

  const tabs = [
    { key: 'home', label: 'Home', Icon: HomeIcon },
    { key: 'coach', label: 'AI Coach', Icon: CoachIcon },
    { key: 'roadmap', label: 'Roadmap', Icon: RoadmapIcon },
  ];

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomPad }]} pointerEvents="box-none">
      <View style={[styles.glassContainer, dark && styles.glassContainerDark]}>
        {/* Real blur — content behind shows through */}
        <BlurView
          intensity={dark ? 50 : 40}
          tint={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterial'}
          style={StyleSheet.absoluteFill}
        />

        {/* Ultra-thin tint — barely perceptible, NOT opaque */}
        <View style={[styles.tintLayer, dark && styles.tintLayerDark]} />

        {/* 1px specular edge — the hallmark of liquid glass */}
        <LinearGradient
          colors={
            dark
              ? ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.0)']
              : ['rgba(255,255,255,0.65)', 'rgba(255,255,255,0.0)']
          }
          style={styles.specularEdge}
        />

        {/* Subtle inner light gradient */}
        <LinearGradient
          colors={
            dark
              ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.0)']
              : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.0)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.innerLight}
        />

        {/* Tabs */}
        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <TabItem
              key={tab.key}
              label={tab.label}
              active={activeTab === tab.key}
              dark={dark}
              icon={<tab.Icon active={activeTab === tab.key} dark={dark} />}
              onPress={() => onTabPress(tab.key)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export const TAB_BAR_HEIGHT = 88;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  glassContainer: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },

  glassContainerDark: {
    borderColor: 'rgba(255,255,255,0.15)',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
    }),
  },

  tintLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  tintLayerDark: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },

  specularEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },

  innerLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
  },

  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 2,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(60,60,67,0.42)',
    marginTop: 3,
  },

  tabLabelDark: {
    color: 'rgba(235,235,245,0.4)',
  },

  tabLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },

  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007AFF',
    marginTop: 3,
  },
});
