import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  PanResponder,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import TacticalBlur from '../../components/TacticalBlur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSentioStore } from '../../store/useSentioStore';
import { getThemePalette, UI, FONTS } from '../../constants/Styles';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import ModeSelector from '../../components/ModeSelector';
import { useSmartGlassesBLE } from '../../hooks/useSmartGlassesBLE';
import { EmojiSpam } from '../../components/EmojiSpam';
import { usePamporovoSimulation } from '../../hooks/usePamporovoSimulation';
import ReportFan from '../../components/ReportFan';
import { useTerminalBridge } from '../../hooks/useTerminalBridge';

// Token is set once at root in _layout.tsx — no need to call setAccessToken here.

const { width, height } = Dimensions.get('window');

export default function RadarScreen() {
  const insets = useSafeAreaInsets();
  const { theme, sportProfile, hasSelectedMode, telemetry, squadStatus, ghostRiders, triggerCrash, glassesBattery } = useSentioStore();
  const palette = useMemo(() => getThemePalette(sportProfile, theme), [sportProfile, theme]);

  const [mapLoaded, setMapLoaded] = useState(false);

  const { sendCommandToDisplay } = useSmartGlassesBLE();
  const [spamData, setSpamData] = useState({ ts: 0, emoji: '' });

  const [selectedRider, setSelectedRider] = useState<any>(null);
  const slideAnim = useRef(new Animated.Value(400)).current;

  // Start the Pamporovo simulation — moves 4 friends on pistes + lifts
  usePamporovoSimulation(['g1', 'g2', 'g3', 'g4']);

  // Dynamic Terminal Bridge link
  useTerminalBridge((emoji) => {
    setSpamData({ ts: Date.now(), emoji });
  });

  const [fanVisible, setFanVisible] = useState(false);
  const [activeSector, setActiveSector] = useState<number>(1);
  const reportBtnScale = useRef(new Animated.Value(1)).current;

  // Track active sector using ref for instant access inside PanResponder callbacks
  const activeSectorRef = useRef<number>(1);

  // Dynamic hitTest mapping absolute screen drag coordinates to sectors
  const hitTest = (px: number, py: number): number => {
    const dx = px - width;   // Distance relative to screen right edge
    const dy = py - height;  // Distance relative to screen bottom edge

    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (deg < 0) deg += 360;

    // Clamp angle to the active quarter quadrant [180°, 270°]
    if (deg < 180 || deg > 270) {
      if (deg > 270 && deg < 360) deg = 270;
      else if (deg >= 0 && deg < 90) deg = 270;
      else deg = 180;
    }

    const idx = Math.floor((deg - 180) / 30); // 30 degrees per slice
    return Math.min(Math.max(idx, 0), 2);
  };

  const updateActiveSector = (idx: number) => {
    if (idx === activeSectorRef.current) return;
    activeSectorRef.current = idx;
    setActiveSector(idx);
    Haptics.selectionAsync();
  };

  const reportPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setFanVisible(true);
        activeSectorRef.current = 1;
        setActiveSector(1);
        Animated.spring(reportBtnScale, {
          toValue: 1.15,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        const idx = hitTest(pageX, pageY);
        updateActiveSector(idx);
      },
      onPanResponderRelease: () => {
        const idx = activeSectorRef.current;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Dynamic reporting triggers
        const sectors = sportProfile === 'SKI' 
          ? ['ICY_SLOPE', 'BIG_QUEUE', 'UNPREPPED'] 
          : ['WASH_OUT', 'ROCK_DROP', 'RUT_TRAP'];
        
        console.log(`[REPORT SYSTEM] Reported: ${sectors[idx]}`);
        
        Animated.spring(reportBtnScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start(() => {
          setFanVisible(false);
        });
      },
      onPanResponderTerminate: () => {
        Animated.spring(reportBtnScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start(() => {
          setFanVisible(false);
        });
      },
    })
  ).current;

  useEffect(() => {
    if (selectedRider) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 250, useNativeDriver: true }).start();
    }
  }, [selectedRider]);

  if (!hasSelectedMode) return <ModeSelector />;

  const onRiderPress = (rider: any) => {
    Haptics.selectionAsync();
    setSelectedRider(rider);
  };

  // Use the user's custom Mapbox studio style for both themes
  const styleURL = 'mapbox://styles/vasil-zhelev/cmn3epolr002q01ql4jwcfwdi';

  return (
    <View style={styles.root}>
      {/* ── MAP ── */}
      <Mapbox.MapView
        style={StyleSheet.absoluteFillObject}
        styleURL={styleURL}
        logoEnabled={true}
        attributionEnabled={false}
        compassEnabled={false}
        onPress={() => setSelectedRider(null)}
        onDidFinishLoadingStyle={() => setMapLoaded(true)}
      >
        <Mapbox.Camera
          zoomLevel={13.5}
          centerCoordinate={[telemetry.longitude, telemetry.latitude]}
          pitch={60}
          animationDuration={0}
        />

        {/* User Marker: now "different" with a unique memoji and glow */}
        <Mapbox.MarkerView id="user" coordinate={[telemetry.longitude, telemetry.latitude]}>
          <View style={styles.riderWrap}>
            <View style={[styles.meRing, { borderColor: palette.accent }]} />
            <Image source={require('../../assets/images/avatar_user.png')} style={[styles.riderAvatar, { borderColor: palette.accent, borderWidth: 2 }]} />
            <View style={[styles.meDot, { backgroundColor: palette.accent }]} />
          </View>
        </Mapbox.MarkerView>

        {ghostRiders.map((rider) => (
          <Mapbox.MarkerView
            key={rider.id}
            id={rider.id}
            coordinate={[rider.longitude, rider.latitude]}
          >
            <TouchableOpacity onPress={() => onRiderPress(rider)} activeOpacity={0.8}>
              <View style={styles.riderWrap}>
                <View style={styles.riderLabel}>
                  <Text style={styles.riderName}>{rider.name}</Text>
                  <Text style={styles.riderSpeed}>{rider.speed}km/h</Text>
                </View>
                <View style={[styles.riderRing, { borderColor: palette.accent }]} />
                <Image source={rider.avatarUri} style={styles.riderAvatar} />
              </View>
            </TouchableOpacity>
          </Mapbox.MarkerView>
        ))}
      </Mapbox.MapView>

      {!mapLoaded && (
        <View style={[styles.loadingOverlay, StyleSheet.absoluteFillObject]}>
          <View style={[styles.spinner, { borderColor: palette.accent }]} />
          <Text style={styles.loadingText}>WARMING UP RADAR...</Text>
        </View>
      )}

      {/* ── TOP HUD — three separated tactical pills ── */}
      <View style={[styles.pillsRow, { top: insets.top + 12, opacity: mapLoaded ? 1 : 0 }]}>
        <TacticalBlur tint="dark" style={[styles.pill, UI.tacticalShadow]}>
          <TouchableOpacity onLongPress={triggerCrash} activeOpacity={0.7}>
            <Text style={styles.pillTitle}>RADAR</Text>
          </TouchableOpacity>
        </TacticalBlur>

        <TacticalBlur tint="dark" style={[styles.pill, styles.pillCenter, UI.tacticalShadow]}>
          <Text style={styles.pillMono}>[ G: {(telemetry.gForce || 0).toFixed(1)}G // BAT: {glassesBattery}% ]</Text>
        </TacticalBlur>
      </View>

      {/* ── BOTTOM TELEMETRY OVERLAY ── */}
      <View style={[styles.bottomOverlay, { bottom: insets.bottom + 20 }]} pointerEvents="box-none">
        <View style={styles.telemetryGroup} pointerEvents="none">
          <Text style={styles.telemetryLabel}>LIVE GPS TELEMETRY</Text>
          <View style={styles.speedRow}>
            <Text style={styles.speedValue}>{telemetry.speed}</Text>
            <Text style={styles.speedUnit}>KM/H</Text>
          </View>
        </View>

        <View style={styles.controlsGroup} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.gloveBtn, UI.tacticalShadow]}
            activeOpacity={0.8}
            onLongPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
          >
            <TacticalBlur tint="dark" style={styles.gloveFill}>
              <Ionicons name="mic" size={30} color="#FFF" />
              <Text style={styles.gloveLabel}>PTT</Text>
            </TacticalBlur>
          </TouchableOpacity>

          <Animated.View
            {...reportPan.panHandlers}
            style={[
              styles.gloveBtn,
              UI.tacticalShadow,
              {
                transform: [{ scale: reportBtnScale }],
              },
            ]}
          >
            <TacticalBlur tint="dark" style={styles.gloveFill}>
              <Text style={styles.reportEmoji}>⚠️</Text>
            </TacticalBlur>
          </Animated.View>
        </View>
      </View>

      {/* ── RIDER QUICK ACTIONS ── */}
      {selectedRider && (
        <Animated.View style={[styles.quickActionContainer, { bottom: insets.bottom + 10, transform: [{ translateY: slideAnim }] }]}>
          <TacticalBlur tint="dark" intensity={100} style={[styles.quickActionBlur, UI.tacticalShadow]}>
            <View style={styles.quickHeader}>
              <View>
                <Text style={styles.quickName}>{selectedRider.name.toUpperCase()}</Text>
                <Text style={styles.quickSub}>COMM LINK OPEN</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedRider(null)}>
                <Ionicons name="close-circle" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.actionGrid}>
              <ActionButton icon="chatbubble-ellipses" label="VOICE" color="#5E5CE6" />
              <ActionButton 
                icon="heart" 
                label="LOVE" 
                color="#FF2D55" 
                onPress={() => {
                  setSpamData({ ts: Date.now(), emoji: '❤️' });
                  sendCommandToDisplay(JSON.stringify({ s: telemetry.speed, dir: 'heart' }));
                }} 
              />
              <ActionButton 
                icon="flash" 
                label="BOOST" 
                color="#FFD60A" 
                onPress={() => {
                  setSpamData({ ts: Date.now(), emoji: '⚡' });
                  sendCommandToDisplay(JSON.stringify({ s: telemetry.speed, dir: 'boost' }));
                }} 
              />
              <ActionButton 
                icon="skull" 
                label="WATCH" 
                color="#FFF" 
                onPress={() => {
                  setSpamData({ ts: Date.now(), emoji: '💀' });
                  sendCommandToDisplay(JSON.stringify({ s: telemetry.speed, dir: 'skull' }));
                }} 
              />
            </View>
          </TacticalBlur>
        </Animated.View>
      )}

      <EmojiSpam triggerDate={spamData.ts} currentEmoji={spamData.emoji} />

      <ReportFan
        visible={fanVisible}
        activeSector={activeSector}
      />
    </View>
  );
}

