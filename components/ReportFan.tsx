/**
 * ReportFan — Quarter-circle pie menu at the bottom-right screen corner.
 * Pure presentation component animated based on `visible` and `activeSector` props.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSentioStore } from '../store/useSentioStore';
import { FONTS } from '../constants/Styles';

const SCREEN = Dimensions.get('window');

// ── Geometry ──────────────────────────────────────────────────────────────────
const R       = 300;   // Outer radius of the expanded fan
const INNER_R = 75;    // Center dead-zone / button area
const MID_R   = (R + INNER_R) / 2 + 25; // Label placement ring
const D       = R * 2;

// Fan center = bottom-right corner of screen
const CX = SCREEN.width;
const CY = SCREEN.height;

const FAN_START = 180;
const SLICE     = 30; // 90° / 3

// ── Data ──────────────────────────────────────────────────────────────────────
const SKI = [
  { id: 'ICY_SLOPE', emoji: '🧊', label: 'ICY\nSLOPE',   color: '#38BDF8' },
  { id: 'BIG_QUEUE', emoji: '👥', label: 'BIG\nQUEUE',   color: '#A78BFA' },
  { id: 'UNPREPPED', emoji: '😰', label: 'UNPREPPED\nSLOPE', color: '#FB923C' },
];
const MOTO = [
  { id: 'WASH_OUT',  emoji: '🌊', label: 'WASH\nOUT',    color: '#22D3EE' },
  { id: 'ROCK_DROP', emoji: '🪨', label: 'ROCK\nDROP',   color: '#F87171' },
  { id: 'RUT_TRAP',  emoji: '🕳️', label: 'RUT\nTRAP',    color: '#FBBF24' },
];

const toRad = (d: number) => (d * Math.PI) / 180;

function polar(deg: number, r: number) {
  return { x: r * Math.cos(toRad(deg)), y: r * Math.sin(toRad(deg)) };
}

// ── Pie Slice Wedge ───────────────────────────────────────────────────────────
function PieSlice({
  startDeg,
  endDeg,
  color,
  anim,
}: {
  startDeg: number;
  endDeg: number;
  color: string;
  anim: Animated.Value;
}) {
  // Vibrant glowing slice highlight on selection, subtle on idle
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.75] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: D,
        height: D,
        borderRadius: R,
        overflow: 'hidden',
        opacity,
      }}
    >
      {/* Colored semicircle rotated to startDeg */}
      <View
        style={{
          position: 'absolute',
          left: R,
          top: 0,
          width: R,
          height: D,
          backgroundColor: color,
          borderTopRightRadius: R,
          borderBottomRightRadius: R,
          transformOrigin: '0% 50%',
          transform: [{ rotate: `${startDeg + 90}deg` }],
        } as any}
      />
      {/* Mask semicircle (background-colored) at endDeg to clip excess */}
      <View
        style={{
          position: 'absolute',
          left: R,
          top: 0,
          width: R,
          height: D,
          backgroundColor: '#07070E', // Same as base background
          borderTopRightRadius: R,
          borderBottomRightRadius: R,
          transformOrigin: '0% 50%',
          transform: [{ rotate: `${endDeg + 90}deg` }],
        } as any}
      />
    </Animated.View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  activeSector: number;
}

