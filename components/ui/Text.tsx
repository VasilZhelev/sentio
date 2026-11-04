import React from 'react';
import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { type as typeScale, tabular as tabularStyle, type TypeVariant, type Colors } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'success' | 'warning' | 'sos' | 'inverse' | 'onAccent' | 'onSos';

const toneKey: Record<Tone, keyof Colors> = {
  primary: 'text',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  sos: 'sos',
  inverse: 'textInverse',
  onAccent: 'onAccent',
  onSos: 'onSos',
};

export type AppTextProps = TextProps & {
  variant?: TypeVariant;
  tone?: Tone;
  color?: string;
  tabular?: boolean;
  align?: TextStyle['textAlign'];
};

export function Text({ variant = 'body', tone = 'primary', color, tabular, align, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={variant === 'hero' || variant === 'display' ? 1.1 : 1.6}
      {...rest}
      style={[typeScale[variant], { color: color ?? colors[toneKey[tone]] }, tabular && tabularStyle, align && { textAlign: align }, style]}
    />
  );
}
