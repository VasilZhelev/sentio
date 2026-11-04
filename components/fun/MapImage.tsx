import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';

/** Remote image (Mapbox static) with a placeholder tint and a soft fade-in. */
export function MapImage({ uri, style, children, accessibilityLabel }: { uri: string; style?: StyleProp<ViewStyle>; children?: React.ReactNode; accessibilityLabel?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[{ backgroundColor: colors.surfaceSunken, overflow: 'hidden' }, style]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={250}
        cachePolicy="memory-disk"
        accessibilityLabel={accessibilityLabel}
      />
      {children}
    </View>
  );
}

/** Vertical fade to dark, built from bands (no gradient lib in the native build). */
export function Scrim({ from = 0, to = 0.75, position = 'bottom', height = '60%', rgb = '0,0,0' }: { from?: number; to?: number; position?: 'top' | 'bottom'; height?: `${number}%` | number; rgb?: string }) {
  const bands = 12;
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, height }, position === 'bottom' ? { bottom: 0 } : { top: 0 }]}>
      {Array.from({ length: bands }).map((_, i) => {
        const t = (i + 1) / bands;
        const eased = t * t;
        const a = position === 'bottom' ? from + (to - from) * eased : from + (to - from) * ((1 - i / bands) ** 2);
        return <View key={i} style={{ flex: 1, backgroundColor: `rgba(${rgb},${a.toFixed(3)})` }} />;
      })}
    </View>
  );
}