export default function ReportFan({ visible, activeSector }: Props) {
  const { sportProfile } = useSentioStore();
  const sectors = useMemo(() => (sportProfile === 'SKI' ? SKI : MOTO), [sportProfile]);

  // ── Anims ─────────────────────────────────────────────────────────────────
  const expand = useRef(new Animated.Value(0)).current;
  const s0 = useRef(new Animated.Value(0)).current;
  const s1 = useRef(new Animated.Value(0)).current;
  const s2 = useRef(new Animated.Value(0)).current;
  const sAnims = useMemo(() => [s0, s1, s2], []);

  // Spring animation when menu opens/closes
  useEffect(() => {
    Animated.spring(expand, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();
  }, [visible]);

  // Handle active sector animation
  useEffect(() => {
    sAnims.forEach((a, i) => {
      Animated.spring(a, {
        toValue: i === activeSector ? 1 : 0,
        useNativeDriver: true,
        friction: 8,
        tension: 200,
      }).start();
    });
  }, [activeSector, sAnims]);

  // Position the full circle so its center is at (CX, CY).
  // Screen clips it to the top-left quadrant → quarter circle.
  const fanLeft = CX - R;
  const fanTop  = CY - R;

  const scale = expand.interpolate({ inputRange: [0, 1], outputRange: [0.0, 1] });
  const overlayOpacity = expand.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFillObject, styles.overlay, { opacity: overlayOpacity }]}
    >
      {/* Fan circle (only top-left quarter visible on screen) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.fanCircle,
          {
            left: fanLeft,
            top: fanTop,
            width: D,
            height: D,
            borderRadius: R,
            transform: [{ scale }],
          },
        ]}
      >
        {/* Background fill - slightly transparent for map readability */}
        <View style={[styles.fanBg, { borderRadius: R }]} />

        {/* ── Pie slices ── */}
        {sectors.map((s, i) => {
          const sDeg = FAN_START + i * SLICE;
          const eDeg = sDeg + SLICE;
          return (
            <PieSlice
              key={s.id}
              startDeg={sDeg}
              endDeg={eDeg}
              color={s.color}
              anim={sAnims[i]}
            />
          );
        })}

        {/* ── Divider lines ── */}
        {[1, 2].map((i) => {
          const deg = FAN_START + i * SLICE;
          return (
            <View
              key={`div${i}`}
              style={[
                styles.divider,
                {
                  width: R - INNER_R,
                  left: R,
                  top: R - 0.5,
                  transformOrigin: '0% 50%',
                  transform: [
                    { translateX: INNER_R },
                    { rotate: `${deg}deg` },
                    { translateX: -INNER_R },
                  ],
                } as any,
              ]}
            />
          );
        })}

        {/* ── Sector labels ── */}
        {sectors.map((s, i) => {
          const midDeg = FAN_START + i * SLICE + SLICE / 2;
          const p = polar(midDeg, MID_R);
          const lx = R + p.x;
          const ly = R + p.y;

          return (
            <React.Fragment key={`lbl${s.id}`}>
              {/* Emoji */}
              <Animated.Text
                style={[
                  styles.emoji,
                  {
                    left: lx - 24,
                    top: ly - 30,
                    transform: [{
                      scale: sAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.4],
                      }),
                    }],
                  },
                ]}
              >
                {s.emoji}
              </Animated.Text>

              {/* Label */}
              <Animated.Text
                style={[
                  styles.label,
                  {
                    color: '#FFF',
                    left: lx - 45,
                    top: ly + 14,
                    opacity: sAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.65, 1],
                    }),
                    transform: [{
                      scale: sAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.15],
                      }),
                    }],
                  },
                ]}
              >
                {s.label}
              </Animated.Text>
            </React.Fragment>
          );
        })}

        {/* ── Inner cutout ── */}
        <View
          style={[
            styles.innerCut,
            { left: R - INNER_R, top: R - INNER_R },
          ]}
        >
          <Text style={styles.innerEmoji}>⚠️</Text>
        </View>

        {/* Outer ring border */}
        <View style={[styles.outerBorder, { borderRadius: R }]} />
      </Animated.View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    zIndex: 2000,
    backgroundColor: 'rgba(0,0,0,0.3)', // Slightly dimmer for high contrast focus
  },

  fanCircle: {
    position: 'absolute',
    overflow: 'hidden',
  },

  fanBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 7, 14, 0.72)', // Elegant semi-transparency
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  outerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  divider: {
    position: 'absolute',
    height: StyleSheet.hairlineWidth * 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  emoji: {
    position: 'absolute',
    fontSize: 34,
    textAlign: 'center',
    width: 48,
    height: 48,
  },

  label: {
    position: 'absolute',
    width: 90,
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
    fontFamily: FONTS.mono,
    lineHeight: 14,
  },

  innerCut: {
    position: 'absolute',
    width: INNER_R * 2,
    height: INNER_R * 2,
    borderRadius: INNER_R,
    backgroundColor: 'rgba(4, 4, 7, 0.85)', // Slightly transparent cut
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  innerEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
});
