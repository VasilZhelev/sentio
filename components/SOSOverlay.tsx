import React, { useEffect } from 'react';
import { View, StyleSheet, AccessibilityInfo, ScrollView } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, Surface } from '@/components/ui';
import { HoldButton } from '@/components/ui/HoldButton';
import { useSentioStore } from '@/store/useSentioStore';
import { useSmartGlassesBLE } from '@/hooks/useSmartGlassesBLE';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/lib/haptics';
import { formatCoord, formatAgo } from '@/lib/format';
import { radius, space } from '@/constants/tokens';

// The SOS screen uses its own fixed palette so it looks identical in light & dark mode.
const SOS = {
  bg: '#C4161C',
  bgDeep: '#8E0E13',
  ring: 'rgba(255,255,255,0.18)',
  text: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.78)',
  panel: 'rgba(0,0,0,0.22)',
};

/**
 * Global crash / SOS overlay. Shown above everything.
 * COUNTDOWN → (I'm OK: cancel) | (timeout / Get help now: SENT) → SENT → hold "I'm safe" to close.
 */
export default function SOSOverlay() {
  const visible = useSentioStore((s) => s.isCrashOverlayVisible);
  const status = useSentioStore((s) => s.crashStatus);
  const countdown = useSentioStore((s) => s.crashCountdown);
  const total = useSentioStore((s) => s.sosCountdownSeconds);
  const tickCrash = useSentioStore((s) => s.tickCrash);
  const finishCrash = useSentioStore((s) => s.finishCrash);
  const cancelCrash = useSentioStore((s) => s.cancelCrash);
  const { sendCancel, sendSos } = useSmartGlassesBLE();

  // Countdown driver
  useEffect(() => {
    if (!visible || status !== 'COUNTDOWN') return;
    if (countdown <= 0) {
      haptic.sos();
      sendSos();
      finishCrash();
      AccessibilityInfo.announceForAccessibility('Emergency alert sent. Help is on the way.');
      return;
    }
    const t = setTimeout(() => {
      // Escalate: stronger haptics in the last 5 seconds
      if (countdown <= 6) haptic.sos();
      else haptic.warning();
      tickCrash();
      if (countdown % 5 === 0 || countdown <= 4) AccessibilityInfo.announceForAccessibility(`Sending help in ${countdown - 1} seconds`);
    }, 1000);
    return () => clearTimeout(t);
  }, [visible, status, countdown, tickCrash, finishCrash, sendSos]);

  const cancel = () => {
    haptic.success();
    sendCancel();
    cancelCrash();
    AccessibilityInfo.announceForAccessibility('Alert cancelled');
  };

  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(200)} style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} accessibilityViewIsModal>
      {status === 'SENT' ? (
        <SentView onSafe={cancel} />
      ) : (
        <CountdownView countdown={countdown} total={total} onCancel={cancel} onSendNow={() => { haptic.sos(); sendSos(); finishCrash(); }} />
      )}
    </Animated.View>
  );
}

function CountdownView({ countdown, total, onCancel, onSendNow }: { countdown: number; total: number; onCancel: () => void; onSendNow: () => void }) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const crewCount = useSentioStore((s) => s.ghostRiders.length);
  const pulse = useSharedValue(0);
  const drain = useSharedValue(countdown / Math.max(1, total));

  useEffect(() => {
    if (!reduced) pulse.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }), -1, false);
  }, [reduced, pulse]);

  useEffect(() => {
    drain.value = withTiming(Math.max(0, countdown - 1) / Math.max(1, total), { duration: 1000, easing: Easing.linear });
  }, [countdown, total, drain]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.5 }], opacity: 1 - pulse.value }));
  const barStyle = useAnimatedStyle(() => ({ width: `${drain.value * 100}%` }));

  return (
    <View style={{ flex: 1, backgroundColor: SOS.bg, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl, paddingHorizontal: space.xl }}>
      <View style={{ alignItems: 'center', gap: space.sm }}>
        <View style={styles.badge}>
          <Ionicons name="warning" size={16} color={SOS.text} />
          <Text variant="label" color={SOS.text}>
            Crash detected
          </Text>
        </View>
        <Text variant="title" color={SOS.text} align="center" style={{ fontSize: 34, lineHeight: 40, marginTop: space.sm }} accessibilityRole="header">
          Are you OK?
        </Text>
        <Text variant="body" color={SOS.textSoft} align="center">
          If you don’t respond, we’ll send your location to mountain rescue and {crewCount} people in your crew.
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.ringWrap}>
          <Animated.View style={[styles.ring, { borderColor: SOS.text }, ringStyle]} />
          <View style={[styles.core, { backgroundColor: SOS.bgDeep }]}>
            <Text variant="hero" color={SOS.text} tabular style={{ fontSize: 112, lineHeight: 116 }} accessibilityLabel={`${countdown} seconds`}>
              {countdown}
            </Text>
          </View>
        </View>
        <Text variant="bodyStrong" color={SOS.text} style={{ marginTop: space.xxl }}>
          Sending help in {countdown} s
        </Text>
        <View style={[styles.track, { backgroundColor: SOS.ring }]}>
          <Animated.View style={[styles.fill, barStyle]} />
        </View>
      </View>

      <View style={{ gap: space.md }}>
        <Button
          label="I’m OK — cancel"
          icon="checkmark-circle"
          variant="onSos"
          size="glove"
          onPress={onCancel}
          style={{ height: 76 }}
          accessibilityHint="Stops the emergency alert"
        />
        <Button label="Get help now" icon="medkit" variant="onSosOutline" size="lg" onPress={onSendNow} accessibilityHint="Sends the emergency alert immediately" />
      </View>
    </View>
  );
}

