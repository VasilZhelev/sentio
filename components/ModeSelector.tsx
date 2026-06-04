import React, { useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import TacticalBlur from '../components/TacticalBlur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSentioStore } from '../store/useSentioStore';
import { getThemePalette, SPORT_PROFILES, UI, FONTS, TACTICAL_TAG } from '../constants/Styles';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function ModeSelector() {
  const insets = useSafeAreaInsets();
  const { theme, setSportProfile, setHasSelectedMode } = useSentioStore();
  
  // Base palette for selector
  const palette = useMemo(() => getThemePalette('SKI', theme), [theme]);
  const motoPalette = useMemo(() => getThemePalette('MOTOCROSS', theme), [theme]);
  const skiPalette = useMemo(() => getThemePalette('SKI', theme), [theme]);
  
  const motoScale = useRef(new Animated.Value(1)).current;
  const skiScale = useRef(new Animated.Value(1)).current;

  const pressIn = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 0.94, useNativeDriver: true }).start();
  const pressOut = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 1, friction: 3, useNativeDriver: true }).start();

  const selectMode = (profile: 'MOTOCROSS' | 'SKI') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSportProfile(profile);
    setHasSelectedMode(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: '#000' }]}>
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        
        <View style={styles.header}>
          <Text style={styles.logo}>SENTIO</Text>
          <Text style={TACTICAL_TAG(palette)}>[ HUD SYSTEM // INITIALIZING... ]</Text>
        </View>

        <Text style={styles.question}>SELECT OPERATIONAL MODE</Text>

        <View style={styles.cards}>
          <Animated.View style={{ transform: [{ scale: motoScale }], flex: 1 }}>
            <TouchableOpacity
              style={[styles.card, { borderColor: motoPalette.accent }]}
              onPress={() => selectMode('MOTOCROSS')}
              onPressIn={() => pressIn(motoScale)}
              onPressOut={() => pressOut(motoScale)}
              activeOpacity={1}
            >
              <TacticalBlur tint="dark" intensity={UI.glassBlur} style={styles.cardBlur}>
                <Text style={styles.cardEmoji}>🏍️</Text>
                <Text style={[styles.cardTitle, { color: motoPalette.accent }]}>TRAILS</Text>
                <Text style={styles.cardSub}>MTB / MOTO</Text>
                <View style={[styles.accentBar, { backgroundColor: motoPalette.accent }]} />
              </TacticalBlur>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: skiScale }], flex: 1 }}>
            <TouchableOpacity
              style={[styles.card, { borderColor: skiPalette.accent }]}
              onPress={() => selectMode('SKI')}
              onPressIn={() => pressIn(skiScale)}
              onPressOut={() => pressOut(skiScale)}
              activeOpacity={1}
            >
              <TacticalBlur tint="dark" intensity={UI.glassBlur} style={styles.cardBlur}>
                <Text style={styles.cardEmoji}>🎿</Text>
                <Text style={[styles.cardTitle, { color: skiPalette.accent }]}>SLOPES</Text>
                <Text style={styles.cardSub}>SKI / SNOW</Text>
                <View style={[styles.accentBar, { backgroundColor: skiPalette.accent }]} />
              </TacticalBlur>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ALL TELEMETRY DATA WILL BE LOGGED TO THE SECURE SQUAD CLOUD
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, padding: UI.pagePadding },

  header: { alignItems: 'center', marginBottom: 60 },
  logo: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 12,
    fontFamily: FONTS.sans,
    marginBottom: 8,
  },

  question: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: FONTS.mono,
  },

  cards: { flexDirection: 'row', gap: 12, height: 220 },
  card: { flex: 1, borderRadius: UI.borderRadius, borderWidth: 1, overflow: 'hidden' },
  cardBlur: { flex: 1, padding: 12, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 44, marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 2, fontFamily: FONTS.sans },
  cardSub: { color: '#8E8E93', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 4, fontFamily: FONTS.mono },
  accentBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 6 },

  footer: { marginTop: 'auto', marginBottom: 40, opacity: 0.4 },
  footerText: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: FONTS.mono,
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 14,
  },
});
