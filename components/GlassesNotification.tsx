import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { SlideInUp, SlideOutUp, FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Surface } from '@/components/ui';
import { useSentioStore } from '@/store/useSentioStore';
import { useTheme } from '@/hooks/useTheme';
import { space } from '@/constants/tokens';

const AUTO_HIDE_MS = 3500;

/** Confirmation toast when a message is shown on the goggles' display. */
export default function GlassesNotification() {
  const visible = useSentioStore((s) => s.notificationVisible);
  const text = useSentioStore((s) => s.notificationText);
  const clear = useSentioStore((s) => s.clearNotification);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(clear, AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [visible, text, clear]);

  if (!visible || !text) return null;

  return (
    <Animated.View
      key={text}
      entering={reduced ? FadeIn : SlideInUp.springify().damping(20)}
      exiting={reduced ? FadeOut : SlideOutUp.duration(200)}
      style={[styles.wrap, { top: insets.top + space.sm }]}
      accessibilityLiveRegion="polite"
    >
      <Pressable onPress={clear} accessibilityRole="button" accessibilityLabel={`Shown on goggles: ${text}. Dismiss`}>
        <Surface variant="raised" padding={space.md} radius={20} style={styles.row}>
          <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="glasses" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="caption" tone="secondary">
              Shown on your goggles
            </Text>
            <Text variant="bodyStrong" numberOfLines={2}>
              {text}
            </Text>
          </View>
        </Surface>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.lg, right: space.lg, zIndex: 9000 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