function SentView({ onSafe }: { onSafe: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const telemetry = useSentioStore((s) => s.telemetry);
  const crew = useSentioStore((s) => s.ghostRiders);
  const sentAt = useSentioStore((s) => s.sosSentAt);
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!reduced) pulse.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
  }, [reduced, pulse]);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 1.2 }], opacity: 0.6 * (1 - pulse.value) }));

  const notified = [
    { icon: 'medkit' as const, title: 'Mountain rescue', detail: 'Pamporovo dispatch · location shared', ok: true },
    { icon: 'people' as const, title: 'Your crew', detail: crew.map((c) => c.name).join(', '), ok: true },
    { icon: 'heart' as const, title: 'Emergency contacts', detail: 'None added yet', ok: false },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.xl, paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.xl }}>
        <View style={{ alignItems: 'center', gap: space.md }}>
          <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[styles.sentRing, { backgroundColor: colors.sos }, ringStyle]} />
            <View style={[styles.sentCore, { backgroundColor: colors.sos }]}>
              <Ionicons name="radio" size={40} color="#fff" />
            </View>
          </View>
          <Text variant="title" align="center" accessibilityRole="header">
            Help is on the way
          </Text>
          <Text variant="body" tone="secondary" align="center">
            Alert sent {sentAt ? formatAgo(sentAt).toLowerCase() : 'just now'}. Stay where you are and keep your goggles on if you can.
          </Text>
        </View>

        <Surface style={{ gap: space.md }}>
          <Text variant="overline" tone="secondary">
            Your location
          </Text>
          <Text variant="bodyStrong" tabular selectable>
            {formatCoord(telemetry.latitude, telemetry.longitude)}
          </Text>
          <Text variant="callout" tone="secondary" tabular>
            Altitude {Math.round(telemetry.altitude)} m · updating live
          </Text>
        </Surface>

        <Surface padding={0}>
          {notified.map((n, i) => (
            <View key={n.title} style={[styles.notifiedRow, i < notified.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong }]}>
              <View style={[styles.notifiedIcon, { backgroundColor: colors.sosSoft }]}>
                <Ionicons name={n.icon} size={18} color={colors.sos} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{n.title}</Text>
                <Text variant="callout" tone="secondary" numberOfLines={1}>
                  {n.detail}
                </Text>
              </View>
              {n.ok ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.success} accessibilityLabel="Notified" />
              ) : (
                <Ionicons name="remove-circle-outline" size={20} color={colors.textTertiary} accessibilityLabel="Not set up" />
              )}
            </View>
          ))}
        </Surface>
      </ScrollView>

      <View style={{ paddingHorizontal: space.xl, paddingBottom: insets.bottom + space.lg, gap: space.md }}>
        <Button label="Call 112" icon="call" variant="sos" size="glove" onPress={() => {}} accessibilityHint="Calling is not connected in this prototype" />
        <HoldButton
          label="I’m safe — cancel alert"
          holdLabel="Hold to cancel the alert…"
          icon="hand-left"
          onComplete={onSafe}
          bg={colors.surfaceRaised}
          fill={colors.successSoft}
          fg={colors.text}
          height={56}
          accessibilityHint="Press and hold to tell rescue and your crew you are safe"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: SOS.panel,
  },
  ringWrap: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 3 },
  core: { width: 200, height: 200, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  track: { width: 220, height: 6, borderRadius: 3, marginTop: space.md, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  sentRing: { position: 'absolute', width: 96, height: 96, borderRadius: 48 },
  sentCore: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  notifiedRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  notifiedIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
