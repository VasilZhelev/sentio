import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInRight, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, useReducedMotion } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, PressableScale, Surface } from '@/components/ui';
import { useSentioStore, type SportProfile } from '@/store/useSentioStore';
import { useSmartGlassesBLE } from '@/hooks/useSmartGlassesBLE';
import { useTheme } from '@/hooks/useTheme';
import { SPORTS, type IconName } from '@/constants/sports';
import { radius, space } from '@/constants/tokens';
import { haptic } from '@/lib/haptics';

const STEPS = 4;

export default function Onboarding() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const setHasOnboarded = useSentioStore((s) => s.setHasOnboarded);

  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));
  const finish = () => {
    haptic.success();
    setHasOnboarded(true);
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg, paddingHorizontal: space.xl }}>
      <View style={styles.progress} accessible accessibilityLabel={`Step ${step + 1} of ${STEPS}`}>
        {Array.from({ length: STEPS }).map((_, i) => (
          <View key={i} style={[styles.progressSeg, { backgroundColor: i <= step ? colors.accent : colors.surfaceRaised }]} />
        ))}
      </View>

      <Animated.View key={step} entering={step === 0 ? FadeIn.duration(300) : FadeInRight.duration(260)} style={{ flex: 1 }}>
        {step === 0 && <Welcome onNext={next} />}
        {step === 1 && <PickSport onNext={next} />}
        {step === 2 && <PairGoggles onNext={next} />}
        {step === 3 && <Contacts onFinish={finish} />}
      </Animated.View>
    </View>
  );
}

function Welcome({ onNext }: { onNext: () => void }) {
  const features: { icon: IconName; title: string; body: string }[] = [
    { icon: 'shield-checkmark', title: 'Crash detection', body: 'If you go down hard and don’t respond, help is sent to your exact location.' },
    { icon: 'people', title: 'Your crew, live', body: 'See friends on a 3D map of the mountain and talk without stopping.' },
    { icon: 'glasses', title: 'Eyes up', body: 'Speed, messages and warnings right in your goggles. Phone stays in your pocket.' },
  ];
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', gap: space.xxl }}>
        <View style={{ gap: space.md }}>
          <Text variant="overline" tone="accent">
            Sentio
          </Text>
          <Text variant="display" style={{ fontSize: 44, lineHeight: 48, letterSpacing: -1.5 }}>
            Ride further.{'\n'}Never alone.
          </Text>
        </View>
        <View style={{ gap: space.xl }}>
          {features.map((f) => (
            <FeatureRow key={f.title} {...f} />
          ))}
        </View>
      </View>
      <Button label="Get started" onPress={onNext} size="glove" fullWidth />
    </View>
  );
}

function FeatureRow({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: space.lg }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="callout" tone="secondary">
          {body}
        </Text>
      </View>
    </View>
  );
}

function PickSport({ onNext }: { onNext: () => void }) {
  const { colors } = useTheme();
  const sport = useSentioStore((s) => s.sportProfile);
  const setSport = useSentioStore((s) => s.setSportProfile);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, gap: space.xxl, paddingTop: space.xxxl }}>
        <View style={{ gap: space.sm }}>
          <Text variant="title" accessibilityRole="header">
            What do you ride?
          </Text>
          <Text variant="body" tone="secondary">
            We tune stats, hazard reports and the map to your sport. You can change this any time.
          </Text>
        </View>
        <View style={{ gap: space.md }} accessibilityRole="radiogroup">
          {(Object.keys(SPORTS) as SportProfile[]).map((key) => {
            const s = SPORTS[key];
            const selected = sport === key;
            return (
              <PressableScale
                key={key}
                onPress={() => { haptic.select(); setSport(key); }}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={s.label}
                style={[styles.sportCard, { backgroundColor: selected ? colors.accentSoft : colors.surface, borderColor: selected ? colors.accent : colors.border }]}
              >
                <View style={[styles.sportIcon, { backgroundColor: selected ? colors.accent : colors.surfaceRaised }]}>
                  <Ionicons name={s.icon} size={28} color={selected ? colors.onAccent : colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="headline">{s.label}</Text>
                  <Text variant="callout" tone="secondary">
                    {s.description}
                  </Text>
                </View>
                <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={selected ? colors.accent : colors.textTertiary} />
              </PressableScale>
            );
          })}
        </View>
      </View>
      <Button label="Continue" onPress={onNext} size="glove" fullWidth />
    </View>
  );
}

