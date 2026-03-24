import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSentioStore } from '../../store/useSentioStore';
import { THEMES, SPORT_PROFILES, UI } from '../../constants/Styles';
import { useBLEBridge } from '../../hooks/useBLEBridge';
import * as Haptics from 'expo-haptics';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const store = useSentioStore();
  const { theme, sportProfile, bleConnected } = store;
  const t = THEMES[theme];
  const p = SPORT_PROFILES[sportProfile];
  const { scanForDevices } = useBLEBridge();

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

  return (
    <View style={[styles.root, { backgroundColor: t.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: t.text }]}>SETTINGS</Text>

        {/* ── Appearance ── */}
        <Section label="APPEARANCE" t={t}>
          <Card t={t}>
            <Row label="Theme" value={theme === 'DARK' ? '🌙 Dark' : '☀️ Light'} t={t} />
            <Btn label={theme === 'DARK' ? 'Switch to Light' : 'Switch to Dark'}
              bg={p.accent} onPress={() => { tap(); store.toggleTheme(); }} />
          </Card>
        </Section>

        {/* ── Sport ── */}
        <Section label="SPORT PROFILE" t={t}>
          <Card t={t}>
            <View style={styles.rowBetween}>
              <Text style={[styles.rowLabel, { color: t.text }]}>Active Mode</Text>
              <View style={[styles.badge, { backgroundColor: p.accentSoft }]}>
                <Text style={{ fontSize: 13 }}>{p.icon}</Text>
                <Text style={[styles.badgeText, { color: p.accent }]}>{p.label}</Text>
              </View>
            </View>
            <Btn
              label={`Switch to ${sportProfile === 'MOTOCROSS' ? '🎿 Ski / Snow' : '🏍️ Moto / MTB'}`}
              bg={p.accent}
              onPress={() => { tap(); store.toggleSportProfile(); }}
            />
          </Card>
        </Section>

        {/* ── Hardware ── */}
        <Section label="HARDWARE" t={t}>
          <Card t={t}>
            <View style={styles.rowBetween}>
              <Text style={[styles.rowLabel, { color: t.text }]}>Sentio HUD</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: bleConnected ? '#34D399' : '#F87171' }]} />
                <Text style={[styles.rowValue, { color: bleConnected ? '#34D399' : '#F87171' }]}>
                  {bleConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>
            <Btn
              label="🔄 Scan & Reconnect"
              bg={t.surfaceAlt}
              textColor={t.text}
              border={t.border}
              onPress={() => { tap(); scanForDevices(); }}
            />
          </Card>
        </Section>

        {/* ── Mode Reset ── */}
        <Section label="SESSION" t={t}>
          <Card t={t}>
            <Btn
              label="🔁 Change Ride Mode"
              bg={t.surfaceAlt}
              textColor={t.text}
              border={t.border}
              onPress={() => { tap(); store.setHasSelectedMode(false); }}
            />
          </Card>
        </Section>

        {/* ── About ── */}
        <Section label="ABOUT" t={t}>
          <Card t={t}>
            <Text style={[styles.aboutText, { color: t.textSoft }]}>
              Sentio v1.0.0{'\n'}
              HUD Ecosystem for Extreme Athletes{'\n'}
              BLE · GPS · IMU · Crash Detection
            </Text>
          </Card>
        </Section>
      </ScrollView>
    </View>
  );
}

// ── Reusable sub-components ──
function Section({ label, t, children }: any) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={[styles.section, { color: t.textSoft }]}>{label}</Text>
      {children}
    </View>
  );
}

function Card({ t, children }: any) {
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      {children}
    </View>
  );
}

function Row({ label, value, t }: any) {
  return (
    <View style={styles.rowBetween}>
      <Text style={[styles.rowLabel, { color: t.text }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: t.textSoft }]}>{value}</Text>
    </View>
  );
}

function Btn({ label, bg, textColor, border, onPress }: any) {
  return (
    <TouchableOpacity
      style={[styles.cardBtn, { backgroundColor: bg, borderColor: border || 'transparent', borderWidth: border ? 1.5 : 0 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.cardBtnText, { color: textColor || '#FFF' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: UI.pagePadding, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: 4, marginTop: 12, marginBottom: 28 },
  section: { fontSize: 10, fontWeight: '800', letterSpacing: 3, marginBottom: 8, marginTop: 4 },
  card: {
    borderRadius: UI.borderRadius, borderWidth: 1,
    padding: UI.cardPadding, marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  rowLabel: { fontSize: 15, fontWeight: '700' },
  rowValue: { fontSize: 13, fontWeight: '600' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  cardBtn: {
    minHeight: 48, borderRadius: UI.borderRadiusSm,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  aboutText: { fontSize: 13, lineHeight: 20 },
});
