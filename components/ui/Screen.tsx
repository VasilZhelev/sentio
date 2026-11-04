import React from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { useTheme } from '@/hooks/useTheme';
import { space } from '@/constants/tokens';

/** Height reserved at the bottom of tab screens for the floating tab bar. */
export const TAB_BAR_HEIGHT = 68;
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, space.md) + space.lg;
}

type Props = ScrollViewProps & {
  title?: string;
  subtitle?: string;
  /** Element shown to the right of the large title (e.g. an IconButton). */
  accessory?: React.ReactNode;
  /** Top content above the title (e.g. back button). */
  header?: React.ReactNode;
  inTabs?: boolean;
  gap?: number;
};

/** Standard scrolling screen with a large title. */
export function Screen({ title, subtitle, accessory, header, inTabs = true, gap = space.xxl, children, contentContainerStyle, ...rest }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarSpace();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[
        { paddingTop: insets.top + space.md, paddingHorizontal: space.xl, paddingBottom: inTabs ? bottom : insets.bottom + space.xxl, gap },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {header}
      {title && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm }}>
          <View style={{ flex: 1 }}>
            <Text variant="title" accessibilityRole="header">
              {title}
            </Text>
            {subtitle && (
              <Text variant="callout" tone="secondary" style={{ marginTop: 2 }}>
                {subtitle}
              </Text>
            )}
          </View>
          {accessory}
        </View>
      )}
      {children}
    </ScrollView>
  );
}
