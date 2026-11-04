import React from 'react';
import { View, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { useTheme } from '@/hooks/useTheme';
import { radius, hit, space } from '@/constants/tokens';
import { haptic } from '@/lib/haptics';
import type { IconName } from '@/constants/sports';

type Variant = 'primary' | 'secondary' | 'ghost' | 'sos' | 'onSos' | 'onSosOutline';
type Size = 'md' | 'lg' | 'glove';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const heights: Record<Size, number> = { md: hit.min, lg: 56, glove: hit.glove };

export function Button({ label, onPress, variant = 'primary', size = 'lg', icon, loading, disabled, fullWidth, style, accessibilityHint }: Props) {
  const { colors } = useTheme();
  const palette = {
    primary: { bg: colors.accent, fg: colors.onAccent, border: 'transparent' },
    secondary: { bg: colors.surfaceRaised, fg: colors.text, border: colors.borderStrong },
    ghost: { bg: 'transparent', fg: colors.accent, border: 'transparent' },
    sos: { bg: colors.sos, fg: colors.onSos, border: 'transparent' },
    onSos: { bg: 'rgba(255,255,255,0.96)', fg: '#B3141A', border: 'transparent' },
    onSosOutline: { bg: 'transparent', fg: '#FFFFFF', border: 'rgba(255,255,255,0.6)' },
  }[variant];

  return (
    <PressableScale
      onPress={() => {
        haptic.tap();
        onPress?.();
      }}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={[
        {
          height: heights[size],
          borderRadius: radius.md + (size === 'glove' ? 6 : 2),
          backgroundColor: palette.bg,
          borderWidth: palette.border === 'transparent' ? 0 : 1,
          borderColor: palette.border,
          paddingHorizontal: space.xl,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          {icon && <Ionicons name={icon} size={size === 'md' ? 18 : 22} color={palette.fg} />}
          <Text variant={size === 'glove' ? 'headline' : 'bodyStrong'} color={palette.fg}>
            {label}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}
