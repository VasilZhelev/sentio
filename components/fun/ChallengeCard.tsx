import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, Surface, PressableScale } from '@/components/ui';
import { useSocialStore, type Challenge } from '@/store/useSocialStore';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/lib/haptics';
import { radius, space, fun } from '@/constants/tokens';

export function ChallengeList() {
  const challenges = useSocialStore((s) => s.challenges);
  return (
    <Surface padding={space.sm} style={{ gap: 2 }}>
      {challenges.map((c) => (
        <ChallengeRow key={c.id} c={c} />
      ))}
    </Surface>
  );
}

function ChallengeRow({ c }: { c: Challenge }) {
  const { colors } = useTheme();
  const claim = useSocialStore((s) => s.claimChallenge);
  const done = c.current >= c.target;
  const pct = Math.min(1, c.current / c.target);

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: c.claimed ? colors.successSoft : done ? fun.gold + '2A' : colors.surfaceSunken }]}>
        <Ionicons name={c.claimed ? 'checkmark' : c.icon} size={20} color={c.claimed ? colors.success : done ? fun.gold : colors.textSecondary} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}>
          <Text variant="bodyStrong" style={{ flex: 1, opacity: c.claimed ? 0.6 : 1 }}>
            {c.title}
          </Text>
          <Text variant="caption" color={fun.gold} tabular>
            +{c.xp} XP
          </Text>
        </View>
        {!done && (
          <>
            <View style={[styles.track, { backgroundColor: colors.surfaceSunken }]}>
              <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: colors.accent }]} />
            </View>
            <Text variant="caption" tone="tertiary" tabular>
              {c.current} / {c.target} {c.unit}
            </Text>
          </>
        )}
        {done && !c.claimed && (
          <PressableScale
            onPress={() => {
              haptic.success();
              claim(c.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Claim ${c.xp} XP for ${c.title}`}
            style={[styles.claim, { backgroundColor: fun.gold }]}
          >
            <Ionicons name="gift" size={16} color="#1A1200" />
            <Text variant="label" color="#1A1200">
              Claim reward
            </Text>
          </PressableScale>
        )}
        {c.claimed && (
          <Text variant="caption" tone="success">
            Completed
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, padding: space.md },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  claim: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: space.md, borderRadius: radius.pill },
});
