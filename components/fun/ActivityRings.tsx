import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, PressableScale } from '@/components/ui';
import { useSocialStore } from '@/store/useSocialStore';
import { useTheme } from '@/hooks/useTheme';
import { haptic } from '@/lib/haptics';
import { fun, fontFamily, radius, space } from '@/constants/tokens';
import { ProgressRing } from './ProgressRing';

const RING_COLORS = [fun.lime, '#4FD1FF', fun.flame];
const k = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k` : `${n}`);
const SIZE = 156;
const STROKE = 16;
const GAP = 3;

/** Today's three challenges as concentric rings (Fitness-style), with a legend you can claim from. */
export function ActivityRings() {
  const { colors } = useTheme();
  const challenges = useSocialStore((s) => s.challenges).slice(0, 3);
  const claim = useSocialStore((s) => s.claimChallenge);

  const ring = (i: number, child?: React.ReactNode): React.ReactNode => {
    const c = challenges[i];
    const size = SIZE - i * (STROKE + GAP) * 2;
    return (
      <ProgressRing size={size} stroke={STROKE} progress={c.current / c.target} color={RING_COLORS[i]} track={RING_COLORS[i] + '2E'} hole={colors.bg}>
        {child}
      </ProgressRing>
    );
  };

  return (
    <View style={styles.wrap}>
      <View accessible accessibilityLabel={challenges.map((c) => `${c.title}: ${c.current} of ${c.target}`).join('. ')}>
        {ring(0, ring(1, ring(2)))}
      </View>
      <View style={{ flex: 1, gap: space.lg }}>
        {challenges.map((c, i) => {
          const done = c.current >= c.target;
          return (
            <View key={c.id} style={{ gap: 2 }}>
              <Text variant="overline" color={RING_COLORS[i]} numberOfLines={1}>
                {c.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text variant="headline" tabular style={{ fontFamily: fontFamily.numeric, fontSize: 24, lineHeight: 26 }}>
                  {k(c.current)}
                  <Text variant="callout" tone="secondary">
                    /{k(c.target)} {c.unit}
                  </Text>
                </Text>
                {done && !c.claimed && (
                  <PressableScale
                    onPress={() => {
                      haptic.success();
                      claim(c.id);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Claim ${c.xp} XP`}
                    style={[styles.claim, { backgroundColor: fun.gold }]}
                  >
                    <Ionicons name="gift" size={13} color="#1A1200" />
                    <Text variant="caption" color="#1A1200" style={{ fontFamily: fontFamily.display }}>
                      +{c.xp}
                    </Text>
                  </PressableScale>
                )}
                {c.claimed && <Ionicons name="checkmark-circle" size={18} color={colors.success} accessibilityLabel="Claimed" />}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
  claim: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 26, paddingHorizontal: 10, borderRadius: radius.pill },
});
