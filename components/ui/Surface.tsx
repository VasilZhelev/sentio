import React from 'react';
import { View, StyleSheet, Platform, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { radius as radii, space, elevation } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

type Props = ViewProps & {
  /** solid: cards on a screen. glass: floating over the map. raised: sheets/popovers. sunken: wells & inputs. */
  variant?: 'solid' | 'glass' | 'raised' | 'sunken';
  padding?: number;
  radius?: number;
  bordered?: boolean;
};

export function Surface({ variant = 'solid', padding = space.lg, radius = radii.lg, bordered = true, style, children, ...rest }: Props) {
  const { colors, isDark, glass } = useTheme();

  const base = {
    borderRadius: radius,
    padding,
    borderWidth: bordered ? StyleSheet.hairlineWidth * 2 : 0,
    borderColor: colors.border,
  };

  if (variant === 'glass') {
    return (
      <View {...rest} style={[base, { overflow: 'hidden', padding: 0, backgroundColor: glass }, elevation.float, style]}>
        {Platform.OS === 'ios' && <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />}
        <View style={{ padding }}>{children}</View>
      </View>
    );
  }

  const bg = { solid: colors.surface, raised: colors.surfaceRaised, sunken: colors.surfaceSunken }[variant];
  return (
    <View {...rest} style={[base, { backgroundColor: bg }, variant === 'raised' && elevation.float, !isDark && variant === 'solid' && elevation.card, style]}>
      {children}
    </View>
  );
}
