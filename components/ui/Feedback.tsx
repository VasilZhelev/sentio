import React, { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, useReducedMotion } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Surface } from './Surface';
import { useTheme } from '@/hooks/useTheme';
import { radius, space } from '@/constants/tokens';
import type { IconName } from '@/constants/sports';

export function Skeleton({ width = '100%', height = 16, style }: { width?: number | `${number}%`; height?: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const o = useSharedValue(0.5);
  useEffect(() => {
    if (!reduced) o.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [reduced, o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width, height, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised }, a, style]} />;
}

/** Honest placeholder for features that are designed but not built yet. */
export function ComingSoon({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const { colors } = useTheme();
  return (
    <Surface style={{ alignItems: 'center', paddingVertical: space.xxl, gap: space.sm }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs }}>
        <Text variant="bodyStrong">{title}</Text>
        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.surfaceSunken }}>
          <Text variant="caption" tone="secondary">
            Coming soon
          </Text>
        </View>
      </View>
      <Text variant="callout" tone="secondary" align="center" style={{ maxWidth: 280 }}>
        {body}
      </Text>
    </Surface>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -space.sm }}>
      <Text variant="headline" accessibilityRole="header">
        {title}
      </Text>
      {action}
    </View>
  );
}
