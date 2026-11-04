import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text } from '@/components/ui';
import { MapImage, Scrim } from '@/components/fun';
import { ActivityRings } from '@/components/fun/ActivityRings';
import { useSentioStore } from '@/store/useSentioStore';
import { ROUTES } from '@/hooks/usePamporovoSimulation';
import { useTheme } from '@/hooks/useTheme';
import { SPORTS } from '@/constants/sports';
import { formatDuration } from '@/lib/format';
import { routeUrl } from '@/lib/mapbox';
import { space, fun, fontFamily } from '@/constants/tokens';

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

  const isSki = sport === 'SKI';
  const vertical = Math.round(session.maxAltitude - session.minAltitude);
  const metrics = [
    { label: 'Top speed', value: `${Math.round(session.maxSpeed)}`, unit: 'km/h', color: colors.accent },
    { label: 'Peak G', value: session.peakG.toFixed(1), unit: 'G', color: fun.flame },
    { label: 'Altitude', value: `${Math.round(telemetry.altitude)}`, unit: 'm', color: fun.lime },
    isSki
      ? { label: 'Vertical', value: `${vertical}`, unit: 'm', color: fun.violet }
      : { label: 'Lap', value: telemetry.lapTime, unit: '', color: fun.violet },
    { label: 'Air time', value: telemetry.airTime.toFixed(1), unit: 's', color: fun.pink },
    { label: 'Current G', value: telemetry.gForce.toFixed(1), unit: 'G', color: fun.silver },
  ];

  return (
    <Screen gap={space.xxxl + 4}>
      {/* header */}
      <View style={{ gap: space.xs, marginTop: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
          <Text variant="overline" tone="success" tabular>
            Live · {formatDuration(now - session.startedAt)}
          </Text>
        </View>
        <Text variant="title" accessibilityRole="header">
          Today’s ride
        </Text>
        <Text variant="callout" tone="secondary">
          {SPORTS[sport].label} · Pamporovo
        </Text>
      </View>

      {/* hero */}
      <View accessible accessibilityLabel={`Current speed ${Math.round(telemetry.speed)} kilometres per hour`}>
        <Text variant="overline" tone="secondary">
          Speed now
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm }}>
          <Text variant="hero" tabular style={{ fontSize: 148, lineHeight: 140 }}>
            {Math.round(telemetry.speed)}
          </Text>
          <Text variant="headline" tone="secondary" style={{ marginBottom: 20 }}>
            km/h
          </Text>
        </View>
        <SpeedTrack value={telemetry.speed} max={Math.max(80, session.maxSpeed)} best={session.maxSpeed} />
      </View>

      {/* metrics: two columns, no boxes, hairline rules */}
      <View style={styles.grid}>
        {metrics.map((m, i) => (
          <View
            key={m.label}
            style={[styles.metric, { borderTopColor: colors.border }, i % 2 === 0 && { paddingRight: space.lg }, i % 2 === 1 && { paddingLeft: space.lg, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border }]}
            accessible
            accessibilityLabel={`${m.label} ${m.value} ${m.unit}`}
          >
            <Text variant="overline" color={m.color}>
              {m.label}
            </Text>
            <Text variant="display" tabular style={{ fontSize: 44, lineHeight: 46 }}>
              {m.value}
              <Text variant="callout" tone="secondary" style={{ fontFamily: fontFamily.displaySemi }}>
                {' '}
                {m.unit}
              </Text>
            </Text>
          </View>
        ))}
      </View>

      {/* rings */}
      <View style={{ gap: space.lg }}>
        <SectionTitle title="Today’s challenges" />
        <ActivityRings />
      </View>

      {/* g-force */}
      <View style={{ gap: space.md }}>
        <SectionTitle title="G-force" />
        {session.gHistory.length > 1 ? (
          <Bars data={session.gHistory} />
        ) : (
          <View style={{ gap: 4 }}>
            <Bars data={[1, 1.2, 1.1, 1.6, 2.4, 1.3, 1.1, 3.1, 1.4, 1.2, 1.9, 1.1, 1.0, 2.2, 1.3, 1.1, 1.2, 2.8, 1.2, 1.1]} ghost />
            <Text variant="callout" tone="secondary">
              {bleConnected ? 'Impacts and landings appear as you ride.' : 'Connect your goggles to record G-force.'}
            </Text>
          </View>
        )}
      </View>

      {/* personal bests */}
      <View style={{ gap: space.lg }}>
        <SectionTitle title="Personal bests" />
        <View style={{ flexDirection: 'row' }}>
          {[
            { icon: 'speedometer' as const, v: '74', u: 'km/h', l: 'Top speed' },
            { icon: 'airplane' as const, v: '1.8', u: 's', l: 'Air time' },
            { icon: 'trending-down' as const, v: '2.1k', u: 'm', l: 'Best day' },
          ].map((p, i) => (
            <View key={p.l} style={[{ flex: 1, gap: 4 }, i > 0 && { paddingLeft: space.lg, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border }]}>
              <Ionicons name={p.icon} size={18} color={fun.gold} />
              <Text variant="display" tabular style={{ fontSize: 34, lineHeight: 36 }}>
                {p.v}
                <Text variant="caption" tone="secondary">
                  {' '}
                  {p.u}
                </Text>
              </Text>
              <Text variant="caption" tone="secondary">
                {p.l}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* last run — full bleed */}
      <View style={{ gap: space.lg }}>
        <SectionTitle title="Last run" />
        <MapImage uri={routeUrl(ROUTES.g1[0].waypoints, { width: 700, height: 440 })} style={{ marginHorizontal: -space.xl, aspectRatio: 1.45 }} accessibilityLabel="Map of your last run">
          <Scrim height="55%" to={0.8} />
          <View style={{ position: 'absolute', left: space.xl, right: space.xl, bottom: space.lg }}>
            <Text variant="title" color="#fff">
              Malina
            </Text>
            <View style={{ flexDirection: 'row', gap: space.xl, marginTop: space.xs }}>
              {[
                ['52', 'km/h top'],
                ['3:05', 'time'],
                ['412', 'm vertical'],
              ].map(([v, l]) => (
                <Text key={l} variant="callout" color="rgba(255,255,255,0.75)">
                  <Text variant="headline" color="#fff" tabular style={{ fontFamily: fontFamily.numeric, fontSize: 22 }}>
                    {v}
                  </Text>{' '}
                  {l}
                </Text>
              ))}
            </View>
          </View>
        </MapImage>
      </View>
    </Screen>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text variant="headline" accessibilityRole="header" style={{ fontSize: 22 }}>
      {title}
    </Text>
  );
}

function SpeedTrack({ value, max, best }: { value: number; max: number; best: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceSunken, marginTop: space.md }}>
      <View style={{ width: `${Math.min(1, value / max) * 100}%`, height: '100%', borderRadius: 3, backgroundColor: colors.accent }} />
      {best > 0 && <View style={{ position: 'absolute', left: `${Math.min(1, best / max) * 100}%`, top: -4, width: 2, height: 14, borderRadius: 1, backgroundColor: fun.gold }} />}
    </View>
  );
}

function Bars({ data, ghost }: { data: number[]; ghost?: boolean }) {
  const { colors } = useTheme();
  const max = Math.max(3.5, ...data);
  return (
    <View style={{ height: 88, flexDirection: 'row', alignItems: 'flex-end', gap: 4, opacity: ghost ? 0.25 : 1 }} accessible={!ghost} accessibilityLabel={`G-force history, peak ${max.toFixed(1)} G`}>
      {data.map((g, i) => (
        <View key={i} style={{ flex: 1, height: `${Math.max(6, (g / max) * 100)}%`, borderRadius: 3, backgroundColor: g > 2.5 ? fun.flame : colors.accent }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  metric: { width: '50%', paddingVertical: space.lg, borderTopWidth: StyleSheet.hairlineWidth, gap: 2 },
});
