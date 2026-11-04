import React from 'react';
import { View, Image, type ImageSourcePropType } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  source: ImageSourcePropType;
  size?: number;
  ringColor?: string;
  status?: 'online' | 'idle' | 'offline';
};

export function Avatar({ source, size = 40, ringColor, status }: Props) {
  const { colors } = useTheme();
  const ring = ringColor ? 2 : 0;
  const statusColor = status === 'online' ? colors.success : status === 'idle' ? colors.warning : colors.textTertiary;
  const dot = Math.max(10, Math.round(size * 0.26));

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ring,
          borderColor: ringColor,
          padding: ring ? 2 : 0,
          backgroundColor: colors.surfaceSunken,
        }}
      >
        <Image source={source} style={{ width: '100%', height: '100%', borderRadius: size }} />
      </View>
      {status && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: statusColor,
            borderWidth: 2,
            borderColor: colors.surface,
          }}
        />
      )}
    </View>
  );
}