function ActionButton({ icon, label, color, onPress }: any) {
  return (
    <TouchableOpacity 
      style={styles.actionBtn} 
      onPress={() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (onPress) onPress();
      }}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ── HUD Pills ──
  pillsRow: {
    position: 'absolute',
    left: UI.pagePadding,
    right: UI.pagePadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    zIndex: 100,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillCenter: { flex: 1 },
  pillTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: FONTS.sans,
  },
  pillMono: {
    color: '#8E8E93',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: FONTS.mono,
  },

  // ── Markers ──
  userDot: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  userDotCore: { width: 9, height: 9, borderRadius: 5 },
  
  meRing: {
    position: 'absolute',
    width: 44, height: 44,
    borderRadius: 22,
    borderWidth: 2,
    opacity: 0.4,
  },
  meDot: {
    position: 'absolute',
    bottom: -2,
    width: 8, height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },

  riderWrap: { width: 60, alignItems: 'center', justifyContent: 'center' },
  riderLabel: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    marginBottom: 4,
  },
  riderName: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: FONTS.sans,
  },
  riderSpeed: {
    color: '#8AFF72',
    fontSize: 8,
    fontWeight: '700',
    fontFamily: FONTS.mono,
  },
  riderRing: {
    position: 'absolute', bottom: 0, alignSelf: 'center',
    width: 36, height: 36,
    borderRadius: 18, borderWidth: 1, opacity: 0.5,
  },
  riderAvatar: { 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },

  // ── Quick Action Overlay ──
  quickActionContainer: {
    position: 'absolute',
    left: UI.pagePadding,
    right: UI.pagePadding,
    alignItems: 'center',
    zIndex: 200,
  },
  quickActionBlur: {
    width: '100%',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  quickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  quickName: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 2, fontFamily: FONTS.sans },
  quickSub: { color: '#8E8E93', fontSize: 9, fontWeight: '800', letterSpacing: 1, fontFamily: FONTS.mono },
  
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: { alignItems: 'center', width: '22%' },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: { color: '#8E8E93', fontSize: 8, fontWeight: '800', letterSpacing: 1, fontFamily: FONTS.mono },

  // ── Bottom Overlay ──
  bottomOverlay: {
    position: 'absolute',
    left: UI.pagePadding,
    right: UI.pagePadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 100,
  },
  telemetryGroup: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  controlsGroup: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: -4,
    fontFamily: FONTS.mono,
  },
  speedRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  speedValue: {
    fontSize: 84,
    fontWeight: '900',
    color: '#FFF',
    fontFamily: FONTS.technical,
    lineHeight: 90,
  },
  speedUnit: {
    fontSize: 16,
    fontWeight: '900',
    color: '#8E8E93',
    marginBottom: 16,
    fontFamily: FONTS.sans,
  },

  // ── Glove Buttons ──
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  gloveBtn: {
    width: UI.gloveSize,
    height: UI.gloveSize,
    borderRadius: UI.gloveSize / 2,
    overflow: 'hidden',
  },
  gloveFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gloveLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
    marginTop: 2,
    fontFamily: FONTS.sans,
  },
  reportEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  loadingOverlay: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  spinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#FFF',
    borderTopColor: 'transparent',
    marginBottom: 20,
  },
  loadingText: {
    color: '#FFF',
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 4,
    opacity: 0.6,
  },
});