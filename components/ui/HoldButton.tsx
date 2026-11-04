import React, { useRef } from 'react';
import { View, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, cancelAnimation, Easing, runOnJS, ReduceMotion } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { haptic } from '@/lib/haptics';
import { radius, space, hit } from '@/constants/tokens';
import type { IconName } from '@/constants/sports';

type Props = {
  label: string;
  holdLabel?: string;
  icon?: IconName;
  onComplete: () => void;
  duration?: number;
  bg: string;
  fill: string;
  fg: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

/**
 * Press-and-hold to confirm. Used for actions that must not happen by accident
 * (manual SOS, cancelling a sent alert). Progress fills left→right while held.
 */
export function HoldButton({ label, holdLabel = 'Keep holding…', icon, onComplete, duration = 1500, bg, fill, fg, height = hit.glove, style, accessibilityHint }: Props) {
  const progress = useSharedValue(0);
  const [holding, setHolding] = React.useState(false);
  const ticks = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTicks = () => {
    if (ticks.current) clearInterval(ticks.current);
    ticks.current = null;
  };

  const done = () => {
    stopTicks();
    setHolding(false);
    progress.value = 0;
    haptic.heavy();
    onComplete();
  };

  const start = () => {
    setHolding(true);
    haptic.warning();
    ticks.current = setInterval(() => haptic.tap(), 300);
    progress.value = withTiming(1, { duration, easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (finished) => {
      if (finished) runOnJS(done)();
    });
  };

  const cancel = () => {
    stopTicks();
    setHolding(false);
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: 180 });
  };

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <Pressable
      onPressIn={start}
      onPressOut={cancel}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint ?? 'Press and hold to confirm'}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'activate' && onComplete()}
      style={[{ height, borderRadius: radius.md + 6, backgroundColor: bg, overflow: 'hidden', justifyContent: 'center' }, style]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: fill }, fillStyle]} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.lg }}>
        {icon && <Ionicons name={icon} size={22} color={fg} />}
        <Text variant="headline" color={fg}>
          {holding ? holdLabel : label}
        </Text>
      </View>
    </Pressable>
  );
}
