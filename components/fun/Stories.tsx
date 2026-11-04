import React, { useEffect, useState } from 'react';
import { View, ScrollView, Modal, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, cancelAnimation, ReduceMotion } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Avatar, PressableScale } from '@/components/ui';
import { EmojiSpam } from '@/components/EmojiSpam';
import { useSentioStore, type GhostRider } from '@/store/useSentioStore';
import { useSocialStore } from '@/store/useSocialStore';
import { useTheme } from '@/hooks/useTheme';
import { sceneUrl } from '@/lib/mapbox';
import { haptic } from '@/lib/haptics';
import { radius, space, fun } from '@/constants/tokens';
import { MapImage, Scrim } from './MapImage';

const STORY_MS = 5000;
const BEARINGS = [120, 210, 300, 30];

/** Horizontal row of crew "live" stories (Instagram-style), plus your own. */
export function StoriesRow() {
  const { colors } = useTheme();
  const riders = useSentioStore((s) => s.ghostRiders);
  const profile = useSentioStore((s) => s.profile);
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.lg, paddingHorizontal: space.xl }} style={{ marginHorizontal: -space.xl }}>
        <View style={{ alignItems: 'center', gap: 6, width: 68 }}>
          <View style={[styles.ring, { borderColor: colors.borderStrong, borderStyle: 'dashed' }]}>
            <Avatar source={profile.avatar} size={56} />
            <View style={[styles.plus, { backgroundColor: colors.accent, borderColor: colors.bg }]}>
              <Ionicons name="add" size={14} color={colors.onAccent} />
            </View>
          </View>
          <Text variant="caption" tone="secondary">
            Your ride
          </Text>
        </View>
        {riders.map((r, i) => (
          <PressableScale key={r.id} onPress={() => { haptic.select(); setOpen(i); }} accessibilityRole="button" accessibilityLabel={`${r.name}'s live story`} style={{ alignItems: 'center', gap: 6, width: 68 }}>
            <View style={[styles.ring, { borderColor: r.speed > 30 ? fun.flame : colors.accent }]}>
              <Avatar source={r.avatarUri} size={56} />
              <View style={[styles.live, { backgroundColor: r.speed > 30 ? fun.flame : colors.accent, borderColor: colors.bg }]}>
                <Text variant="caption" color="#fff" style={{ fontSize: 9, lineHeight: 12, letterSpacing: 0.5 }}>
                  LIVE
                </Text>
              </View>
            </View>
            <Text variant="caption" numberOfLines={1}>
              {r.name}
            </Text>
          </PressableScale>
        ))}
      </ScrollView>
      <StoryViewer riders={riders} index={open} onIndex={setOpen} />
    </>
  );
}

function StoryViewer({ riders, index, onIndex }: { riders: GhostRider[]; index: number | null; onIndex: (i: number | null) => void }) {
  const insets = useSafeAreaInsets();
  const addXp = useSocialStore((s) => s.addXp);
  const progress = useSharedValue(0);
  const [spam, setSpam] = useState({ ts: 0, emoji: '' });
  const rider = index != null ? riders[index] : null;

  const go = (i: number) => {
    console.log('[story] go', i, new Error().stack?.split('\n').slice(1, 4).join(' | '));
    onIndex(i >= riders.length || i < 0 ? null : i);
  };

  useEffect(() => {
    if (index == null) return;
    // Advance with a JS timer: Reanimated finishes animations instantly under Reduce Motion,
    // which must not skip through stories. The bar is visual only.
    progress.value = 0;
    progress.value = withTiming(1, { duration: STORY_MS, easing: Easing.linear, reduceMotion: ReduceMotion.Never });
    const t = setTimeout(() => go(index + 1), STORY_MS);
    return () => {
      clearTimeout(t);
      cancelAnimation(progress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <Modal visible={rider != null} animationType="fade" onRequestClose={() => onIndex(null)} statusBarTranslucent>
      {rider && index != null && (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <MapImage
            key={rider.id}
            uri={sceneUrl({ lat: rider.latitude, lng: rider.longitude }, { zoom: 15.4, bearing: BEARINGS[index % 4], pitch: 60, width: 420, height: 860 })}
            style={StyleSheet.absoluteFill}
            accessibilityLabel={`3D view of where ${rider.name} is riding`}
          />
          <Scrim position="top" height="28%" to={0.6} />
          <Scrim position="bottom" height="50%" to={0.85} />

          {/* tap zones */}
          <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
            <Pressable style={{ flex: 1 }} onPress={() => go(index - 1)} accessibilityLabel="Previous story" />
            <Pressable style={{ flex: 2 }} onPress={() => go(index + 1)} accessibilityLabel="Next story" />
          </View>

          <View style={{ position: 'absolute', top: insets.top + space.sm, left: space.md, right: space.md, gap: space.md }} pointerEvents="box-none">
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {riders.map((r, i) => (
                <View key={r.id} style={styles.track}>
                  {i < index && <View style={[styles.fill, { width: '100%' }]} />}
                  {i === index && <Animated.View style={[styles.fill, bar]} />}
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }} pointerEvents="box-none">
              <Avatar source={rider.avatarUri} size={40} ringColor="#fff" />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" color="#fff">
                  {rider.name}
                </Text>
                <Text variant="caption" color="rgba(255,255,255,0.8)">
                  Live now · Pamporovo
                </Text>
              </View>
              <Pressable onPress={() => onIndex(null)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close stories">
                <Ionicons name="close" size={28} color="#fff" />
              </Pressable>
            </View>
          </View>

          <View style={{ position: 'absolute', left: space.xl, right: space.xl, bottom: insets.bottom + space.xl, gap: space.lg }} pointerEvents="box-none">
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
              <Text variant="hero" color="#fff" tabular style={{ fontSize: 88, lineHeight: 92 }}>
                {rider.speed}
              </Text>
              <Text variant="headline" color="rgba(255,255,255,0.8)">
                km/h
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <StoryStat label="Peak G" value={rider.peakGForce.toFixed(1)} />
              <StoryStat label="Air" value={`${rider.airTime.toFixed(1)} s`} />
              <StoryStat label="Level" value={`${rider.level}`} />
            </View>
            <View style={{ flexDirection: 'row', gap: space.sm }} pointerEvents="box-none">
              {['🔥', '🤘', '😮', '❤️'].map((e) => (
                <PressableScale
                  key={e}
                  onPress={() => {
                    haptic.success();
                    setSpam({ ts: Date.now(), emoji: e });
                    addXp(5, `Hyped ${rider.name}`);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`React ${e}`}
                  style={styles.react}
                >
                  <Text style={{ fontSize: 26, lineHeight: 32 }}>{e}</Text>
                </PressableScale>
              ))}
            </View>
          </View>
          <EmojiSpam triggerDate={spam.ts} currentEmoji={spam.emoji} />
        </View>
      )}
    </Modal>
  );
}

function StoryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.storyStat}>
      <Text variant="caption" color="rgba(255,255,255,0.7)">
        {label}
      </Text>
      <Text variant="bodyStrong" color="#fff" tabular>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { width: 66, height: 66, borderRadius: 33, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  plus: { position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  live: { position: 'absolute', bottom: -6, paddingHorizontal: 5, paddingVertical: 1, borderRadius: radius.sm, borderWidth: 2 },
  track: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#fff' },
  storyStat: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.md, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  react: { flex: 1, height: 56, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
