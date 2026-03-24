import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSentioStore } from '../store/useSentioStore';
import { THEMES, SPORT_PROFILES, UI } from '../constants/Styles';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function ModeSelector() {
  const insets = useSafeAreaInsets();
  const { theme, setSportProfile, setHasSelectedMode } = useSentioStore();
  const t = THEMES[theme];
  const moto = SPORT_PROFILES.MOTOCROSS;
  const ski = SPORT_PROFILES.SKI;

  const motoScale = useRef(new Animated.Value(1)).current;
  const skiScale = useRef(new Animated.Value(1)).current;

  const pressIn = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 0.95, useNativeDriver: true }).start();
  const pressOut = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 1, friction: 3, useNativeDriver: true }).start();

  const selectMode = (profile: 'MOTOCROSS' | 'SKI') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSportProfile(profile);
    setHasSelectedMode(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: t.background, paddingTop: insets.top }]}>
      {/* Logo */}
      <View style={styles.logoArea}>
        <Text style={[styles.logo, { color: t.text }]}>SENTIO</Text>
        <Text style={[styles.logoSub, { color: t.textSoft }]}>HUD ECOSYSTEM</Text>
      </View>

      {/* Question */}
      <Text style={[styles.question, { color: t.text }]}>
        What are you{'\n'}riding today?
      </Text>

      {/* Cards */}
      <View style={styles.cards}>
        {/* Motocross Card */}
        <Animated.View style={{ transform: [{ scale: motoScale }], flex: 1 }}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: moto.accentSoft, borderColor: moto.accent }]}
            onPress={() => selectMode('MOTOCROSS')}
            onPressIn={() => pressIn(motoScale)}
            onPressOut={() => pressOut(motoScale)}
            activeOpacity={1}
          >
            <Text style={styles.cardEmoji}>🏍️</Text>
            <Text style={[styles.cardTitle, { color: moto.accent }]}>MOTO</Text>
            <Text style={[styles.cardSub, { color: t.textSoft }]}>MTB / Motocross</Text>
            <View style={[styles.cardAccent, { backgroundColor: moto.accent }]} />
          </TouchableOpacity>
        </Animated.View>

        {/* Ski Card */}
        <Animated.View style={{ transform: [{ scale: skiScale }], flex: 1 }}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: ski.accentSoft, borderColor: ski.accent }]}
            onPress={() => selectMode('SKI')}
            onPressIn={() => pressIn(skiScale)}
            onPressOut={() => pressOut(skiScale)}
            activeOpacity={1}
          >
            <Text style={styles.cardEmoji}>🎿</Text>
            <Text style={[styles.cardTitle, { color: ski.accent }]}>SKI</Text>
            <Text style={[styles.cardSub, { color: t.textSoft }]}>Ski / Snowboard</Text>
            <View style={[styles.cardAccent, { backgroundColor: ski.accent }]} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Footer */}
      <Text style={[styles.footer, { color: t.textSoft }]}>
        You can change this anytime in Settings
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: UI.pagePadding,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 12,
  },
  logoSub: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 4,
    marginTop: 4,
  },
  question: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: 32,
    textAlign: 'center',
  },
  cards: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 32,
  },
  card: {
    height: 200,
    borderRadius: UI.borderRadius,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  footer: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
});