function PairGoggles({ onNext }: { onNext: () => void }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const bleConnected = useSentioStore((s) => s.bleConnected);
  const { isScanning, scanForDevices } = useSmartGlassesBLE();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (!reduced) pulse.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
  }, [reduced, pulse]);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.8 }], opacity: (1 - pulse.value) * 0.5 }));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xxl }}>
        <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
          {!bleConnected && <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 80, borderWidth: 2, borderColor: colors.accent }, ring]} />}
          <View style={{ width: 128, height: 128, borderRadius: 64, backgroundColor: bleConnected ? colors.successSoft : colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={bleConnected ? 'checkmark' : 'glasses'} size={56} color={bleConnected ? colors.success : colors.accent} />
          </View>
        </View>
        <View style={{ gap: space.sm, alignItems: 'center' }}>
          <Text variant="title" align="center" accessibilityRole="header">
            {bleConnected ? 'Goggles connected' : 'Pair your goggles'}
          </Text>
          <Text variant="body" tone="secondary" align="center" style={{ maxWidth: 300 }}>
            {bleConnected ? 'Crash detection is on. You’re protected while you ride.' : 'Turn your goggles on and hold them near your phone. Crash detection needs them connected.'}
          </Text>
        </View>
      </View>
      <View style={{ gap: space.sm }}>
        {bleConnected ? (
          <Button label="Continue" onPress={onNext} size="glove" fullWidth />
        ) : (
          <>
            <Button label={isScanning ? 'Searching…' : 'Search for goggles'} icon="bluetooth" loading={isScanning} onPress={() => scanForDevices()} size="glove" fullWidth />
            <Button label="Skip for now" variant="ghost" onPress={onNext} fullWidth />
          </>
        )}
      </View>
    </View>
  );
}

function Contacts({ onFinish }: { onFinish: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, gap: space.xxl, paddingTop: space.xxxl }}>
        <View style={{ gap: space.sm }}>
          <Text variant="title" accessibilityRole="header">
            Who should we alert?
          </Text>
          <Text variant="body" tone="secondary">
            After a crash, Sentio alerts mountain rescue and your crew with your location. Add family or friends to be told too.
          </Text>
        </View>
        <Surface style={{ gap: space.lg }}>
          <AlertRow icon="medkit" label="Mountain rescue" detail="Always alerted" tint={colors.sos} />
          <AlertRow icon="people" label="Riders in your crew" detail="Always alerted" tint={colors.accent} />
          <AlertRow icon="heart" label="Emergency contacts" detail="Coming soon" tint={colors.textTertiary} />
        </Surface>
      </View>
      <Button label="Start riding" onPress={onFinish} size="glove" fullWidth />
    </View>
  );
}

function AlertRow({ icon, label, detail, tint }: { icon: IconName; label: string; detail: string; tint: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <Ionicons name={icon} size={22} color={tint} />
      <Text variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="callout" tone="secondary">
        {detail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: 6, marginBottom: space.lg },
  progressSeg: { flex: 1, height: 4, borderRadius: 2 },
  sportCard: { flexDirection: 'row', alignItems: 'center', gap: space.lg, padding: space.lg, borderRadius: radius.lg, borderWidth: 1.5 },
  sportIcon: { width: 56, height: 56, borderRadius: radius.md + 4, alignItems: 'center', justifyContent: 'center' },
});
