import React from 'react';
import { View, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { useTheme } from '@/hooks/useTheme';
import { elevation } from '@/constants/tokens';
import { haptic } from '@/lib/haptics';
import type { IconName } from '@/constants/sports';

type Props = {
  icon: IconName;
  accessibilityLabel: string;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  size?: number;
  /** glass: floating over the map. tonal: accent tint. plain: no background. */
  variant?: 'glass' | 'solid' | 'tonal' | 'plain';
  label?: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export function IconButton({ icon, accessibilityLabel, onPress, onPressIn, onPressOut, size = 48, variant = 'solid', label, active, style, children }: Props) {
  const { colors, isDark, glass } = useTheme();
  const fg = active ? colors.onAccent : variant === 'tonal' ? colors.accent : colors.text;
  const bg = active ? colors.accent : variant === 'tonal' ? colors.accentSoft : variant === 'solid' ? colors.surfaceRaised : 'transparent';

  return (
    <View style={[{ alignItems: 'center', gap: 6 }, style]}>
      <PressableScale
        onPress={() => {
          haptic.tap();
          onPress?.();
        }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={size < 48 ? (48 - size) / 2 : 0}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: variant === 'glass' && !active ? glass : bg,
            borderWidth: variant === 'glass' || variant === 'solid' ? 1 : 0,
            borderColor: colors.border,
          },
          variant === 'glass' && elevation.float,
        ]}
      >
        {variant === 'glass' && !active && Platform.OS === 'ios' && (
          <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        )}
        <Ionicons name={icon} size={Math.round(size * 0.42)} color={fg} />
        {children}
      </PressableScale>
      {label && (
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
      )}
    </View>
  );
}
