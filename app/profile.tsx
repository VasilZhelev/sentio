import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Avatar, Surface, IconButton, SectionHeader, PressableScale } from '@/components/ui';
import { MapImage, Scrim, ProgressRing, BadgeMedal } from '@/components/fun';
import { useSentioStore } from '@/store/useSentioStore';
import { useSocialStore, xpForLevel } from '@/store/useSocialStore';
import { ROUTES } from '@/hooks/usePamporovoSimulation';
import { useTheme } from '@/hooks/useTheme';
import { SPORTS } from '@/constants/sports';
import { sceneUrl, routeUrl } from '@/lib/mapbox';
import { haptic } from '@/lib/haptics';
import { radius, space, fun } from '@/constants/tokens';

const COVER_H = 250;
const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useSentioStore((s) => s.profile);
  const sport = useSentioStore((s) => s.sportProfile);
  const { xp, level, streakDays, badges, celebrate } = useSocialStore();
  const need = xpForLevel(level);
  const unlocked = badges.filter((b) => b.unlocked).length;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl }} showsVerticalScrollIndicator={false}>
      <MapImage uri={sceneUrl({ lat: 41.6452, lng: 24.6775 }, { zoom: 13.4, bearing: 165, pitch: 60, width: 640, height: 420 })} style={{ height: COVER_H }} accessibilityLabel="Your home mountain in 3D">
        <Scrim height="70%" to={0.55} />
        <View style={[styles.topBar, { top: insets.top + space.sm }]}>
          <IconButton icon="chevron-back" accessibilityLabel="Back" variant="glass" size={40} onPress={back} />
          <View style={styles.homeTag}>
            <Ionicons name="location" size={12} color="#fff" />
            <Text variant="caption" color="#fff">
              Pamporovo
            </Text>
          </View>
          <IconButton icon="settings-outline" accessibilityLabel="Settings" variant="glass" size={40} onPress={() => router.push('/settings')} />
        </View>
      </MapImage>

      <View style={{ paddingHorizontal: space.xl, gap: space.xxl }}>
        {/* identity */}
        <View style={{ alignItems: 'center', marginTop: -62 }}>
          <ProgressRing size={124} stroke={6} progress={xp / need} color={colors.accent} track={colors.surfaceRaised} hole={colors.bg}>
            <Avatar source={profile.avatar} size={104} />
          </ProgressRing>
          <View style={[styles.levelChip, { backgroundColor: colors.accent, borderColor: colors.bg }]}>
            <Text variant="label" color={colors.onAccent} tabular>
              Level {level}
            </Text>
          </View>
          <Text variant="title" style={{ marginTop: space.md }}>
            {profile.name}
          </Text>
          <Text variant="callout" tone="secondary">
            {SPORTS[sport].label} · since 2019
          </Text>
          <Text variant="caption" tone="tertiary" tabular style={{ marginTop: space.sm }}>
            {(need - xp).toLocaleString('en-US')} XP to level {level + 1}
          </Text>
        </View>

        {/* season */}
        <View style={styles.seasonRow}>
          {[
            { v: '14', l: 'Days' },
            { v: '86', l: 'Runs' },
            { v: '74', l: 'Top km/h' },
            { v: '18.4k', l: 'Vertical m' },
          ].map((s) => (
            <View key={s.l} style={{ alignItems: 'center', flex: 1 }}>
              <Text variant="headline" tabular style={{ fontSize: 22 }}>
                {s.v}
              </Text>
              <Text variant="caption" tone="secondary">
                {s.l}
              </Text>
            </View>
          ))}
        </View>

        {/* streak */}
        <Surface style={{ gap: space.md, borderColor: fun.flame + '55' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={[styles.flame, { backgroundColor: fun.flame + '22' }]}>
              <Ionicons name="flame" size={26} color={fun.flame} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="headline">{streakDays}-day streak</Text>
              <Text variant="callout" tone="secondary">
                Ride tomorrow to keep it alive
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {WEEK.map((d, i) => {
              const done = i < streakDays;
              const today = i === streakDays;
              return (
                <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                  <View style={[styles.day, { backgroundColor: done ? fun.flame : 'transparent', borderColor: done ? fun.flame : today ? colors.text : colors.borderStrong }]}>
                    {done && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text variant="caption" tone={today ? 'primary' : 'tertiary'}>
                    {d}
                  </Text>
                </View>
              );
            })}
          </View>
        </Surface>

        {/* badges */}
        <View style={{ gap: space.md }}>
          <SectionHeader
            title="Badges"
            action={
              <Text variant="label" tone="secondary" tabular>
                {unlocked}/{badges.length}
              </Text>
            }
          />
          <View style={styles.badgeGrid}>
            {badges.map((b) => (
              <PressableScale
                key={b.id}
                onPress={() => {
                  haptic.select();
                  if (b.unlocked) celebrate({ title: b.name, subtitle: b.description, icon: b.icon, tier: b.tier });
                }}
                accessibilityRole="button"
                accessibilityLabel={`${b.name}, ${b.unlocked ? 'unlocked' : `${Math.round((b.progress ?? 0) * 100)} percent`}. ${b.description}`}
                style={styles.badgeCell}
              >
                <BadgeMedal icon={b.icon} tier={b.tier} size={64} locked={!b.unlocked} progress={b.progress} />
                <Text variant="caption" align="center" numberOfLines={1} tone={b.unlocked ? 'primary' : 'tertiary'}>
                  {b.name}
                </Text>
              </PressableScale>
            ))}
          </View>
        </View>

        {/* recent runs */}
        <View style={{ gap: space.md }}>
          <SectionHeader title="Recent runs" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.xl }} contentContainerStyle={{ gap: space.md, paddingHorizontal: space.xl }}>
            {(['g1', 'g2', 'g3', 'g4'] as const).map((id, i) => (
              <View key={id} style={{ width: 220, gap: space.sm }}>
                <MapImage uri={routeUrl(ROUTES[id][0].waypoints, { width: 440, height: 300 })} style={{ height: 150, borderRadius: radius.lg }} accessibilityLabel="Run map" />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="label">{['Malina', 'Rodopi east', 'Snezhanka 2', 'Stenata'][i]}</Text>
                  <Text variant="caption" tone="secondary" tabular>
                    {[52, 48, 41, 71][i]} km/h
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topBar: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  homeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 26, borderRadius: radius.pill, backgroundColor: 'rgba(0,0,0,0.4)' },
  levelChip: { marginTop: -16, paddingHorizontal: 12, height: 28, borderRadius: radius.pill, borderWidth: 3, justifyContent: 'center' },
  seasonRow: { flexDirection: 'row' },
  flame: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  day: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.lg },
  badgeCell: { width: '25%', alignItems: 'center', gap: 6 },
});
