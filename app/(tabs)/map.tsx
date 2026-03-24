import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSentioStore } from '../../store/useSentioStore';
import { THEMES, SPORT_PROFILES, UI } from '../../constants/Styles';
import SOSOverlay from '../../components/SOSOverlay';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const store = useSentioStore();
  const { theme, sportProfile, telemetry, isEmergency, bleConnected } = store;
  const t = THEMES[theme];
  const p = SPORT_PROFILES[sportProfile];

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

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
    <View style={[styles.root, { backgroundColor: t.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.brand, { color: t.text }]}>DASHBOARD</Text>
            <Text style={[styles.brandSub, { color: t.textSoft }]}>LIVE TELEMETRY</Text>
          </View>
          <View style={styles.bleChip}>
            <Animated.View style={[styles.bleDot, {
              backgroundColor: bleConnected ? '#34D399' : '#F87171',
              opacity: pulseAnim
            }]} />
            <Text style={[styles.bleLabel, { color: t.textSoft }]}>
              {bleConnected ? 'LINKED' : 'SEARCHING'}
            </Text>
          </View>
        </View>

        {/* ── Sport Mode Pill ── */}
        <View style={[styles.modePill, { backgroundColor: p.accentSoft, borderColor: p.accent }]}>
          <Text style={{ fontSize: 16 }}>{p.icon}</Text>
          <Text style={[styles.modeLabel, { color: p.accent }]}>{p.label}</Text>
        </View>

        {/* ── Hero Speed ── */}
        <View style={[styles.heroCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.heroLabel, { color: t.textSoft }]}>SPEED</Text>
          <View style={styles.heroRow}>
            <Text style={[styles.heroValue, { color: p.accent, fontFamily: UI.fontMono }]}>
              {String(telemetry.speed).padStart(3, ' ')}
            </Text>
            <Text style={[styles.heroUnit, { color: t.textSoft }]}>KM/H</Text>
          </View>
        </View>

        {/* ── Metric Cards ── */}
        <View style={styles.cardRow}>
          {sportProfile === 'MOTOCROSS' ? (
            <>
              <MetricCard label="G-FORCE" value={telemetry.gForce.toFixed(1)} unit="G" t={t} p={p} />
              <MetricCard label="LAP TIME" value={telemetry.lapTime} unit="" t={t} p={p} />
            </>
          ) : (
            <>
              <MetricCard label="ALTITUDE" value={String(telemetry.altitude)} unit="M" t={t} p={p} />
              <MetricCard label="AIR-TIME" value={telemetry.airTime.toFixed(1)} unit="SEC" t={t} p={p} />
            </>
          )}
        </View>

        {/* ── Crash Test ── */}
        <TouchableOpacity
          style={[styles.btn, styles.crashBtn]}
          onPress={() => { tap(); store.setEmergency(true); }}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>⚠️  TEST CRASH DETECTION</Text>
        </TouchableOpacity>

      </ScrollView>

      {isEmergency && <SOSOverlay />}
    </View>
  );
}

function MetricCard({ label, value, unit, t, p }: any) {
  return (
    <View style={[cardStyles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Text style={[cardStyles.label, { color: t.textSoft }]}>{label}</Text>
      <Text style={[cardStyles.value, { color: p.accent, fontFamily: UI.fontMono }]}>{value}</Text>
      {unit ? <Text style={[cardStyles.unit, { color: t.textSoft }]}>{unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: UI.pagePadding, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 12,
  },
  brand: { fontSize: 24, fontWeight: '900', letterSpacing: 4 },
  brandSub: { fontSize: 10, fontWeight: '600', letterSpacing: 3, marginTop: 2 },

  bleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6 },
  bleDot: { width: 8, height: 8, borderRadius: 4 },
  bleLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  modePill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 8, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 50, borderWidth: 1.5, marginBottom: 20,
  },
  modeLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 2 },

  heroCard: {
    borderRadius: UI.borderRadius, borderWidth: 1,
    padding: 28, alignItems: 'center', marginBottom: 12,
  },
  heroLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 4 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  heroValue: { fontSize: 72, fontWeight: '200', lineHeight: 80 },
  heroUnit: { fontSize: 14, fontWeight: '700', marginBottom: 10 },

  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },

  btn: {
    minHeight: UI.minButtonHeight,
    borderRadius: UI.borderRadiusSm,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  crashBtn: { backgroundColor: '#DC2626' },
});

const cardStyles = StyleSheet.create({
  card: {
    flex: 1, borderRadius: UI.borderRadius, borderWidth: 1,
    padding: UI.cardPadding, alignItems: 'center',
  },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  value: { fontSize: 32, fontWeight: '300' },
  unit: { fontSize: 11, fontWeight: '600', marginTop: 4 },
});
