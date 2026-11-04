import React from 'react';
import { View, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { useTheme } from '@/hooks/useTheme';
import { space, radius, hit } from '@/constants/tokens';
import { haptic } from '@/lib/haptics';
import type { IconName } from '@/constants/sports';

type Props = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  value?: string;
  badge?: string;
  chevron?: boolean;
  toggle?: { value: boolean; onChange: (v: boolean) => void };
  onPress?: () => void;
  disabled?: boolean;
  last?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

/** A row inside a grouped list (`<ListGroup>`). */
export function ListRow({ title, subtitle, icon, iconColor, value, badge, chevron, toggle, onPress, disabled, last, left, right }: Props) {
  const { colors } = useTheme();
  const content = (
    <View style={[styles.row, { minHeight: subtitle ? 64 : hit.min + 4 }]}>
      {left}
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSunken }]}>
          <Ionicons name={icon} size={18} color={iconColor ?? colors.text} />
        </View>
      )}
      <View style={[styles.body, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1, paddingVertical: space.md }}>
          <Text variant="bodyStrong" style={disabled && { opacity: 0.5 }}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="callout" tone="secondary" style={{ marginTop: 2 }}>
              {subtitle}
            </Text>
          )}
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: colors.surfaceSunken }]}>
            <Text variant="caption" tone="secondary">
              {badge}
            </Text>
          </View>
        )}
        {value && (
          <Text variant="callout" tone="secondary" tabular>
            {value}
          </Text>
        )}
        {right}
        {toggle && (
          <Switch
            value={toggle.value}
            onValueChange={(v) => {
              haptic.select();
              toggle.onChange(v);
            }}
            trackColor={{ true: colors.accent, false: colors.surfaceSunken }}
            thumbColor="#FFFFFF"
            accessibilityLabel={title}
          />
        )}
        {chevron && <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />}
      </View>
    </View>
  );

  if (!onPress) return content;
  return (
    <PressableScale scaleTo={0.985} onPress={() => { haptic.tap(); onPress(); }} disabled={disabled} accessibilityRole="button" accessibilityLabel={title}>
      {content}
    </PressableScale>
  );
}

export function ListGroup({ title, footer, children }: { title?: string; footer?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      {title && (
        <Text variant="overline" tone="secondary" style={{ paddingHorizontal: space.xs }}>
          {title}
        </Text>
      )}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          paddingLeft: space.lg,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
      {footer && (
        <Text variant="caption" tone="tertiary" style={{ paddingHorizontal: space.xs }}>
          {footer}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  iconWrap: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingRight: space.lg, alignSelf: 'stretch' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
});
