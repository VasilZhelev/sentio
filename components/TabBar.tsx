import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TAB_BAR_HEIGHT } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useSentioStore } from '@/store/useSentioStore';
import { radius, space, elevation } from '@/constants/tokens';
import { haptic } from '@/lib/haptics';
import type { IconName } from '@/constants/sports';

const TABS: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'Map', icon: 'map-outline', iconActive: 'map' },
  crew: { label: 'Crew', icon: 'people-outline', iconActive: 'people' },
  stats: { label: 'Stats', icon: 'pulse-outline', iconActive: 'pulse' },
  goggles: { label: 'Goggles', icon: 'glasses-outline', iconActive: 'glasses' },
};

/** Floating, blurred tab bar. The Goggles tab carries a live connection dot. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, isDark, glass } = useTheme();
  const insets = useSafeAreaInsets();
  const bleConnected = useSentioStore((s) => s.bleConnected);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom - 8, space.md) }]}>
      <View style={[styles.bar, { borderColor: colors.border, backgroundColor: glass }, elevation.float]}>
        {Platform.OS === 'ios' && <BlurView intensity={70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />}
        {state.routes.map((route, index) => {
          const cfg = TABS[route.name];
          if (!cfg) return null;
          const focused = state.index === index;
          const color = focused ? colors.accent : colors.textSecondary;
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
                <Ionicons name={focused ? cfg.iconActive : cfg.icon} size={24} color={color} />
                {route.name === 'goggles' && (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: bleConnected ? colors.success : colors.textTertiary, borderColor: isDark ? colors.surface : '#fff' },
                    ]}
                  />
                )}
              </View>
              <Text variant="caption" color={color} style={{ fontSize: 11 }}>
                {cfg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg },
  bar: {
    height: TAB_BAR_HEIGHT,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  dot: { position: 'absolute', top: -1, right: -4, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
});
