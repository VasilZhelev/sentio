import React from 'react';
import { View, StyleSheet, type ImageSourcePropType } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text, Avatar } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { radius, space, fun } from '@/constants/tokens';

export type PodiumEntry = { id: string; name: string; avatar: ImageSourcePropType; value: string; me?: boolean };

const ORDER = [1, 0, 2]; // 2nd, 1st, 3rd
const HEIGHTS = [112, 84, 64];
const COLORS = [fun.gold, fun.silver, fun.bronze];

/** Top-3 podium. Rises in on mount. */
export function Podium({ entries, unit }: { entries: PodiumEntry[]; unit: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {ORDER.map((rank, col) => {
        const e = entries[rank];
        if (!e) return <View key={col} style={{ flex: 1 }} />;
        return (
          <View key={e.id} style={styles.col} accessible accessibilityLabel={`${rank + 1}${['st', 'nd', 'rd'][rank]}: ${e.name}, ${e.value} ${unit}`}>
            {rank === 0 && <Ionicons name="trophy" size={22} color={fun.gold} style={{ marginBottom: 4 }} />}
            <Avatar source={e.avatar} size={rank === 0 ? 64 : 52} ringColor={COLORS[rank]} />
            <Text variant="label" numberOfLines={1} style={{ marginTop: space.sm }} color={e.me ? colors.accent : undefined}>
              {e.me ? 'You' : e.name}
            </Text>
            <Text variant="headline" tabular>
              {e.value}
              <Text variant="caption" tone="secondary">
                {' '}
                {unit}
              </Text>
            </Text>
            <Animated.View
              entering={FadeInUp.delay(120 * col).springify().damping(14)}
              style={[styles.block, { height: HEIGHTS[rank], backgroundColor: COLORS[rank] + '26', borderColor: COLORS[rank] + '80' }]}
            >
              <Text variant="display" color={COLORS[rank]} style={{ fontSize: 40, lineHeight: 46 }}>
                {rank + 1}
              </Text>
            </Animated.View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  col: { flex: 1, alignItems: 'center' },
  block: { alignSelf: 'stretch', marginTop: space.sm, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, borderWidth: 1, borderBottomWidth: 0, alignItems: 'center', paddingTop: space.sm },
});
