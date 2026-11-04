import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Surface } from './Surface';
import { useTheme } from '@/hooks/useTheme';
import { space } from '@/constants/tokens';
import type { IconName } from '@/constants/sports';

type Props = {
  label: string;
  value: string;
  unit?: string;
  icon?: IconName;
  caption?: string;
  size?: 'md' | 'lg';
};

/** Label → big tabular value + unit. The atom of every data screen. */
export function StatValue({ label, value, unit, icon, caption, size = 'md' }: Props) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}: ${value} ${unit ?? ''}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon && <Ionicons name={icon} size={14} color={colors.textSecondary} />}
        <Text variant="label" tone="secondary">
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: space.xs }}>
        <Text variant={size === 'lg' ? 'display' : 'title'} tabular style={size === 'md' && { fontSize: 30, lineHeight: 36 }}>
          {value}
        </Text>
        {unit && (
          <Text variant="callout" tone="secondary">
            {unit}
          </Text>
        )}
      </View>
      {caption && (
        <Text variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
          {caption}
        </Text>
      )}
    </View>
  );
}

export function StatTile(props: Props & { style?: StyleProp<ViewStyle> }) {
  return (
    <Surface style={[{ flex: 1, minWidth: '45%' }, props.style]}>
      <StatValue {...props} />
    </Surface>
  );
}
