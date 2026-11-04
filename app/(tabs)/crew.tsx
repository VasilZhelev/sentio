import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Avatar, SegmentedControl, SectionHeader, IconButton } from '@/components/ui';
import { StoriesRow, PostCard, Podium } from '@/components/fun';
import { useSentioStore } from '@/store/useSentioStore';
import { useSocialStore } from '@/store/useSocialStore';
import { useTheme } from '@/hooks/useTheme';
import { radius, space, fun, fontFamily } from '@/constants/tokens';

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
  const posts = useSocialStore((s) => s.posts);
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
      <StoriesRow />

      <CrewBattle />

      <View style={{ gap: space.md }}>
        <SectionHeader title="Today’s leaderboard" />
        <SegmentedControl options={METRICS} value={metric} onChange={setMetric} />
        <View style={{ gap: space.md, marginTop: space.md }}>
          <Podium key={metric} unit={unit} entries={board.slice(0, 3).map((r) => ({ id: r.id, name: r.name, avatar: r.avatar, value: fmt(r[metric]), me: r.me }))} />
          <View style={{ gap: 2 }}>
            {board.slice(3).map((row, i) => (
              <View key={row.id} style={[styles.row, row.me && { backgroundColor: colors.accentSoft }]} accessible accessibilityLabel={`Rank ${i + 4}, ${row.name}, ${fmt(row[metric])} ${unit}`}>
                <Text variant="label" tone="tertiary" tabular style={{ width: 20 }}>
                  {i + 4}
                </Text>
                <Avatar source={row.avatar} size={32} />
                <Text variant="bodyStrong" style={{ flex: 1 }} color={row.me ? colors.accent : undefined}>
                  {row.me ? 'You' : row.name}
                </Text>
                <Text variant="bodyStrong" tabular>
                  {fmt(row[metric])}{' '}
                  <Text variant="caption" tone="secondary">
                    {unit}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={{ gap: space.xxxl + space.sm }}>
        <SectionHeader title="Feed" />
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </View>
    </Screen>
  );
}

/** Crew vs crew: total vertical today. */
function CrewBattle() {
  const { colors } = useTheme();
  const us = 6840;
  const them = 5920;
  const total = us + them;
  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Ionicons name="flash" size={16} color={fun.flame} />
        <Text variant="overline" color={fun.flame}>
          Crew battle · ends in 3 h 12 min
        </Text>
      </View>
      <Text variant="title" style={{ fontSize: 28, lineHeight: 32 }}>
        Most vertical today
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text variant="caption" tone="secondary">
            Your crew
          </Text>
          <Text variant="display" tabular color={colors.accent} style={{ fontSize: 52, lineHeight: 54 }}>
            {(us / 1000).toFixed(2)}
            <Text variant="callout" tone="secondary">
              {' '}km
            </Text>
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="caption" tone="secondary">
            Bansko Bandits
          </Text>
          <Text variant="display" tabular color={fun.pink} style={{ fontSize: 52, lineHeight: 54 }}>
            {(them / 1000).toFixed(2)}
            <Text variant="callout" tone="secondary">
              {' '}km
            </Text>
          </Text>
        </View>
      </View>
      <View style={{ marginVertical: space.xs }}>
        <View style={[styles.battle, { backgroundColor: fun.pink }]}>
          <View style={{ width: `${(us / total) * 100}%`, height: '100%', backgroundColor: colors.accent }} />
        </View>
        <View style={[styles.vs, { backgroundColor: colors.bg, borderColor: colors.bg, left: `${(us / total) * 100}%` }]}>
          <Text variant="caption" style={{ fontSize: 10, fontFamily: fontFamily.display }}>
            VS
          </Text>
        </View>
      </View>
      <Text variant="callout" tone="secondary">
        You’re 920 m ahead. One more lap from everyone seals it 💪
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: space.sm + 2, borderRadius: radius.pill },
  battle: { height: 12, borderRadius: 6, overflow: 'hidden', flexDirection: 'row' },
  vs: { position: 'absolute', top: -10, marginLeft: -16, width: 32, height: 32, borderRadius: 16, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});
