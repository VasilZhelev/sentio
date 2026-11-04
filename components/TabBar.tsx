import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Glass, TAB_BAR_HEIGHT } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useSentioStore } from '@/store/useSentioStore';
import { space } from '@/constants/tokens';
import { haptic } from '@/lib/haptics';
import type { IconName } from '@/constants/sports';

const TABS: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'Map', icon: 'map-outline', iconActive: 'map' },
  crew: { label: 'Crew', icon: 'people-outline', iconActive: 'people' },
  stats: { label: 'Stats', icon: 'pulse-outline', iconActive: 'pulse' },
  goggles: { label: 'Goggles', icon: 'glasses-outline', iconActive: 'glasses' },
};

const PAD = 5;

/** Liquid-glass capsule. A brighter glass "lens" glides under the active tab. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bleConnected = useSentioStore((s) => s.bleConnected);
  const [width, setWidth] = useState(0);
  const routes = state.routes.filter((r) => TABS[r.name]);
  const tabW = width > 0 ? (width - PAD * 2) / routes.length : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    if (tabW) x.value = withSpring(PAD + state.index * tabW, { damping: 20, stiffness: 220, mass: 0.7 });
  }, [state.index, tabW, x]);

  const lens = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom - 10, space.md) }]}>
      <Glass style={{ height: TAB_BAR_HEIGHT }}>
        <View style={styles.row} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {tabW > 0 && (
            <Animated.View style={[styles.lensWrap, { width: tabW }, lens]} pointerEvents="none">
              <Glass lens shadow={false} style={StyleSheet.absoluteFill} tint={colors.accentSoft} />
            </Animated.View>
          )}
          {routes.map((route, index) => {
            const cfg = TABS[route.name];
            const focused = state.index === index;
            const color = focused ? colors.accent : colors.text;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={route.name === 'goggles' ? `${cfg.label}, ${bleConnected ? 'connected' : 'not connected'}` : cfg.label}
                onPress={() => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) {
                    haptic.select();
                    navigation.navigate(route.name);
                  }
                }}
                style={styles.tab}
              >
                <View>
                  <Ionicons name={focused ? cfg.iconActive : cfg.icon} size={23} color={color} style={{ opacity: focused ? 1 : 0.85 }} />
                  {route.name === 'goggles' && (
                    <View style={[styles.dot, { backgroundColor: bleConnected ? colors.success : colors.textTertiary }]} />
                  )}
                </View>
                <Text variant="caption" color={color} style={{ fontSize: 10.5, opacity: focused ? 1 : 0.8 }}>
                  {cfg.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22 },
  row: { flex: 1, flexDirection: 'row', paddingHorizontal: PAD },
  lensWrap: { position: 'absolute', left: 0, top: PAD, bottom: PAD },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dot: { position: 'absolute', top: -1, right: -5, width: 8, height: 8, borderRadius: 4 },
});
