import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing, useReducedMotion } from 'react-native-reanimated';
import { fun } from '@/constants/tokens';

const COLORS = [fun.gold, fun.pink, fun.lime, fun.violet, '#4FD1FF', fun.flame];

function Piece({ x, delay, color, w, h, drift, spin, fall }: { x: number; delay: number; color: string; w: number; h: number; drift: number; spin: number; fall: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 2200 + Math.random() * 900, easing: Easing.out(Easing.quad) }));
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.85 ? 1 : (1 - t.value) / 0.15,
    transform: [
      { translateX: x + drift * t.value },
      { translateY: -40 + fall * t.value },
      { rotate: `${spin * t.value}deg` },
    ],
  }));
  return <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: w, height: h, borderRadius: 2, backgroundColor: color }, style]} />;
}

/** One-shot confetti burst. Change `burstKey` to fire again. */
export function Confetti({ burstKey, count = 70 }: { burstKey: number; count?: number }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: `${burstKey}-${i}`,
        x: Math.random() * width,
        delay: Math.random() * 300,
        color: COLORS[i % COLORS.length],
        w: 6 + Math.random() * 6,
        h: 10 + Math.random() * 8,
        drift: (Math.random() - 0.5) * 160,
        spin: (Math.random() - 0.5) * 900,
        fall: height * (0.6 + Math.random() * 0.5),
      })),
    [burstKey, count, width, height]
  );
  if (reduced || !burstKey) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => (
        <Piece key={p.id} {...p} />
      ))}
    </View>
  );
}
