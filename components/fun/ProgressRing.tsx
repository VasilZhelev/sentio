import React from 'react';
import { View } from 'react-native';

type Props = {
  size: number;
  stroke: number;
  progress: number; // 0..1
  color: string;
  track: string;
  hole: string; // background colour inside the ring
  children?: React.ReactNode;
};

/**
 * Circular progress without SVG (react-native-svg is not in the native build).
 * Two clipped half-discs rotate into view; a centre "hole" turns the disc into a ring.
 */
export function ProgressRing({ size, stroke, progress, color, track, hole, children }: Props) {
  const p = Math.max(0, Math.min(1, progress));
  const half = size / 2;
  const right = Math.min(p, 0.5) * 360; // degrees revealed on the right half
  const left = Math.max(0, p - 0.5) * 360; // degrees revealed on the left half

  const halfDisc = (side: 'left' | 'right') => ({
    position: 'absolute' as const,
    top: 0,
    width: half,
    height: size,
    backgroundColor: color,
    ...(side === 'left'
      ? { left: 0, borderTopLeftRadius: half, borderBottomLeftRadius: half }
      : { right: 0, borderTopRightRadius: half, borderBottomRightRadius: half }),
  });

  return (
    <View style={{ width: size, height: size, borderRadius: half, backgroundColor: track, alignItems: 'center', justifyContent: 'center' }}>
      {/* right clip: a left half-disc rotates clockwise into it */}
      <View style={{ position: 'absolute', top: 0, left: half, width: half, height: size, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: 0, left: -half, width: size, height: size, transform: [{ rotate: `${right}deg` }] }}>
          <View style={halfDisc('left')} />
        </View>
      </View>
      {/* left clip: a right half-disc rotates clockwise into it */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: half, height: size, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, transform: [{ rotate: `${left}deg` }] }}>
          <View style={halfDisc('right')} />
        </View>
      </View>
      <View style={{ width: size - stroke * 2, height: size - stroke * 2, borderRadius: half, backgroundColor: hole, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}
