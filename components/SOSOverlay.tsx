import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import TacticalBlur from './TacticalBlur';
import { useSentioStore } from '../store/useSentioStore';
import { FONTS, getThemePalette } from '../constants/Styles';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSmartGlassesBLE } from '../hooks/useSmartGlassesBLE';

const { width, height } = Dimensions.get('window');

export default function SOSOverlay() {
  const { 
    isCrashOverlayVisible, 
    crashCountdown, 
    crashStatus, 
    tickCrash, 
    finishCrash, 
    cancelCrash,
    sportProfile,
    theme
  } = useSentioStore();

  const { sendCancel } = useSmartGlassesBLE();
  const palette = getThemePalette(sportProfile, theme);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Countdown timer logic
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isCrashOverlayVisible && crashStatus === 'COUNTDOWN') {
      if (crashCountdown > 0) {
        timer = setTimeout(() => {
          tickCrash();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }, 1000);
      } else {
        finishCrash();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
    return () => clearTimeout(timer);
  }, [isCrashOverlayVisible, crashCountdown, crashStatus]);

  // Pulse animation for the background
  useEffect(() => {
    if (isCrashOverlayVisible && crashStatus === 'COUNTDOWN') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isCrashOverlayVisible, crashStatus]);

  if (!isCrashOverlayVisible) return null;

  const isSent = crashStatus === 'SENT';

  return (
    <View style={styles.absoluteFill} pointerEvents="auto">
      <TacticalBlur tint="dark" fallbackOpacity={0.95} style={styles.absoluteFill}>
        {/* Pulsing red background behind everything */}
        <Animated.View 
          style={[
            styles.pulseBg,
            { transform: [{ scale: pulseAnim }], opacity: isSent ? 0.2 : 0.6 }
          ]} 
        />

        <View style={styles.content}>
          <Ionicons name="warning" size={80} color={isSent ? palette.accent : "#FF3B30"} />
          
          <Text style={styles.title}>
            {isSent ? "SOS SENT" : "CRASH DETECTED"}
          </Text>

          <Text style={styles.subtitle}>
            {isSent 
              ? "Vital telemetry and GPS coordinates broadcasted to your squad & emergency contacts." 
              : "High G-Force impact reported from glasses. Sending emergency beacon in..."}
          </Text>

          {!isSent && (
            <Text style={styles.countdownValue}>{crashCountdown}</Text>
          )}

          {isSent && (
            <TouchableOpacity 
              style={[styles.btn, styles.btnAck, { backgroundColor: palette.accent }]} 
              onPress={() => {
                Haptics.selectionAsync();
                cancelCrash();
              }}
            >
              <Text style={styles.btnText}>ACKNOWLEDGE</Text>
            </TouchableOpacity>
          )}

          {!isSent && (
            <TouchableOpacity 
              style={[styles.btn, styles.btnCancel]} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                // Tell the ESP32 glasses to stop their countdown too
                sendCancel();
                cancelCrash();
              }}
            >
              <Text style={styles.btnText}>I'M OKAY (CANCEL)</Text>
            </TouchableOpacity>
          )}
        </View>
      </TacticalBlur>
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  pulseBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF3B30',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    zIndex: 10,
  },
  title: {
    fontFamily: FONTS.sans,
    fontSize: 42,
    color: '#FFF',
    textAlign: 'center',
    marginVertical: 16,
    letterSpacing: 2,
    fontWeight: '900',
  },
  subtitle: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    color: '#EBEBF5',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    fontWeight: '600',
  },
  countdownValue: {
    fontFamily: FONTS.sans,
    fontSize: 160,
    color: '#FFF',
    lineHeight: 180,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  btn: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 16,
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  btnAck: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  btnText: {
    fontFamily: FONTS.sans,
    fontSize: 18,
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1.5,
  }
});
