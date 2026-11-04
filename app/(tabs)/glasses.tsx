import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSentioStore } from '../../store/useSentioStore';
import { useSmartGlassesBLE } from '../../hooks/useSmartGlassesBLE';
import TacticalBlur from '../../components/TacticalBlur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONTS, UI, getThemePalette } from '../../constants/Styles';

const { width } = Dimensions.get('window');

const QUICK_MESSAGES = [
  'Внимавай напред! ⚠️',
  'Зчакай ме! 🛑',
  'Добро карне! 🔥',
  'Отивам към пит. 🏁',
];

export default function GlassesScreen() {
  const insets = useSafeAreaInsets();
  const {
    bleConnected,
    glassesBattery,
    telemetry,
    bleLog,
    clearBleLog,
    isCrashOverlayVisible,
    crashStatus,
    cancelCrash,
    triggerCrash,
    sportProfile,
    theme,
  } = useSentioStore();

  const { isScanning, discoveredDevices, scanForDevices, connectToDevice, sendCancel, sendMessage } = useSmartGlassesBLE();
  const palette = useMemo(() => getThemePalette(sportProfile, theme), [sportProfile, theme]);

  const [messageText, setMessageText] = useState('');
  const [sendResult, setSendResult] = useState<'idle' | 'ok' | 'err'>('idle');

  // BLE status pulse animation
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const scanSpin   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!bleConnected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.2, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [bleConnected]);

  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.timing(scanSpin, { toValue: 1, duration: 1500, useNativeDriver: true })
      ).start();
    } else {
      scanSpin.stopAnimation();
      scanSpin.setValue(0);
    }
  }, [isScanning]);

  const spinDeg = scanSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ── Handle send message ──────────────────────────────────────────────────────
  const handleSend = async (text: string) => {
    const msg = text.trim();
    if (!msg) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await sendMessage(msg);
    setSendResult(ok ? 'ok' : 'err');
    setMessageText('');
    setTimeout(() => setSendResult('idle'), 2000);
  };

  // ── Handle crash cancel ──────────────────────────────────────────────────────
  const handleCancel = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await sendCancel();
    cancelCrash();
  };

  // ── Handle manual crash test ─────────────────────────────────────────────────
  const handleManualCrash = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    triggerCrash();
  };

  const statusColor = bleConnected ? '#34C759' : isScanning ? '#FF9F0A' : '#FF3B30';
  const statusLabel = bleConnected
    ? 'CONNECTED'
    : isScanning
    ? 'SCANNING...'
    : 'DISCONNECTED';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── BACKGROUND GRADIENT ── */}
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.bgGradientTop} />
        <View style={[styles.bgGradientBottom, { backgroundColor: '#0A0A0F' }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>GLASSES</Text>
          <Text style={styles.headerSub}>[ CONTROL PANEL ]</Text>
        </View>

        {/* ── BLE STATUS HERO ── */}
        <TacticalBlur tint="dark" style={[styles.heroCard, UI.tacticalShadow, { borderColor: statusColor + '40' }]}>
          <View style={styles.heroInner}>
            {/* Big animated status orb */}
            <View style={styles.orbOuter}>
              <Animated.View style={[styles.orbPulse, { backgroundColor: statusColor + '20', opacity: pulseAnim }]} />
              <Animated.View style={[
                styles.orbSpinner,
                { borderColor: statusColor + '30', transform: [{ rotate: spinDeg }] }
              ]} />
              <View style={[styles.orbCore, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                <Ionicons
                  name={bleConnected ? 'bluetooth' : isScanning ? 'radio-outline' : 'bluetooth-outline'}
                  size={28}
                  color={statusColor}
                />
              </View>
            </View>

            <View style={styles.heroText}>
              <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
              <Text style={styles.deviceName}>Sentio_Glasses</Text>
              {bleConnected && (
                <View style={styles.batteryRow}>
                  <Ionicons
                    name={glassesBattery > 20 ? 'battery-full' : 'battery-dead'}
                    size={14}
                    color={glassesBattery > 20 ? '#34C759' : '#FF3B30'}
                  />
                  <Text style={[styles.batteryText, { color: glassesBattery > 20 ? '#34C759' : '#FF3B30' }]}>
                    {glassesBattery}%
                  </Text>
                </View>
              )}
            </View>
          </View>

          {!bleConnected && (
            <TouchableOpacity
              style={[styles.scanBtn, { backgroundColor: palette.accent + '20', borderColor: palette.accent }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); scanForDevices(); }}
              activeOpacity={0.75}
            >
              <Ionicons name="search" size={16} color={palette.accent} />
              <Text style={[styles.scanBtnText, { color: palette.accent }]}>
                {isScanning ? 'SCANNING...' : 'SCAN AGAIN'}
              </Text>
            </TouchableOpacity>
          )}
        </TacticalBlur>

        {/* ── NEARBY DEVICES (manual connect fallback) ── */}
        {!bleConnected && discoveredDevices.length > 0 && (
          <TacticalBlur tint="dark" style={[styles.card, UI.tacticalShadow]}>
            <Text style={styles.cardTitle}>NEARBY DEVICES</Text>
            <Text style={styles.cardSub}>Tap Sentio_Glasses if auto-connect doesn't work</Text>
            {discoveredDevices.map((d) => {
              const isSentio = d.name.toLowerCase().includes('sentio');
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.deviceRow,
                    isSentio && { borderColor: palette.accent + '60', backgroundColor: palette.accent + '10' },
                  ]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); connectToDevice(d.id); }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="bluetooth" size={18} color={isSentio ? palette.accent : '#8E8E93'} />
                  <View style={styles.deviceInfo}>
                    <Text style={[styles.deviceName, isSentio && { color: palette.accent }]}>{d.name}</Text>
                    <Text style={styles.deviceMeta}>{d.rssi != null ? `${d.rssi} dBm` : 'Signal unknown'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#636366" />
                </TouchableOpacity>
              );
            })}
          </TacticalBlur>
        )}

        {/* ── LIVE TELEMETRY FROM GLASSES ── */}
        {bleConnected && (
          <TacticalBlur tint="dark" style={[styles.card, UI.tacticalShadow]}>
            <Text style={styles.cardTitle}>LIVE TELEMETRY</Text>
            <View style={styles.metricsRow}>
              <MetricBubble label="G-FORCE" value={`${telemetry.gForce.toFixed(1)}G`} icon="rocket" color={telemetry.gForce > 2 ? '#FF9F0A' : '#5E5CE6'} />
              <MetricBubble label="SPEED" value={`${telemetry.speed}km/h`} icon="speedometer" color={palette.accent} />
              <MetricBubble label="BATTERY" value={`${glassesBattery}%`} icon="battery-full" color="#34C759" />
            </View>
          </TacticalBlur>
        )}

        {/* ── SEND MESSAGE ── */}
        <TacticalBlur tint="dark" style={[styles.card, UI.tacticalShadow]}>
          <Text style={styles.cardTitle}>SEND NOTIFICATION</Text>
          <Text style={styles.cardSub}>Текстът ще се покаже на дисплея на очилата за 4 секунди</Text>

          {/* Quick message chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {QUICK_MESSAGES.map((qm) => (
              <TouchableOpacity
                key={qm}
                style={[styles.chip, { borderColor: palette.accent + '60', backgroundColor: palette.accent + '10' }]}
                onPress={() => handleSend(qm)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: palette.accent }]}>{qm}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Custom message input */}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, !bleConnected && styles.inputDisabled]}
              placeholder="Напиши съобщение..."
              placeholderTextColor="#4A4A50"
              value={messageText}
              onChangeText={setMessageText}
              maxLength={24}
              editable={bleConnected}
              onSubmitEditing={() => handleSend(messageText)}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: sendResult === 'ok' ? '#34C759' : sendResult === 'err' ? '#FF3B30' : palette.accent },
                !bleConnected && styles.btnDisabled,
              ]}
              onPress={() => handleSend(messageText)}
              disabled={!bleConnected || !messageText.trim()}
              activeOpacity={0.8}
            >
              <Ionicons
                name={sendResult === 'ok' ? 'checkmark' : sendResult === 'err' ? 'close' : 'paper-plane'}
                size={18}
                color="#FFF"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.charCount}>{messageText.length}/24</Text>
        </TacticalBlur>

        {/* ── EMERGENCY CONTROLS ── */}
        <TacticalBlur tint="dark" style={[styles.card, UI.tacticalShadow, styles.emergencyCard]}>
          <Text style={[styles.cardTitle, { color: '#FF3B30' }]}>EMERGENCY CONTROLS</Text>

          <View style={styles.emergencyRow}>
            {/* Simulate crash */}
            <TouchableOpacity
              style={[styles.emergencyBtn, styles.crashBtn]}
              onPress={handleManualCrash}
              activeOpacity={0.8}
            >
              <Ionicons name="warning" size={22} color="#FF3B30" />
              <Text style={styles.crashBtnText}>SIMULATE CRASH</Text>
              <Text style={styles.emergencyBtnSub}>Test SOS overlay</Text>
            </TouchableOpacity>

            {/* Send CANCEL */}
            <TouchableOpacity
              style={[styles.emergencyBtn, styles.cancelBtn, !bleConnected && styles.btnDisabled]}
              onPress={handleCancel}
              disabled={!bleConnected}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark" size={22} color="#34C759" />
              <Text style={styles.cancelBtnText}>SEND CANCEL</Text>
              <Text style={styles.emergencyBtnSub}>Stop glasses countdown</Text>
            </TouchableOpacity>
          </View>

          {isCrashOverlayVisible && crashStatus === 'COUNTDOWN' && (
            <View style={styles.activeCrashBanner}>
              <Ionicons name="warning" size={14} color="#FF3B30" />
              <Text style={styles.activeCrashText}>CRASH COUNTDOWN ACTIVE</Text>
            </View>
          )}
        </TacticalBlur>

        {/* ── BLE LOG ── */}
        <TacticalBlur tint="dark" style={[styles.card, UI.tacticalShadow]}>
          <View style={styles.logHeader}>
            <Text style={styles.cardTitle}>CONNECTION LOG</Text>
            <TouchableOpacity onPress={() => { Haptics.selectionAsync(); clearBleLog(); }}>
              <Text style={styles.clearBtn}>CLEAR</Text>
            </TouchableOpacity>
          </View>

          {bleLog.length === 0 ? (
            <View style={styles.emptyLog}>
              <Ionicons name="terminal-outline" size={28} color="#3A3A3C" />
              <Text style={styles.emptyLogText}>Нямa логове</Text>
            </View>
          ) : (
            <View style={styles.logContainer}>
              {bleLog.map((entry, i) => {
                const isIncoming  = entry.includes('←');
                const isOutgoing  = entry.includes('→');
                const isSystem    = !isIncoming && !isOutgoing;
                const entryColor  = isIncoming ? '#5E5CE6' : isOutgoing ? palette.accent : '#8E8E93';
                return (
                  <View key={i} style={styles.logRow}>
                    <View style={[styles.logDot, { backgroundColor: entryColor }]} />
                    <Text style={[styles.logEntry, { color: entryColor }]}>{entry}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </TacticalBlur>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MetricBubble({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <View style={[bubbleStyles.wrap, { borderColor: color + '30', backgroundColor: color + '10' }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[bubbleStyles.value, { color }]}>{value}</Text>
      <Text style={bubbleStyles.label}>{label}</Text>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  value: { fontSize: 16, fontWeight: '900', fontFamily: FONTS.technical },
  label: { fontSize: 8, color: '#8E8E93', fontWeight: '800', letterSpacing: 1, fontFamily: FONTS.mono },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F' },
  bgGradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 300,
    backgroundColor: 'rgba(94, 92, 230, 0.05)',
  },
  bgGradientBottom: { position: 'absolute', top: 300, left: 0, right: 0, bottom: 0 },
  scroll: { padding: UI.pagePadding, gap: 16 },

  // ── Header ──
  header: { marginBottom: 8 },
  headerTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: 6, fontFamily: FONTS.sans, marginBottom: 4 },
  headerSub: { color: '#8E8E93', fontSize: 9, fontWeight: '800', letterSpacing: 2, fontFamily: FONTS.mono },

  // ── Hero BLE Card ──
  heroCard: {
    borderRadius: UI.borderRadius,
    padding: 24,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 16,
  },
  heroInner: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  orbOuter: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  orbPulse: {
    position: 'absolute', width: 72, height: 72, borderRadius: 36,
  },
  orbSpinner: {
    position: 'absolute', width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, borderStyle: 'dashed',
  },
  orbCore: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  heroText: { flex: 1, gap: 4 },
  statusLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 2, fontFamily: FONTS.mono },
  deviceName: { fontSize: 18, fontWeight: '800', color: '#FFF', fontFamily: FONTS.sans },
  batteryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  batteryText: { fontSize: 12, fontWeight: '800', fontFamily: FONTS.technical },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  scanBtnText: { fontSize: 12, fontWeight: '900', letterSpacing: 1, fontFamily: FONTS.sans },

  // ── Nearby devices ──
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  deviceInfo: { flex: 1, gap: 2 },
  deviceMeta: { fontSize: 10, color: '#636366', fontFamily: FONTS.mono },

  // ── Cards ──
  card: {
    borderRadius: UI.borderRadius,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    gap: 14,
  },
  cardTitle: { fontSize: 10, color: '#8E8E93', fontWeight: '800', letterSpacing: 2, fontFamily: FONTS.mono },
  cardSub: { fontSize: 12, color: '#636366', fontWeight: '600', fontFamily: FONTS.sans, marginTop: -8 },

  // ── Metrics Row ──
  metricsRow: { flexDirection: 'row', gap: 10 },

  // ── Quick message chips ──
  chipsScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8,
  },
  chipText: { fontSize: 12, fontWeight: '700', fontFamily: FONTS.sans },

  // ── Input ──
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 14,
    fontFamily: FONTS.sans,
  },
  inputDisabled: { opacity: 0.4 },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.35 },
  charCount: { fontSize: 9, color: '#4A4A50', fontFamily: FONTS.mono, textAlign: 'right', marginTop: -8 },

  // ── Emergency ──
  emergencyCard: { borderColor: 'rgba(255, 59, 48, 0.2)' },
  emergencyRow: { flexDirection: 'row', gap: 12 },
  emergencyBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 16, borderWidth: 1, gap: 6,
  },
  crashBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: 'rgba(255, 59, 48, 0.4)',
  },
  crashBtnText: { color: '#FF3B30', fontSize: 11, fontWeight: '900', letterSpacing: 1, fontFamily: FONTS.sans },
  cancelBtn: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderColor: 'rgba(52, 199, 89, 0.4)',
  },
  cancelBtnText: { color: '#34C759', fontSize: 11, fontWeight: '900', letterSpacing: 1, fontFamily: FONTS.sans },
  emergencyBtnSub: { color: '#636366', fontSize: 9, fontFamily: FONTS.mono },
  activeCrashBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  activeCrashText: { fontSize: 11, fontWeight: '900', color: '#FF3B30', fontFamily: FONTS.mono, letterSpacing: 1 },

  // ── Log ──
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearBtn: { fontSize: 10, color: '#636366', fontWeight: '800', fontFamily: FONTS.mono, letterSpacing: 1 },
  emptyLog: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyLogText: { color: '#3A3A3C', fontSize: 12, fontFamily: FONTS.mono },
  logContainer: { gap: 6 },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  logDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  logEntry: { flex: 1, fontSize: 11, fontFamily: FONTS.mono, lineHeight: 16, letterSpacing: 0.3 },
});
