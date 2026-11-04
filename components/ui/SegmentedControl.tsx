import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Text';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/constants/tokens';
import { haptic } from '@/lib/haptics';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors, isDark } = useTheme();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: colors.surfaceSunken, borderRadius: radius.md, padding: 3 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) haptic.select();
              onChange(o.value);
            }}
            style={{
              flex: 1,
              height: 38,
              borderRadius: radius.md - 3,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? (isDark ? colors.surfaceRaised : colors.surface) : 'transparent',
              borderWidth: active && isDark ? 1 : 0,
              borderColor: colors.borderStrong,
            }}
          >
            <Text variant="label" tone={active ? 'primary' : 'secondary'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
