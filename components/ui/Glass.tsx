import React from 'react';
import { View, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/useTheme';
import { elevation } from '@/constants/tokens';

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Corner radius. Use 999 for capsules/circles. */
  radius?: number;
  /** Tints the glass (e.g. accent while active). */
  tint?: string;
  /** Stronger, brighter lens look (selected tab, pressed state). */
  lens?: boolean;
  shadow?: boolean;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
};

/**
 * Liquid glass. Layers, bottom → top:
 * blur → tint → specular sheen (top light falling off) → light-catching rim (bright top edge, faint bottom).
 * Where real blur isn't available (Android, web) it degrades to a near-opaque fill with the same rim + sheen.
 */
export function Glass({ children, style, radius = 999, tint, lens, shadow = true, pointerEvents }: Props) {
  const { isDark, colors } = useTheme();
  const ios = Platform.OS === 'ios';

  const base = ios ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.38)') : colors.overlayStrong;
  const sheenTop = isDark ? (lens ? 0.22 : 0.14) : lens ? 0.7 : 0.55;
  const rimTop = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.95)';
  const rimSide = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)';
  const rimBottom = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';

  return (
    <View pointerEvents={pointerEvents} style={[{ borderRadius: radius }, shadow && elevation.float, style]}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]} pointerEvents="none">
        {ios && <BlurView intensity={lens ? 55 : 40} tint={isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'} style={StyleSheet.absoluteFill} />}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: base }]} />
        {tint && <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />}
        {/* specular sheen: light from above */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%' }}>
          {[1, 0.7, 0.45, 0.25, 0.1, 0].map((a, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: `rgba(255,255,255,${(a * sheenTop * 0.35).toFixed(3)})` }} />
          ))}
        </View>
        {/* rim */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius,
              borderWidth: 1,
              borderTopColor: rimTop,
              borderLeftColor: rimSide,
              borderRightColor: rimSide,
              borderBottomColor: rimBottom,
            },
          ]}
        />
      </View>
      {children}
    </View>
  );
}
