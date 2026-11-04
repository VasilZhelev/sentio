import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSentioStore } from '../store/useSentioStore';
import { FONTS } from '../constants/Styles';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const AUTO_HIDE_MS = 4000;

export default function GlassesNotification() {
  const { notificationVisible, notificationText, clearNotification } = useSentioStore();

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (notificationVisible && notificationText) {
      // Cancel any pending auto-hide
      if (timerRef.current) clearTimeout(timerRef.current);

      // Slide in + fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 4 seconds
      timerRef.current = setTimeout(() => {
        hideNotification();
      }, AUTO_HIDE_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notificationVisible, notificationText]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      clearNotification();
    });
  };

  if (!notificationVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      {/* Glassmorphism pill */}
      <View style={styles.pill}>
        <View style={styles.iconWrap}>
          <Ionicons name="glasses-outline" size={20} color="#5E5CE6" />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.label}>GLASSES MESSAGE</Text>
          <Text style={styles.message} numberOfLines={2}>
            {notificationText}
          </Text>
        </View>
        {/* Animated progress bar */}
        <ProgressBar durationMs={AUTO_HIDE_MS} color="#5E5CE6" />
      </View>
    </Animated.View>
  );
}

function ProgressBar({ durationMs, color }: { durationMs: number; color: string }) {
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    progress.setValue(1);
    Animated.timing(progress, {
      toValue: 0,
      duration: durationMs,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.progressBase}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            backgroundColor: color,
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9000,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56, // Safe area offset — below status bar
  },
  pill: {
    width: width - 32,
    backgroundColor: 'rgba(28, 28, 30, 0.96)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(94, 92, 230, 0.4)',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#5E5CE6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(94, 92, 230, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textWrap: {
    flex: 1,
    paddingBottom: 8,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#5E5CE6',
    fontFamily: FONTS.mono,
    marginBottom: 3,
  },
  message: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.sans,
    lineHeight: 20,
  },
  progressBase: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
