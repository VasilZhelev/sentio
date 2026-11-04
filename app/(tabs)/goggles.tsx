import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, useReducedMotion } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Surface, Button, Chip, IconButton, ListGroup, ListRow, SegmentedControl, SectionHeader } from '@/components/ui';
import { useSentioStore } from '@/store/useSentioStore';
import { useSmartGlassesBLE } from '@/hooks/useSmartGlassesBLE';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/lib/haptics';
import { radius, space, fontFamily } from '@/constants/tokens';

const QUICK_MESSAGES = ['Wait for me', 'Meet at the lift', 'Heading down', 'Watch out ahead', 'Lunch?', 'Nice run!'];
const MAX_LEN = 24;

export default function GogglesScreen() {
  const { colors } = useTheme();
  const bleConnected = useSentioStore((s) => s.bleConnected);
  const battery = useSentioStore((s) => s.glassesBattery);
  const firmware = useSentioStore((s) => s.glassesFirmware);
  const brightness = useSentioStore((s) => s.hudBrightness);
  const setBrightness = useSentioStore((s) => s.setHudBrightness);
  const { isScanning, discoveredDevices, scanForDevices, connectToDevice, sendMessage } = useSmartGlassesBLE();
  const [text, setText] = useState('');

  const send = async (msg: string) => {
    const m = msg.trim();
    if (!m || !bleConnected) return;
    const ok = await sendMessage(m);
    if (ok) {
      haptic.success();
      setText('');
    } else haptic.warning();
  };

  const state = bleConnected ? 'connected' : isScanning ? 'searching' : 'offline';
  const brightnessValue = brightness >= 95 ? 'auto' : brightness >= 70 ? 'high' : brightness >= 40 ? 'medium' : 'low';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen title="Goggles" subtitle="Sentio Goggles" keyboardShouldPersistTaps="handled">
        {/* ── Device hero ── */}
        <Surface padding={space.xl} style={{ gap: space.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <DeviceOrb state={state} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="headline">{state === 'connected' ? 'Connected' : state === 'searching' ? 'Searching…' : 'Not connected'}</Text>
              <Text variant="callout" tone="secondary">
                {state === 'connected'
                  ? 'Crash detection is active.'
                  : 'Crash detection needs your goggles. Turn them on and keep them close.'}
              </Text>
            </View>
          </View>
          {state === 'connected' ? (
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Chip icon={battery > 20 ? 'battery-half-outline' : 'battery-dead-outline'} tone={battery > 20 ? 'neutral' : 'warning'} label={`${battery}%`} />
              <Chip icon="hardware-chip-outline" label={firmware} />
              <Chip icon="shield-checkmark-outline" tone="success" label="SOS ready" />
            </View>
          ) : (
            <Button label={isScanning ? 'Searching…' : 'Search for goggles'} icon="bluetooth" loading={isScanning} onPress={() => scanForDevices()} fullWidth />
          )}
        </Surface>

        {!bleConnected && discoveredDevices.length > 0 && (
          <ListGroup title="Nearby">
            {discoveredDevices.map((d, i) => (
              <ListRow
                key={d.id}
                icon="glasses-outline"
                title={d.name}
                subtitle={d.rssi != null ? `Signal ${d.rssi} dBm` : undefined}
                value="Connect"
                last={i === discoveredDevices.length - 1}
                onPress={() => connectToDevice(d.id)}
              />
            ))}
          </ListGroup>
        )}

        {/* ── Messages ── */}
        <View style={{ gap: space.md }}>
          <SectionHeader title="Show on display" />
          <Text variant="callout" tone="secondary" style={{ marginTop: -space.xs }}>
            Messages appear in your goggles for 4 seconds.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, opacity: bleConnected ? 1 : 0.5 }}>
            {QUICK_MESSAGES.map((m) => (
              <Chip key={m} label={m} onPress={bleConnected ? () => send(m) : undefined} />
            ))}
          </View>
          <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, opacity: bleConnected ? 1 : 0.5 }]}>
            <TextInput
              value={text}
              onChangeText={(t) => setText(t.slice(0, MAX_LEN))}
              placeholder={bleConnected ? 'Write a message…' : 'Connect goggles to send'}
              placeholderTextColor={colors.textTertiary}
              editable={bleConnected}
              returnKeyType="send"
              onSubmitEditing={() => send(text)}
              style={[styles.textInput, { color: colors.text, fontFamily: fontFamily.regular }]}
              accessibilityLabel="Message for goggles display"
            />
            <Text variant="caption" tone="tertiary" tabular>
              {text.length}/{MAX_LEN}
            </Text>
            <IconButton icon="arrow-up" size={40} variant={text.trim() && bleConnected ? 'tonal' : 'plain'} active={!!text.trim() && bleConnected} accessibilityLabel="Send to goggles" onPress={() => send(text)} />
          </View>
        </View>

        {/* ── Display ── */}
        <View style={{ gap: space.md }}>
          <SectionHeader title="Display" />
          <Text variant="label" tone="secondary">
            Brightness
          </Text>
          <SegmentedControl
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'auto', label: 'Auto' },
            ]}
            value={brightnessValue}
            onChange={(v) => setBrightness({ low: 30, medium: 60, high: 85, auto: 100 }[v])}
          />
        </View>

        <DeveloperSection />
      </Screen>
    </KeyboardAvoidingView>
  );
}

