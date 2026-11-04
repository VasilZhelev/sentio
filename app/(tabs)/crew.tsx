import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen, Text, Avatar, ListGroup, ListRow, SegmentedControl, Surface, ComingSoon, SectionHeader, IconButton } from '@/components/ui';
import { useSentioStore } from '@/store/useSentioStore';
import { useTheme } from '@/hooks/useTheme';
import { distanceMeters, formatDistance } from '@/lib/format';
import { radius, space } from '@/constants/tokens';

type Metric = 'speed' | 'g' | 'air';
const METRICS: { value: Metric; label: string; unit: string }[] = [
  { value: 'speed', label: 'Top speed', unit: 'km/h' },
  { value: 'g', label: 'G-force', unit: 'G' },
  { value: 'air', label: 'Air time', unit: 's' },
];

export default function CrewScreen() {
  const { colors } = useTheme();
  const riders = useSentioStore((s) => s.ghostRiders);
  const telemetry = useSentioStore((s) => s.telemetry);
  const session = useSentioStore((s) => s.session);
  const profile = useSentioStore((s) => s.profile);
  const [metric, setMetric] = useState<Metric>('speed');

  const board = useMemo(() => {
    const me = { id: 'me', name: profile.name, avatar: profile.avatar, speed: session.maxSpeed, g: session.peakG, air: telemetry.airTime, me: true };
    const rows = riders.map((r) => ({ id: r.id, name: r.name, avatar: r.avatarUri, speed: r.speed, g: r.peakGForce, air: r.airTime, me: false }));
    return [...rows, me].sort((a, b) => b[metric] - a[metric]);
  }, [riders, session, telemetry.airTime, profile, metric]);

  const unit = METRICS.find((m) => m.value === metric)!.unit;
  const fmt = (v: number) => (metric === 'speed' ? Math.round(v).toString() : v.toFixed(1));

  return (
    <Screen
      title="Crew"
      subtitle={`Pamporovo · ${riders.length} riding now`}
      accessory={<IconButton icon="person-add-outline" accessibilityLabel="Invite friends" variant="solid" />}
    >
      <ListGroup title="Riding now">
        {riders.map((r, i) => (
          <ListRow
            key={r.id}
            left={<Avatar source={r.avatarUri} size={44} status="online" />}
            title={r.name}
            subtitle={`${formatDistance(distanceMeters(telemetry.latitude, telemetry.longitude, r.latitude, r.longitude))} away · Level ${r.level}`}
            value={`${r.speed} km/h`}
            chevron
            last={i === riders.length - 1}
            onPress={() => router.navigate('/')}
          />
        ))}
      </ListGroup>

      <View style={{ gap: space.md }}>
        <SectionHeader title="Today’s leaderboard" />
        <SegmentedControl options={METRICS} value={metric} onChange={setMetric} />
        <Surface padding={space.sm}>
          {board.map((row, i) => {
            const podium = i < 3;
            return (
              <View
                key={row.id}
                style={[styles.row, row.me && { backgroundColor: colors.accentSoft }]}
                accessible
                accessibilityLabel={`Rank ${i + 1}, ${row.name}, ${fmt(row[metric])} ${unit}`}
              >
                <View style={[styles.rank, { backgroundColor: i === 0 ? colors.accent : podium ? colors.surfaceRaised : 'transparent' }]}>
                  <Text variant="label" tabular color={i === 0 ? colors.onAccent : podium ? colors.text : colors.textTertiary}>
                    {i + 1}
                  </Text>
                </View>
                <Avatar source={row.avatar} size={36} />
                <Text variant="bodyStrong" style={{ flex: 1 }} color={row.me ? colors.accent : undefined}>
                  {row.me ? `${row.name} (you)` : row.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text variant="headline" tabular>
                    {fmt(row[metric])}
                  </Text>
                  <Text variant="caption" tone="secondary" style={{ width: 30 }}>
                    {unit}
                  </Text>
                </View>
              </View>
            );
          })}
        </Surface>
      </View>

      <ComingSoon icon="images-outline" title="Ride feed" body="Share runs, clips and personal bests with your crew — and see what friends rode today." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.sm, paddingVertical: space.sm, borderRadius: radius.md },
  rank: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
