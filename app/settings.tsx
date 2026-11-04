import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Screen, Text, Avatar, ListGroup, ListRow, SegmentedControl, IconButton, Surface } from '@/components/ui';
import { useSentioStore, type Appearance, type SportProfile } from '@/store/useSentioStore';
import { useTheme } from '@/hooks/useTheme';
import { SPORTS } from '@/constants/sports';
import { space } from '@/constants/tokens';

const COUNTDOWNS = [10, 15, 20, 30];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const profile = useSentioStore((s) => s.profile);
  const sport = useSentioStore((s) => s.sportProfile);
  const setSport = useSentioStore((s) => s.setSportProfile);
  const appearance = useSentioStore((s) => s.appearance);
  const setAppearance = useSentioStore((s) => s.setAppearance);
  const countdown = useSentioStore((s) => s.sosCountdownSeconds);
  const setCountdown = useSentioStore((s) => s.setSosCountdownSeconds);
  const bleConnected = useSentioStore((s) => s.bleConnected);
  const setHasOnboarded = useSentioStore((s) => s.setHasOnboarded);

  return (
    <Screen
      inTabs={false}
      title="Settings"
      header={
        <View style={{ flexDirection: 'row' }}>
          <IconButton icon="chevron-back" accessibilityLabel="Back" variant="solid" size={40} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </View>
      }
    >
      <Surface style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
        <Avatar source={profile.avatar} size={56} />
        <View style={{ flex: 1 }}>
          <Text variant="headline">{profile.name}</Text>
          <Text variant="callout" tone="secondary">
            {SPORTS[sport].label}
          </Text>
        </View>
        <Text variant="label" tone="tertiary">
          Edit · soon
        </Text>
      </Surface>

      <View style={{ gap: space.md }}>
        <Text variant="overline" tone="secondary" style={{ paddingHorizontal: space.xs }}>
          Sport
        </Text>
        <SegmentedControl<SportProfile>
          options={[
            { value: 'SKI', label: SPORTS.SKI.label },
            { value: 'MOTOCROSS', label: SPORTS.MOTOCROSS.label },
          ]}
          value={sport}
          onChange={setSport}
        />
      </View>

      <View style={{ gap: space.md }}>
        <Text variant="overline" tone="secondary" style={{ paddingHorizontal: space.xs }}>
          Appearance
        </Text>
        <SegmentedControl<Appearance>
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          value={appearance}
          onChange={setAppearance}
        />
      </View>

      <View style={{ gap: space.md }}>
        <Text variant="overline" tone="secondary" style={{ paddingHorizontal: space.xs }}>
          Safety
        </Text>
        <Surface style={{ gap: space.md }}>
          <View>
            <Text variant="bodyStrong">SOS countdown</Text>
            <Text variant="callout" tone="secondary">
              Time you have to cancel after a crash before help is alerted.
            </Text>
          </View>
          <SegmentedControl
            options={COUNTDOWNS.map((c) => ({ value: String(c), label: `${c} s` }))}
            value={String(countdown)}
            onChange={(v) => setCountdown(Number(v))}
          />
        </Surface>
        <ListGroup footer="Mountain rescue is always alerted with your location. Contacts and sensitivity are coming soon.">
          <ListRow icon="people-outline" title="Emergency contacts" badge="Soon" disabled />
          <ListRow icon="pulse-outline" title="Crash sensitivity" badge="Soon" disabled last />
        </ListGroup>
      </View>

      <ListGroup title="General">
        <ListRow icon="speedometer-outline" title="Units" value="Metric" />
        <ListRow icon="glasses-outline" title="Goggles" value={bleConnected ? 'Connected' : 'Not connected'} chevron onPress={() => router.navigate('/goggles')} />
        <ListRow icon="refresh-outline" title="Replay intro" chevron last onPress={() => { setHasOnboarded(false); router.replace('/onboarding'); }} />
      </ListGroup>

      <Text variant="caption" tone="tertiary" align="center">
        Sentio {Constants.expoConfig?.version ?? ''}
      </Text>
      <View style={{ height: 1, backgroundColor: colors.bg }} />
    </Screen>
  );
}
