import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import TacticalBlur from '../../components/TacticalBlur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSentioStore } from '../../store/useSentioStore';
import { getThemePalette, SPORT_PROFILES, UI, FONTS, TACTICAL_TAG } from '../../constants/Styles';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, setTheme, sportProfile, setSportProfile, bleConnected, glassesBattery } = useSentioStore();
  const palette = useMemo(() => getThemePalette(sportProfile, theme), [sportProfile, theme]);

  const toggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTheme(theme === 'DARK' ? 'LIGHT' : 'DARK');
  };

  const toggleSport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSportProfile(sportProfile === 'SKI' ? 'MOTOCROSS' : 'SKI');
  };

  return (
    <View style={styles.root}>
      {/* ── BACKGROUND ── */}
      <Mapbox.MapView
        style={StyleSheet.absoluteFillObject}
        styleURL={theme === 'DARK' ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Light}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Mapbox.Camera zoomLevel={10} centerCoordinate={[24.6946, 41.6504]} pitch={30} />
      </Mapbox.MapView>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CONFIG</Text>
          <Text style={TACTICAL_TAG(palette)}>[ HUD SYSTEM PREFERENCES ]</Text>
        </View>

        {/* ── HARDWARE STATUS ── */}
        <TacticalBlur tint="dark" intensity={UI.glassBlur} style={[styles.panel, UI.tacticalShadow, { borderColor: bleConnected ? palette.accent : 'rgba(255,255,255,0.15)' }]}>
          <Text style={styles.panelTitle}>HARDWARE LINK</Text>
          <SettingRow label="GLASSES CONNECTION" value={bleConnected ? "ACTIVE" : "SEARCHING..."} icon="bluetooth" isStatus statusColor={bleConnected ? palette.accent : '#8E8E93'} />
          <SettingRow label="GLASSES BATTERY" value={`${glassesBattery}%`} icon={glassesBattery > 20 ? "battery-full" : "battery-dead"} isStatus statusColor={glassesBattery > 20 ? '#34C759' : '#FF3B30'} />
          <SettingRow label="FIRMWARE" value="v2.1.0-ESP32" icon="hardware-chip" isStatus />
        </TacticalBlur>

        {/* ── DISPLAY PREFERENCES ── */}
        <TacticalBlur tint="dark" intensity={UI.glassBlur} style={[styles.panel, UI.tacticalShadow, { marginTop: 20 }]}>
          <Text style={styles.panelTitle}>HUD DISPLAY</Text>
          <SettingRow label="TACTICAL THEME" value={theme} onPress={toggleTheme} icon={theme === 'DARK' ? 'moon' : 'sunny'} />
          <SettingRow label="SPORT TRACKING" value={sportProfile} onPress={toggleSport} icon={sportProfile === 'SKI' ? 'snow' : 'bicycle'} />
          <SettingRow label="METRIC UNITS" value="KM/H" onPress={() => {}} icon="speedometer" />
          <SettingRow label="DISPLAY OPACITY" value="80%" onPress={() => {}} icon="contrast" />
        </TacticalBlur>

        {/* ── SAFETY & SOS ── */}
        <TacticalBlur tint="dark" intensity={UI.glassBlur} style={[styles.panel, { marginTop: 20, borderColor: 'rgba(255,59,48,0.3)' }]}>
          <Text style={[styles.panelTitle, { color: '#FF3B30' }]}>EMERGENCY PROTOCOL</Text>
          <SettingRow label="CRASH SENSITIVITY" value="3.0G HIGH" onPress={() => {}} icon="warning" />
          <SettingRow label="SOS COUNTDOWN" value="10s" onPress={() => {}} icon="timer" />
          <SettingRow label="EMERGENCY CONTACTS" value="2 CONFIGURED" onPress={() => {}} icon="people" />
        </TacticalBlur>

        <TouchableOpacity 
          style={[styles.dangerBtn, UI.tacticalShadow]}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
        >
          <Text style={styles.dangerText}>UNPAIR GLASSES</Text>
        </TouchableOpacity>

        <Text style={styles.versionTag}>
          SENTIO HUD // BUILT FOR EXTREME ENVIRONMENTS
        </Text>

      </ScrollView>
    </View>
  );
}

function SettingRow({ label, value, onPress, icon, isStatus, statusColor }: any) {
  const content = (
    <View style={rowStyles.row}>
      <View style={rowStyles.left}>
        <Ionicons name={icon} size={20} color="#FFF" style={{ marginRight: 12 }} />
        <Text style={rowStyles.label}>{label}</Text>
      </View>
      <Text style={[rowStyles.value, isStatus && statusColor && { color: statusColor }]}>{value}</Text>
    </View>
  );

  if (isStatus) return content;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  scroll: { padding: UI.pagePadding, paddingBottom: 100 },
  header: { alignItems: 'flex-start', marginBottom: 32 },
  headerTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: 6, fontFamily: FONTS.sans, marginBottom: 8 },
  panel: { padding: 24, borderRadius: UI.borderRadius, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  panelTitle: { fontSize: 10, color: '#8E8E93', fontWeight: '800', letterSpacing: 2, marginBottom: 20, fontFamily: FONTS.mono },
  dangerBtn: { backgroundColor: 'rgba(220, 38, 38, 0.2)', borderWidth: 1, borderColor: '#DC2626', borderRadius: 12, padding: 20, alignItems: 'center', marginTop: 40 },
  dangerText: { color: '#DC2626', fontWeight: '900', letterSpacing: 1, fontFamily: FONTS.sans },
  versionTag: { marginTop: 40, textAlign: 'center', fontSize: 9, fontFamily: FONTS.mono, color: '#8E8E93', letterSpacing: 2 },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  left: { flexDirection: 'row', alignItems: 'center' },
  label: { color: '#FFF', fontSize: 13, fontWeight: '700', fontFamily: FONTS.sans },
  value: { color: '#8E8E93', fontSize: 13, fontWeight: '900', fontFamily: FONTS.technical },
});
