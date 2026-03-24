import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useSentioStore } from '../store/useSentioStore';
import { UI } from '../constants/Styles';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function SOSOverlay() {
  const { setEmergency } = useSentioStore();
  const [countdown, setCountdown] = useState(10);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const hapticRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // ── Pulsing red overlay ──
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    // ── Breathing countdown scale ──
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    // ── Haptic feedback loop ──
    hapticRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 600);

    // ── 10s countdown ──
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          broadcastSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (hapticRef.current) clearInterval(hapticRef.current);
    };
  }, []);

  const broadcastSOS = () => {
    console.log('[GUARDIAN] 🚨 BROADCASTING SOS WITH GPS COORDINATES');
  };

  const cancelEmergency = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setEmergency(false);
  };

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.redBg, { opacity: pulseAnim }]} />

      <View style={styles.content}>
        <Text style={styles.icon}>🚨</Text>
        <Text style={styles.alertText}>CRASH DETECTED</Text>
        <Text style={styles.descText}>Broadcasting SOS in</Text>

        <Animated.Text
          style={[styles.countdownText, { transform: [{ scale: scaleAnim }] }]}
        >
          {countdown}
        </Animated.Text>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={cancelEmergency}
          activeOpacity={0.85}
        >
          <Text style={styles.cancelBtnText}>I'M OK — CANCEL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#DC2626',
  },
  content: {
    alignItems: 'center',
    padding: 32,
    width: '100%',
  },
  icon: { fontSize: 48, marginBottom: 16 },
  alertText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 8,
    textAlign: 'center',
  },
  descText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 120,
    fontWeight: '200',
    fontFamily: UI.fontMono,
    marginBottom: 40,
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    minHeight: UI.minButtonHeight,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#DC2626',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
