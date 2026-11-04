import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useSocialStore } from '@/store/useSocialStore';
import { useSentioStore } from '@/store/useSentioStore';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/lib/haptics';
import { radius, space, fun } from '@/constants/tokens';
import { BadgeMedal } from './BadgeMedal';
import { Confetti } from './Confetti';

/** Global: badge unlocks, level-ups, completed challenges. Tap anywhere to dismiss. */
export function CelebrationOverlay() {
  const c = useSocialStore((s) => s.celebration);
  const dismiss = useSocialStore((s) => s.dismissCelebration);
  const sosVisible = useSentioStore((s) => s.isCrashOverlayVisible);
  const { colors } = useTheme();

  useEffect(() => {
    if (!c) return;
    haptic.success();
    const t = setTimeout(dismiss, 3800);
    return () => clearTimeout(t);
  }, [c, dismiss]);

  if (!c || sosVisible) return null;

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(220)} style={[StyleSheet.absoluteFill, { zIndex: 8000, backgroundColor: 'rgba(0,0,0,0.6)' }]}>
      <Pressable style={styles.center} onPress={dismiss} accessibilityRole="button" accessibilityLabel={`${c.title}. ${c.subtitle}. Dismiss`}>
        <Confetti burstKey={c.id} />
        <Animated.View entering={ZoomIn.springify().damping(11).stiffness(180)}>
          <BadgeMedal icon={c.icon} tier={c.tier} size={132} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(150).springify()} style={{ alignItems: 'center', gap: space.sm, marginTop: space.xxl, paddingHorizontal: space.xxl }}>
          <Text variant="title" color="#fff" align="center" style={{ fontSize: 32, lineHeight: 38 }}>
            {c.title}
          </Text>
          <Text variant="body" color="rgba(255,255,255,0.8)" align="center">
            {c.subtitle}
          </Text>
          <Text variant="label" color={colors.textTertiary} style={{ marginTop: space.lg }}>
            Tap to continue
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** Global "+25 XP" pill that floats up from the bottom. */
export function XpToast() {
  const toast = useSocialStore((s) => s.xpToast);
  const clear = useSocialStore((s) => s.clearXpToast);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, 1800);
    return () => clearTimeout(t);
  }, [toast, clear]);

  if (!toast) return null;
  return (
    <Animated.View key={toast.id} entering={FadeInDown.springify().damping(14)} exiting={FadeOutUp.duration(250)} pointerEvents="none" style={[styles.xpWrap, { bottom: insets.bottom + 120 }]}>
      <View style={styles.xpPill}>
        <Text variant="bodyStrong" color="#1A1200" tabular>
          +{toast.amount} XP
        </Text>
        <Text variant="caption" color="rgba(26,18,0,0.7)" numberOfLines={1} style={{ maxWidth: 180 }}>
          {toast.reason}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  xpWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 7000 },
  xpPill: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: fun.gold, paddingHorizontal: space.lg, height: 40, borderRadius: radius.pill, shadowColor: fun.gold, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
});
