import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { useTheme } from '@/hooks/useTheme';
import { radius, space } from '@/constants/tokens';
import { haptic } from '@/lib/haptics';
import type { IconName } from '@/constants/sports';

type Tone = 'neutral' | 'accent' | 'success' | 'warning';

type Props = {
  label: string;
  icon?: IconName;
  dotColor?: string;
  tone?: Tone;
  selected?: boolean;
  onPress?: () => void;
  glass?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, icon, dotColor, tone = 'neutral', selected, onPress, glass, style }: Props) {
  const { colors, glass: glassBg } = useTheme();
  const tones = {
    neutral: { bg: glass ? glassBg : colors.surfaceSunken, fg: colors.text },
    accent: { bg: colors.accentSoft, fg: colors.accent },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
  }[tone];
  const bg = selected ? colors.accent : tones.bg;
  const fg = selected ? colors.onAccent : tones.fg;

  const body = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 36,
          paddingHorizontal: space.md,
          borderRadius: radius.pill,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      {dotColor && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />}
      {icon && <Ionicons name={icon} size={16} color={fg} />}
      <Text variant="label" color={fg} tabular>
        {label}
      </Text>
    </View>
  );

  if (!onPress) return body;
  return (
    <PressableScale
      onPress={() => {
        haptic.select();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      hitSlop={6}
    >
      {body}
    </PressableScale>
  );
}
