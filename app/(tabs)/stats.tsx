import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen, Text, Surface, StatTile, Chip, ComingSoon, SectionHeader } from '@/components/ui';
import { useSentioStore } from '@/store/useSentioStore';
import { useTheme } from '@/hooks/useTheme';
import { SPORTS } from '@/constants/sports';
import { formatDuration } from '@/lib/format';
import { radius, space } from '@/constants/tokens';

export default function StatsScreen() {
  const { colors } = useTheme();
  const telemetry = useSentioStore((s) => s.telemetry);
  const session = useSentioStore((s) => s.session);
  const sport = useSentioStore((s) => s.sportProfile);
  const bleConnected = useSentioStore((s) => s.bleConnected);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const vertical = Math.round(session.maxAltitude - session.minAltitude);
  const isSki = sport === 'SKI';

  return (
    <Screen
      title="Ride"
      subtitle={`${SPORTS[sport].label} · today`}
      accessory={<Chip tone="success" dotColor={colors.success} label={formatDuration(now - session.startedAt)} />}
    >
      <Surface padding={space.xl} style={{ gap: space.xs }}>
        <Text variant="label" tone="secondary">
          Current speed
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }} accessible accessibilityLabel={`${Math.round(telemetry.speed)} kilometres per hour`}>
          <Text variant="hero" tabular>
            {Math.round(telemetry.speed)}
          </Text>
          <Text variant="headline" tone="secondary">
            km/h
          </Text>
        </View>
        <SpeedBar value={telemetry.speed} max={Math.max(60, session.maxSpeed)} />
        <Text variant="caption" tone="tertiary" tabular style={{ marginTop: space.xs }}>
          Session max {Math.round(session.maxSpeed)} km/h
        </Text>
      </Surface>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        <StatTile label="Top speed" icon="speedometer-outline" value={`${Math.round(session.maxSpeed)}`} unit="km/h" />
        <StatTile label="Peak G-force" icon="pulse-outline" value={session.peakG.toFixed(1)} unit="G" />
        <StatTile label="Altitude" icon="trending-up-outline" value={`${Math.round(telemetry.altitude)}`} unit="m" />
        {isSki ? (
          <StatTile label="Vertical" icon="arrow-down-outline" value={`${vertical}`} unit="m" />
        ) : (
          <StatTile label="Lap time" icon="stopwatch-outline" value={telemetry.lapTime} />
        )}
        <StatTile label="Air time" icon="airplane-outline" value={telemetry.airTime.toFixed(1)} unit="s" />
        <StatTile label="Current G" icon="radio-button-on-outline" value={telemetry.gForce.toFixed(1)} unit="G" />
      </View>

      <View style={{ gap: space.md }}>
        <SectionHeader title="G-force" />
        <Surface>
          {session.gHistory.length > 1 ? (
            <Sparkline data={session.gHistory} />
          ) : (
            <View style={{ height: 96, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Text variant="bodyStrong">No G-force data yet</Text>
              <Text variant="callout" tone="secondary" align="center">
                {bleConnected ? 'Start riding — impacts and landings will show up here.' : 'Connect your goggles to record G-force.'}
              </Text>
            </View>
          )}
        </Surface>
      </View>

      <ComingSoon icon="calendar-outline" title="Ride history" body="Every session saved with a 3D replay of your runs, and season totals to beat." />
    </Screen>
  );
}

function SpeedBar({ value, max }: { value: number; max: number }) {
  const { colors } = useTheme();
  const pct = Math.min(1, value / max);
  return (
    <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceSunken, overflow: 'hidden', marginTop: space.sm }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent }} />
    </View>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const { colors } = useTheme();
  const max = Math.max(3, ...data);
  return (
    <View style={{ height: 96, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }} accessible accessibilityLabel={`G-force history, peak ${max.toFixed(1)} G`}>
      {data.map((g, i) => (
        <View key={i} style={{ flex: 1, height: `${Math.max(4, (g / max) * 100)}%`, borderRadius: 2, backgroundColor: g > 3 ? colors.warning : colors.accent, opacity: 0.4 + 0.6 * (i / data.length) }} />
      ))}
    </View>
  );
}
