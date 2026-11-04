import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import TacticalBlur from '../../components/TacticalBlur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSentioStore } from '../../store/useSentioStore';
import { getThemePalette, SPORT_PROFILES, UI, FONTS, TACTICAL_TAG } from '../../constants/Styles';
import SOSOverlay from '../../components/SOSOverlay';

const { width, height } = Dimensions.get('window');

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { theme, sportProfile, telemetry, isEmergency, bleConnected } = useSentioStore();
  const palette = useMemo(() => getThemePalette(sportProfile, theme), [sportProfile, theme]);
  const p = SPORT_PROFILES[sportProfile];

  const [mapLoaded, setMapLoaded] = React.useState(false);

  // BLE pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!bleConnected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [bleConnected]);

  return (
    <View style={styles.root}>
      {/* ── IMMERSIVE MAP BACKGROUND ── */}
      <Mapbox.MapView
        style={StyleSheet.absoluteFillObject}
        styleURL="mapbox://styles/vasil-zhelev/cmn3epolr002q01ql4jwcfwdi"
        logoEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingStyle={() => setMapLoaded(true)}
      >
        <Mapbox.Camera
          zoomLevel={12}
          centerCoordinate={[24.6946, 41.6504]} 
          pitch={60}
        />
      </Mapbox.MapView>

      {!mapLoaded && (
        <View style={[styles.loadingOverlay, StyleSheet.absoluteFillObject]}>
          <Animated.View style={[styles.spinner, { borderColor: palette.accent }]} />
          <Text style={styles.loadingText}>INITIALIZING HUD...</Text>
        </View>
      )}

      <ScrollView 
        style={{ opacity: mapLoaded ? 1 : 0 }}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>TELEMETRY</Text>
            <Text style={TACTICAL_TAG(palette)}>
              [ SYSTEM: {bleConnected ? 'LINKED' : 'SEARCHING'} // BIO: STABLE ]
            </Text>
          </View>
          <Animated.View style={[styles.bleDot, {
            backgroundColor: bleConnected ? '#34C759' : '#FF453A',
            opacity: pulseAnim
          }]} />
        </View>

        {/* ── PRIMARY METRIC (HERO) ── */}
        <TacticalBlur tint="dark" intensity={UI.glassBlur} style={[styles.heroCard, UI.tacticalShadow]}>
          <Text style={styles.heroTag}>CURRENT VELOCITY</Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroValue}>{telemetry.speed}</Text>
            <Text style={styles.heroUnit}>KM/H</Text>
          </View>
          <View style={[styles.progressBase, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <View style={[styles.progressBar, { width: '65%', backgroundColor: palette.accent }]} />
          </View>
        </TacticalBlur>

        {/* ── SECONDARY GRID ── */}
        <View style={styles.cardRow}>
          {sportProfile === 'MOTOCROSS' ? (
            <>
              <MetricCard label="G-FORCE" value={telemetry.gForce.toFixed(1)} unit="G" />
              <MetricCard label="LAP TIME" value={telemetry.lapTime} unit="" />
            </>
          ) : (
            <>
              <MetricCard label="ALTITUDE" value={String(telemetry.altitude)} unit="M" />
              <MetricCard label="AIR-TIME" value={telemetry.airTime.toFixed(1)} unit="SEC" />
            </>
          )}
        </View>

        {/* ── SPORT PROFILE TAG ── */}
        <View style={styles.footerTag}>
          <Text style={styles.footerTagText}>
            PROFILE: {p.label} // SENSOR_ID: SN-9284-TX
          </Text>
        </View>

      </ScrollView>

      {isEmergency && <SOSOverlay />}
    </View>
  );
}

function MetricCard({ label, value, unit }: any) {
  return (
    <TacticalBlur tint="dark" intensity={UI.glassBlur} style={[cardStyles.card, UI.tacticalShadow]}>
      <Text style={cardStyles.label}>{label}</Text>
      <Text style={[cardStyles.value, { fontSize: value.length > 4 ? 28 : 36 }]}>{value}</Text>
      {unit ? <Text style={cardStyles.unit}>{unit}</Text> : null}
    </TacticalBlur>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  scroll: { padding: UI.pagePadding, paddingBottom: 120 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: { 
    color: '#FFF', 
    fontSize: 28, 
    fontWeight: '900', 
    letterSpacing: 4, 
    fontFamily: FONTS.sans,
    marginBottom: 6,
  },
  bleDot: { width: 12, height: 12, borderRadius: 6 },

  heroCard: {
    borderRadius: UI.borderRadius,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroTag: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
    fontFamily: FONTS.mono,
  },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 20 },
  heroValue: { 
    fontSize: 84, 
    fontWeight: '900', 
    color: '#FFFFFF', 
    fontFamily: FONTS.technical,
    lineHeight: 90,
  },
  heroUnit: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#8E8E93', 
    marginBottom: 18,
    fontFamily: FONTS.sans,
  },
  progressBase: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: '100%' },

  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },

  footerTag: {
    alignItems: 'center',
    marginTop: 20,
    opacity: 0.5,
  },
  footerTagText: {
    fontSize: 9,
    fontFamily: FONTS.mono,
    color: '#FFF',
    letterSpacing: 1.5,
  },
  versionTag: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 9,
    fontFamily: FONTS.mono,
    color: '#8E8E93',
    letterSpacing: 2,
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

const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: UI.borderRadius,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  label: { 
    fontSize: 10, 
    color: '#8E8E93', 
    fontWeight: '800', 
    letterSpacing: 1.5, 
    marginBottom: 10, 
    fontFamily: FONTS.sans,
  },
  value: { 
    color: '#FFFFFF', 
    fontWeight: '900', 
    fontFamily: FONTS.technical,
  },
  unit: { 
    fontSize: 10, 
    color: '#8E8E93', 
    fontWeight: '900', 
    marginTop: 6,
    fontFamily: FONTS.sans,
  },
});
