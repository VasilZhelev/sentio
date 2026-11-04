import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { Glass } from './Glass';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/lib/haptics';
import type { IconName } from '@/constants/sports';

type Props = {
  icon: IconName;
  accessibilityLabel: string;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  size?: number;
  /** glass: liquid glass (over imagery/map). solid: tonal fill. tonal: accent tint. plain: icon only. */
  variant?: 'glass' | 'solid' | 'tonal' | 'plain';
  iconColor?: string;
  label?: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export function IconButton({ icon, accessibilityLabel, onPress, onPressIn, onPressOut, size = 48, variant = 'solid', iconColor, label, active, style, children }: Props) {
  const { colors } = useTheme();
  const fg = active ? colors.onAccent : iconColor ?? (variant === 'tonal' ? colors.accent : colors.text);
  const bg = active ? colors.accent : variant === 'tonal' ? colors.accentSoft : variant === 'solid' ? colors.surfaceRaised : 'transparent';

  const icon_ = <Ionicons name={icon} size={Math.round(size * 0.44)} color={fg} />;

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
      >
        {variant === 'glass' && !active ? (
          <Glass style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            {icon_}
            {children}
          </Glass>
        ) : (
          <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
            {icon_}
            {children}
          </View>
        )}
      </PressableScale>
      {label && (
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
      )}
    </View>
  );
}
