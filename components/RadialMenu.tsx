import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import TacticalBlur from './TacticalBlur';
import { useSentioStore } from '../store/useSentioStore';
import { getThemePalette, SPORT_PROFILES, UI, FONTS } from '../constants/Styles';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface RadialMenuProps {
  x: number;
  y: number;
  onSelect: (hazard: string) => void;
  onClose: () => void;
}

const HAZARD_LABELS: Record<string, string> = {
  ICE: 'BLACK ICE',
  CROWDED: 'CROWDED',
  CLOSE_CALL: 'SKIER DOWN',
  TREE: 'TREE WELL',
  MUD: 'DEEP MUD',
  JUMP: 'KICKER',
  CRASH: 'BAIL SITE',
  WASH_OUT: 'WASH OUT',
};

const HAZARD_ICONS: Record<string, any> = {
  ICE: 'snow',
  CROWDED: 'people',
  CLOSE_CALL: 'warning',
  TREE: 'leaf',
  MUD: 'water',
  JUMP: 'trending-up',
  CRASH: 'skull',
  WASH_OUT: 'rainy',
};

export default function RadialMenu({ x, y, onSelect, onClose }: RadialMenuProps) {
  const { sportProfile, theme } = useSentioStore();
  const palette = getThemePalette(sportProfile, theme);
  const p = SPORT_PROFILES[sportProfile];

  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, []);

  const handleSelect = (h: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelect(h);
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={StyleSheet.absoluteFillObject} 
        onPress={onClose} 
        activeOpacity={1} 
      />

      <Animated.View 
        style={[
          styles.container, 
          { 
            left: x - 140, 
            top: y - 140,
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        <TacticalBlur tint="dark" intensity={UI.glassBlur} style={styles.blurBase}>
          <View style={styles.centerNode}>
            <Text style={styles.centerTag}>REPORT</Text>
            <Ionicons name="warning" size={24} color={palette.accent} />
          </View>

          {p.hazardTypes.map((h, i) => {
            const angle = (i * 360) / p.hazardTypes.length - 90;
            const radius = 95;
            const tx = radius * Math.cos((angle * Math.PI) / 180);
            const ty = radius * Math.sin((angle * Math.PI) / 180);

            return (
              <TouchableOpacity
                key={h}
                style={[
                  styles.option,
                  { 
                    transform: [{ translateX: tx }, { translateY: ty }],
                    backgroundColor: 'rgba(0,0,0,0.6)',
                  }
                ]}
                onPress={() => handleSelect(h)}
              >
                <Ionicons name={HAZARD_ICONS[h] || 'alert'} size={24} color="#FFF" />
                <Text style={styles.optionLabel}>{HAZARD_LABELS[h] || h}</Text>
              </TouchableOpacity>
            );
          })}
        </TacticalBlur>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 1000,
  },
  container: {
    position: 'absolute',
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurBase: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  centerNode: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTag: {
    color: '#8E8E93',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
    fontFamily: FONTS.mono,
  },
  option: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionLabel: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: FONTS.sans,
  },
});
