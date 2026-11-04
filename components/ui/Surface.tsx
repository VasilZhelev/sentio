import React from 'react';
import { View, type ViewProps } from 'react-native';
import { radius as radii, space } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { Glass } from './Glass';

type Props = ViewProps & {
  /**
   * fill: a quiet tonal panel (no border, no shadow) for grouped content.
   * glass: liquid glass, for anything floating over imagery or the map.
   * raised: popovers / sheets. sunken: wells & inputs.
   * `solid` is kept as an alias of `fill`.
   */
  variant?: 'fill' | 'solid' | 'glass' | 'raised' | 'sunken';
  padding?: number;
  radius?: number;
  /** @deprecated borders are not part of the design language any more */
  bordered?: boolean;
};

export function Surface({ variant = 'fill', padding = space.lg, radius = radii.xl, style, children, bordered: _b, ...rest }: Props) {
  const { colors } = useTheme();

  if (variant === 'glass') {
    return (
      <Glass radius={radius} style={style}>
        <View {...rest} style={{ padding }}>
          {children}
        </View>
      </Glass>
    );
  }

  const bg = { fill: colors.surface, solid: colors.surface, raised: colors.surfaceRaised, sunken: colors.surfaceSunken }[variant];
  return (
    <View {...rest} style={[{ borderRadius: radius, padding, backgroundColor: bg }, style]}>
      {children}
    </View>
  );
}
