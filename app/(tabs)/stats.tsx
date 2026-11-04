import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Surface, StatTile, Chip, SectionHeader } from '@/components/ui';
import { ChallengeList, MapImage, Scrim } from '@/components/fun';
import { ROUTES } from '@/hooks/usePamporovoSimulation';
import { routeUrl } from '@/lib/mapbox';
import { useSentioStore } from '@/store/useSentioStore';
import { useTheme } from '@/hooks/useTheme';
import { SPORTS } from '@/constants/sports';
import { formatDuration } from '@/lib/format';
import { radius, space, fun } from '@/constants/tokens';

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

      <View style={{ gap: space.md }}>
        <SectionHeader title="Today’s challenges" />
        <ChallengeList />
      </View>

      <View style={{ gap: space.md }}>
        <SectionHeader title="Personal bests" />
        <View style={{ flexDirection: 'row', gap: space.md }}>
          {[
            { icon: 'speedometer' as const, v: '74', u: 'km/h', l: 'Top speed' },
            { icon: 'airplane' as const, v: '1.8', u: 's', l: 'Air time' },
            { icon: 'trending-down' as const, v: '2.1k', u: 'm', l: 'Best day' },
          ].map((p) => (
            <Surface key={p.l} style={{ flex: 1, alignItems: 'center', gap: 4, borderColor: fun.gold + '44' }}>
              <Ionicons name={p.icon} size={20} color={fun.gold} />
              <Text variant="headline" tabular>
                {p.v}
                <Text variant="caption" tone="secondary">
                  {' '}
                  {p.u}
                </Text>
              </Text>
              <Text variant="caption" tone="secondary">
                {p.l}
              </Text>
            </Surface>
          ))}
        </View>
      </View>

      <View style={{ gap: space.md }}>
        <SectionHeader title="Last run" />
        <Surface padding={0} style={{ overflow: 'hidden' }}>
          <MapImage uri={routeUrl(ROUTES.g1[0].waypoints, { width: 640, height: 360 })} style={{ width: '100%', aspectRatio: 1.7 }} accessibilityLabel="Map of your last run">
            <Scrim height="45%" to={0.7} />
            <View style={{ position: 'absolute', left: space.lg, right: space.lg, bottom: space.md, flexDirection: 'row', gap: space.xl }}>
              {[
                ['Malina', 'Run'],
                ['52 km/h', 'Top'],
                ['3:05', 'Time'],
              ].map(([v, l]) => (
                <View key={l}>
                  <Text variant="caption" color="rgba(255,255,255,0.75)">
                    {l}
                  </Text>
                  <Text variant="headline" color="#fff" tabular>
                    {v}
                  </Text>
                </View>
              ))}
            </View>
          </MapImage>
        </Surface>
      </View>
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