function DeviceOrb({ state }: { state: 'connected' | 'searching' | 'offline' }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = 0;
    if (state !== 'offline' && !reduced) pulse.value = withRepeat(withTiming(1, { duration: state === 'searching' ? 1000 : 2400, easing: Easing.out(Easing.quad) }), -1, false);
  }, [state, reduced, pulse]);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.45 }], opacity: (1 - pulse.value) * 0.6 }));
  const tint = state === 'connected' ? colors.success : state === 'searching' ? colors.accent : colors.textTertiary;
  const soft = state === 'connected' ? colors.successSoft : state === 'searching' ? colors.accentSoft : colors.surfaceSunken;
  return (
    <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 32, borderWidth: 2, borderColor: tint }, ring]} />
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="glasses" size={30} color={tint} />
      </View>
    </View>
  );
}

function DeveloperSection() {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const log = useSentioStore((s) => s.bleLog);
  const clearLog = useSentioStore((s) => s.clearBleLog);
  const triggerCrash = useSentioStore((s) => s.triggerCrash);
  const cancelCrash = useSentioStore((s) => s.cancelCrash);
  const bleConnected = useSentioStore((s) => s.bleConnected);
  const { sendCancel } = useSmartGlassesBLE();

  return (
    <View style={{ gap: space.md }}>
      <Pressable
        onPress={() => { haptic.select(); setOpen((o) => !o); }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Ionicons name="code-slash-outline" size={18} color={colors.textSecondary} />
          <Text variant="bodyStrong" tone="secondary">
            Developer
          </Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </Pressable>
      {open && (
        <>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Simulate crash" icon="warning-outline" variant="secondary" size="md" style={{ flex: 1 }} onPress={triggerCrash} />
            <Button label="Send cancel" icon="close-circle-outline" variant="secondary" size="md" style={{ flex: 1 }} disabled={!bleConnected} onPress={() => { sendCancel(); cancelCrash(); }} />
          </View>
          <Surface variant="sunken" padding={space.md} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text variant="label" tone="secondary">
                Connection log
              </Text>
              <Pressable onPress={clearLog} accessibilityRole="button" hitSlop={10}>
                <Text variant="label" tone="accent">
                  Clear
                </Text>
              </Pressable>
            </View>
            {log.length === 0 ? (
              <Text variant="caption" tone="tertiary">
                No events yet
              </Text>
            ) : (
              log.map((l, i) => (
                <Text key={i} variant="caption" tone={l.includes('←') ? 'accent' : 'secondary'} style={{ fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }}>
                  {l}
                </Text>
              ))
            )}
          </Surface>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: 1, borderRadius: radius.lg, paddingLeft: space.lg, paddingRight: 6, height: 56 },
  textInput: { flex: 1, fontSize: 16, height: '100%' },
});
