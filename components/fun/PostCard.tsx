import React, { useRef, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring, withTiming, ZoomIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text, Avatar, Surface } from '@/components/ui';
import { useSentioStore } from '@/store/useSentioStore';
import { useSocialStore, type Post } from '@/store/useSocialStore';
import { useTheme } from '@/hooks/useTheme';
import { routeUrl, sceneUrl } from '@/lib/mapbox';
import { haptic } from '@/lib/haptics';
import { radius, space, fun, tierColor } from '@/constants/tokens';
import { MapImage, Scrim } from './MapImage';
import { BadgeMedal } from './BadgeMedal';

const ago = (m: number) => (m < 60 ? `${m} min` : `${Math.round(m / 60)} h`);

export function PostCard({ post }: { post: Post }) {
  const { colors } = useTheme();
  const rider = useSentioStore((s) => s.ghostRiders.find((r) => r.id === post.riderId));
  const toggleFire = useSocialStore((s) => s.toggleFire);
  const addXp = useSocialStore((s) => s.addXp);
  const badges = useSocialStore((s) => s.badges);
  const lastTap = useRef(0);
  const [burst, setBurst] = useState(0);
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  if (!rider) return null;

  const fire = (fromDoubleTap = false) => {
    if (fromDoubleTap && post.fired) {
      setBurst(Date.now());
      return;
    }
    haptic.success();
    pop.value = withSequence(withSpring(1.45, { damping: 6, stiffness: 400 }), withSpring(1));
    if (!post.fired) addXp(2, `Hyped ${rider.name}`);
    toggleFire(post.id);
    if (fromDoubleTap) setBurst(Date.now());
  };

  const onMediaPress = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) fire(true);
    lastTap.current = now;
  };

  const tagColor = post.tag ? fun[post.tag.tone] : undefined;

  return (
    <Surface padding={0} radius={radius.lg} style={{ overflow: 'hidden' }}>
      <View style={styles.header}>
        <Avatar source={rider.avatarUri} size={40} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{rider.name}</Text>
          <Text variant="caption" tone="secondary">
            {ago(post.minutesAgo)} · {post.place}
          </Text>
        </View>
        <View style={[styles.level, { backgroundColor: colors.surfaceSunken }]}>
          <Text variant="caption" tone="secondary" tabular>
            Lv {rider.level}
          </Text>
        </View>
      </View>

      <Text variant="body" style={{ paddingHorizontal: space.lg, paddingBottom: space.md }}>
        {post.text}
      </Text>

      <Pressable onPress={onMediaPress} accessibilityHint="Double-tap to hype">
        {post.media.kind === 'badge' ? (
          (() => {
            const b = badges.find((x) => x.id === (post.media as { badgeId: string }).badgeId)!;
            const c = tierColor[b.tier];
            return (
              <View style={[styles.media, { backgroundColor: c + '22', alignItems: 'center', justifyContent: 'center', gap: space.md }]}>
                <View style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}>
                  {[0.9, 0.65, 0.4].map((s) => (
                    <View key={s} style={{ position: 'absolute', alignSelf: 'center', top: '50%', width: 360 * s, height: 360 * s, marginTop: -180 * s, borderRadius: 999, borderWidth: 1, borderColor: c + '55' }} />
                  ))}
                </View>
                <BadgeMedal icon={b.icon} tier={b.tier} size={96} />
                <View style={{ alignItems: 'center' }}>
                  <Text variant="headline">{b.name}</Text>
                  <Text variant="callout" tone="secondary">
                    {b.description}
                  </Text>
                </View>
              </View>
            );
          })()
        ) : (
          <MapImage
            uri={
              post.media.kind === 'route'
                ? routeUrl(post.media.points, { width: 600, height: 380 })
                : sceneUrl(post.media.center, { bearing: post.media.bearing, zoom: post.media.zoom ?? 14.5, pitch: 60, width: 600, height: 380 })
            }
            style={styles.media}
            accessibilityLabel={post.media.kind === 'route' ? `Map of ${rider.name}'s run` : `3D view of ${post.place}`}
          >
            <Scrim height="45%" to={0.7} />
            {post.tag && (
              <View style={[styles.tag, { backgroundColor: tagColor }]}>
                <Ionicons name={post.tag.tone === 'gold' ? 'trophy' : 'sparkles'} size={13} color="#1A1200" />
                <Text variant="caption" color="#1A1200">
                  {post.tag.label}
                </Text>
              </View>
            )}
            {post.stats && (
              <View style={styles.statRow}>
                {post.stats.map((s) => (
                  <View key={s.label}>
                    <Text variant="caption" color="rgba(255,255,255,0.75)">
                      {s.label}
                    </Text>
                    <Text variant="headline" color="#fff" tabular>
                      {s.value}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </MapImage>
        )}
        {burst > 0 && (
          <Animated.View key={burst} entering={ZoomIn.springify().damping(8)} exiting={FadeOut.duration(400)} pointerEvents="none" style={styles.burst}>
            <BurstAutoHide onDone={() => setBurst(0)} />
          </Animated.View>
        )}
      </Pressable>

      <View style={styles.actions}>
        <Pressable onPress={() => fire()} accessibilityRole="button" accessibilityLabel={post.fired ? 'Remove hype' : 'Hype'} accessibilityState={{ selected: post.fired }} hitSlop={8} style={styles.action}>
          <Animated.View style={popStyle}>
            <Ionicons name={post.fired ? 'flame' : 'flame-outline'} size={26} color={post.fired ? fun.flame : colors.text} />
          </Animated.View>
          <Text variant="label" tabular color={post.fired ? fun.flame : colors.text}>
            {post.fires}
          </Text>
        </Pressable>
        <View style={styles.action}>
          <Ionicons name="chatbubble-outline" size={23} color={colors.text} />
          <Text variant="label" tabular>
            {post.comments}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Ionicons name="paper-plane-outline" size={23} color={colors.text} accessibilityLabel="Share" />
      </View>
    </Surface>
  );
}

function BurstAutoHide({ onDone }: { onDone: () => void }) {
  const o = useSharedValue(1);
  React.useEffect(() => {
    o.value = withTiming(0, { duration: 900 });
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [o, onDone]);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={s}>
      <Ionicons name="flame" size={110} color={fun.flame} style={{ textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 16 }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, paddingBottom: space.md },
  level: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  media: { width: '100%', aspectRatio: 1.55 },
  tag: { position: 'absolute', top: space.md, left: space.md, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 26, borderRadius: radius.pill },
  statRow: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.md, flexDirection: 'row', gap: space.xl },
  burst: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.xl, paddingHorizontal: space.lg, paddingVertical: space.md },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40 },
});
