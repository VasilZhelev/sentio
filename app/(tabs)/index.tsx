import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withRepeat, cancelAnimation, Easing, runOnJS, useReducedMotion, ReduceMotion } from 'react-native-reanimated';
import Mapbox from '@rnmapbox/maps';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Surface, Chip, Avatar, Sheet, Button, PressableScale, useTabBarSpace } from '@/components/ui';
import { EmojiSpam } from '@/components/EmojiSpam';
import { useSentioStore, type GhostRider, type Hazard } from '@/store/useSentioStore';
import { useSocialStore } from '@/store/useSocialStore';
import { useSmartGlassesBLE } from '@/hooks/useSmartGlassesBLE';
import { usePamporovoSimulation } from '@/hooks/usePamporovoSimulation';
import { useTerminalBridge } from '@/hooks/useTerminalBridge';
import { useTheme } from '@/hooks/useTheme';
import { SPORTS, hazardFor, type IconName } from '@/constants/sports';
import { radius, space, hit, elevation, fun } from '@/constants/tokens';
import { distanceMeters, formatDistance, formatAgo } from '@/lib/format';
import { haptic } from '@/lib/haptics';

const DARK_STYLE = 'mapbox://styles/vasil-zhelev/cmn3epolr002q01ql4jwcfwdi';
const LIGHT_STYLE = 'mapbox://styles/mapbox/outdoors-v12'; // until a light custom style exists

export default function MapScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();

  const telemetry = useSentioStore((s) => s.telemetry);
  const session = useSentioStore((s) => s.session);
  const riders = useSentioStore((s) => s.ghostRiders);
  const hazards = useSentioStore((s) => s.hazards);
  const sport = useSentioStore((s) => s.sportProfile);
  const profile = useSentioStore((s) => s.profile);
  const bleConnected = useSentioStore((s) => s.bleConnected);
  const battery = useSentioStore((s) => s.glassesBattery);
  const triggerCrash = useSentioStore((s) => s.triggerCrash);
  const addHazard = useSentioStore((s) => s.addHazard);

  const { sendCommandToDisplay } = useSmartGlassesBLE();
  const addXp = useSocialStore((s) => s.addXp);
  const progressChallenge = useSocialStore((s) => s.progressChallenge);
  const progressBadge = useSocialStore((s) => s.progressBadge);
  const level = useSocialStore((s) => s.level);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedRider, setSelectedRider] = useState<GhostRider | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [toast, setToast] = useState<{ icon: IconName; text: string } | null>(null);
  const [spam, setSpam] = useState({ ts: 0, emoji: '' });
  const [talking, setTalking] = useState(false);

  usePamporovoSimulation(['g1', 'g2', 'g3', 'g4']);
  useTerminalBridge((emoji) => setSpam({ ts: Date.now(), emoji }));

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const liveRider = selectedRider ? riders.find((r) => r.id === selectedRider.id) ?? selectedRider : null;
  const dist = (lat: number, lng: number) => distanceMeters(telemetry.latitude, telemetry.longitude, lat, lng);

  const report = (kind: string) => {
    const h = hazardFor(sport, kind);
    addHazard({ id: `r_${Date.now()}`, kind, latitude: telemetry.latitude + 0.0004, longitude: telemetry.longitude, reportedBy: profile.name, reportedAt: Date.now() });
    haptic.success();
    setReportOpen(false);
    setToast({ icon: h.icon, text: `${h.label} reported — your crew will see it` });
    addXp(20, 'Hazard reported');
    progressChallenge('c-report', 1);
    progressBadge('scout', 0.1);
  };

  const react = (emoji: string, dir: string) => {
    haptic.success();
    setSpam({ ts: Date.now(), emoji });
    sendCommandToDisplay(JSON.stringify({ s: telemetry.speed, dir }));
    addXp(5, 'Hyped a friend');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Mapbox.MapView
        style={StyleSheet.absoluteFill}
        styleURL={isDark ? DARK_STYLE : LIGHT_STYLE}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        onPress={() => setSelectedRider(null)}
        onDidFinishLoadingStyle={() => setMapLoaded(true)}
      >
        <Mapbox.Camera zoomLevel={14.2} centerCoordinate={[telemetry.longitude, telemetry.latitude]} pitch={62} heading={200} animationDuration={0} />

        {/* Real 3D mountains */}
        <Mapbox.RasterDemSource id="sentio-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" tileSize={514} maxZoomLevel={14} />
        <Mapbox.Terrain sourceID="sentio-dem" style={{ exaggeration: 1.5 }} />
        <Mapbox.Atmosphere
          style={{
            color: isDark ? 'rgb(30, 40, 60)' : 'rgb(220, 235, 255)',
            highColor: isDark ? 'rgb(12, 18, 32)' : 'rgb(120, 170, 230)',
            horizonBlend: 0.08,
            spaceColor: isDark ? 'rgb(8, 10, 16)' : 'rgb(170, 205, 245)',
            starIntensity: isDark ? 0.3 : 0,
          }}
        />

        {hazards.map((h) => {
          const kind = hazardFor(sport, h.kind);
          return (
            <Mapbox.MarkerView key={h.id} id={h.id} coordinate={[h.longitude, h.latitude]}>
              <Pressable onPress={() => { haptic.select(); setSelectedHazard(h); }} accessibilityRole="button" accessibilityLabel={`${kind.label}, reported ${formatAgo(h.reportedAt)}`} hitSlop={8}>
                <View style={[styles.hazard, { backgroundColor: colors.warning, borderColor: isDark ? colors.bg : '#fff' }]}>
                  <Ionicons name={kind.icon} size={16} color="#1A1200" />
                </View>
              </Pressable>
            </Mapbox.MarkerView>
          );
        })}

        {riders.map((r) => {
          const selected = liveRider?.id === r.id;
          return (
            <Mapbox.MarkerView key={r.id} id={r.id} coordinate={[r.longitude, r.latitude]}>
              <Pressable onPress={() => { haptic.select(); setSelectedRider(r); }} accessibilityRole="button" accessibilityLabel={`${r.name}, ${r.speed} km/h`} style={{ alignItems: 'center' }} hitSlop={6}>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Pulse color={r.speed > 30 ? fun.flame : colors.accent} size={selected ? 48 : 40} />
                  <Avatar source={r.avatarUri} size={selected ? 48 : 40} ringColor={selected ? colors.accent : r.speed > 30 ? fun.flame : isDark ? colors.surfaceRaised : '#fff'} />
                  <View style={[styles.lvl, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                    <Text variant="caption" style={{ fontSize: 9, lineHeight: 12 }} tabular>
                      {r.level}
                    </Text>
                  </View>
                </View>
                <View style={[styles.riderTag, { backgroundColor: selected ? colors.accent : colors.surfaceRaised }]}>
                  <Text variant="caption" color={selected ? colors.onAccent : colors.text} tabular>
                    {selected ? `${r.name} · ${r.speed} km/h` : r.name}
                  </Text>
                </View>
              </Pressable>
            </Mapbox.MarkerView>
          );
        })}

        <Mapbox.MarkerView id="me" coordinate={[telemetry.longitude, telemetry.latitude]}>
          <View style={styles.meWrap} accessible accessibilityLabel="Your position">
            <View style={[styles.meHalo, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]} />
            <View style={[styles.meDot, { backgroundColor: colors.accent, borderColor: '#fff' }]} />
          </View>
        </Mapbox.MarkerView>
      </Mapbox.MapView>

      {!mapLoaded && <Animated.View exiting={FadeOut.duration(300)} style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />}

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { top: insets.top + space.sm }]} pointerEvents="box-none">
        <PressableScale onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel={`Your profile, level ${level}`} style={[styles.avatarBtn, elevation.float]}>
          <Avatar source={profile.avatar} size={44} ringColor={colors.accent} />
          <View style={[styles.meLvl, { backgroundColor: colors.accent, borderColor: isDark ? colors.bg : '#fff' }]}>
            <Text variant="caption" color={colors.onAccent} style={{ fontSize: 10, lineHeight: 13 }} tabular>
              {level}
            </Text>
          </View>
        </PressableScale>
        <View style={{ flex: 1 }} />
        <Chip
          glass
          dotColor={bleConnected ? colors.success : colors.textTertiary}
          icon={bleConnected ? undefined : 'glasses-outline'}
          label={bleConnected ? `Goggles ${battery}%` : 'Goggles offline'}
          onPress={() => router.navigate('/goggles')}
        />
        <Chip glass icon="snow-outline" label="−4° · 35 cm" />
      </View>

      {toast && (
        <Animated.View entering={FadeInDown.springify().damping(20)} exiting={FadeOut} style={[styles.toastWrap, { top: insets.top + 68 }]} accessibilityLiveRegion="polite">
          <Surface variant="raised" padding={space.md} radius={radius.pill} style={styles.toast}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text variant="label">{toast.text}</Text>
          </Surface>
        </Animated.View>
      )}

      {talking && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.toastWrap, { top: insets.top + 68 }]}>
          <Surface variant="raised" padding={space.md} radius={radius.pill} style={styles.toast}>
            <Ionicons name="mic" size={20} color={colors.accent} />
            <Text variant="label">Talking to your crew…</Text>
          </Surface>
        </Animated.View>
      )}

      {/* ── Bottom: speed + glove controls ── */}
      <View style={[styles.bottom, { bottom: bottomSpace - space.sm }]} pointerEvents="box-none">
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <ActionTile icon="warning-outline" label="Report" onPress={() => setReportOpen(true)} />
          <ActionTile
            icon="mic-outline"
            label={talking ? 'Release' : 'Hold to talk'}
            active={talking}
            onPressIn={() => { haptic.tap(); setTalking(true); }}
            onPressOut={() => setTalking(false)}
          />
          <SosTile onTrigger={triggerCrash} />
        </View>

        <Surface variant="glass" padding={space.lg} radius={radius.lg}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View accessible accessibilityLabel={`Speed ${Math.round(telemetry.speed)} kilometres per hour`}>
              <Text variant="label" tone="secondary">
                Speed
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text variant="display" tabular>
                  {Math.round(telemetry.speed)}
                </Text>
                <Text variant="bodyStrong" tone="secondary">
                  km/h
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4, paddingBottom: 6 }}>
              <MiniStat label="Max" value={`${Math.round(session.maxSpeed)} km/h`} />
              <MiniStat label="Alt" value={`${Math.round(telemetry.altitude)} m`} />
              <MiniStat label="G" value={telemetry.gForce.toFixed(1)} />
            </View>
          </View>
        </Surface>
      </View>

      <EmojiSpam triggerDate={spam.ts} currentEmoji={spam.emoji} />

      {/* ── Report sheet ── */}
      <Sheet visible={reportOpen} onClose={() => setReportOpen(false)} title="Report on this spot" subtitle="Your crew and nearby riders will see it on the map.">
        <View style={styles.reportGrid}>
          {SPORTS[sport].hazards.map((h) => (
            <PressableScale key={h.key} onPress={() => report(h.key)} accessibilityRole="button" accessibilityLabel={`Report ${h.label}`} style={[styles.reportTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.reportIcon, { backgroundColor: colors.warningSoft }]}>
                <Ionicons name={h.icon} size={26} color={colors.warning} />
              </View>
              <Text variant="label" align="center">
                {h.label}
              </Text>
            </PressableScale>
          ))}
        </View>
      </Sheet>

      {/* ── Rider sheet ── */}
      <Sheet visible={!!liveRider} onClose={() => setSelectedRider(null)}>
        {liveRider && (
          <View style={{ gap: space.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
              <Avatar source={liveRider.avatarUri} size={64} status="online" />
              <View style={{ flex: 1 }}>
                <Text variant="headline">{liveRider.name}</Text>
                <Text variant="callout" tone="secondary" tabular>
                  {formatDistance(dist(liveRider.latitude, liveRider.longitude))} away · Level {liveRider.level}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="title" tabular>
                  {liveRider.speed}
                </Text>
                <Text variant="caption" tone="secondary">
                  km/h
                </Text>
              </View>
            </View>
            <View>
              <Text variant="label" tone="secondary" style={{ marginBottom: space.sm }}>
                Send to {liveRider.name}’s goggles
              </Text>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                {[
                  { e: '❤️', d: 'heart', l: 'Love' },
                  { e: '⚡', d: 'boost', l: 'Send it' },
                  { e: '💀', d: 'skull', l: 'Careful' },
                ].map((r) => (
                  <PressableScale key={r.d} onPress={() => react(r.e, r.d)} accessibilityRole="button" accessibilityLabel={r.l} style={[styles.reaction, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={{ fontSize: 28, lineHeight: 34 }}>{r.e}</Text>
                    <Text variant="caption" tone="secondary">
                      {r.l}
                    </Text>
                  </PressableScale>
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button label="Ping" icon="notifications-outline" variant="secondary" style={{ flex: 1 }} onPress={() => { haptic.success(); setToast({ icon: 'notifications', text: `Pinged ${liveRider.name}` }); setSelectedRider(null); }} />
              <Button label="Follow" icon="navigate-outline" style={{ flex: 1 }} onPress={() => setSelectedRider(null)} />
            </View>
          </View>
        )}
      </Sheet>

      {/* ── Hazard sheet (Waze-style confirm) ── */}
      <HazardSheet hazard={selectedHazard} onClose={() => setSelectedHazard(null)} distance={selectedHazard ? dist(selectedHazard.latitude, selectedHazard.longitude) : 0} />
    </View>
  );
}

/** Soft "live" ping behind a rider. */
function Pulse({ color, size }: { color: string; size: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!reduced) t.value = withRepeat(withTiming(1, { duration: 1800 + Math.random() * 600, easing: Easing.out(Easing.quad) }), -1, false);
  }, [reduced, t]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: 1 + t.value * 0.9 }], opacity: 0.55 * (1 - t.value) }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, st]} />;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      <Text variant="caption" tone="tertiary">
        {label}
      </Text>
      <Text variant="caption" tabular style={{ minWidth: 56, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

function ActionTile({ icon, label, onPress, onPressIn, onPressOut, active }: { icon: IconName; label: string; onPress?: () => void; onPressIn?: () => void; onPressOut?: () => void; active?: boolean }) {
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress ? () => { haptic.tap(); onPress(); } : undefined} onPressIn={onPressIn} onPressOut={onPressOut} accessibilityRole="button" accessibilityLabel={label} style={{ flex: 1 }}>
      <Surface variant="glass" padding={0} radius={radius.lg} style={[styles.tile, active && { borderColor: colors.accent }]}>
        <View style={styles.tileInner}>
          <Ionicons name={icon} size={24} color={active ? colors.accent : colors.text} />
          <Text variant="label" color={active ? colors.accent : colors.text}>
            {label}
          </Text>
        </View>
      </Surface>
    </PressableScale>
  );
}

/** Manual SOS: press and hold for 2 s. A fill shows progress so it can't fire by accident. */
function SosTile({ onTrigger }: { onTrigger: () => void }) {
  const { colors } = useTheme();
  const p = useSharedValue(0);
  const [holding, setHolding] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
  };
  const fire = () => {
    stop();
    setHolding(false);
    p.value = 0;
    haptic.sos();
    onTrigger();
  };
  const fill = useAnimatedStyle(() => ({ height: `${p.value * 100}%` }));

  return (
    <Pressable
      onPressIn={() => {
        setHolding(true);
        haptic.warning();
        tick.current = setInterval(() => haptic.heavy(), 400);
        p.value = withTiming(1, { duration: 2000, easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (f) => {
          if (f) runOnJS(fire)();
        });
      }}
      onPressOut={() => {
        stop();
        setHolding(false);
        cancelAnimation(p);
        p.value = withTiming(0, { duration: 200 });
      }}
      accessibilityRole="button"
      accessibilityLabel="SOS"
      accessibilityHint="Press and hold for two seconds to start an emergency alert"
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={() => onTrigger()}
      style={{ flex: 1 }}
    >
      <View style={[styles.tile, styles.sosTile, { backgroundColor: colors.sos }, elevation.float]}>
        <Animated.View style={[styles.sosFill, fill]} />
        <View style={styles.tileInner}>
          <Ionicons name="shield-half" size={24} color="#fff" />
          <Text variant="label" color="#fff">
            {holding ? 'Keep holding' : 'Hold for SOS'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function HazardSheet({ hazard, onClose, distance }: { hazard: Hazard | null; onClose: () => void; distance: number }) {
  const { colors } = useTheme();
  const sport = useSentioStore((s) => s.sportProfile);
  const removeHazard = useSentioStore((s) => s.removeHazard);
  const kind = hazard ? hazardFor(sport, hazard.kind) : null;
  return (
    <Sheet visible={!!hazard} onClose={onClose}>
      {hazard && kind && (
        <View style={{ gap: space.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <View style={[styles.reportIcon, { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.warningSoft }]}>
              <Ionicons name={kind.icon} size={28} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="headline">{kind.label}</Text>
              <Text variant="callout" tone="secondary">
                {formatDistance(distance)} away · {hazard.reportedBy}, {formatAgo(hazard.reportedAt).toLowerCase()}
              </Text>
            </View>
          </View>
          <View>
            <Text variant="bodyStrong" style={{ marginBottom: space.md }}>
              Is it still there?
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button label="Gone" icon="close" variant="secondary" style={{ flex: 1 }} onPress={() => { haptic.success(); removeHazard(hazard.id); onClose(); }} />
              <Button label="Still there" icon="checkmark" style={{ flex: 1 }} onPress={() => { haptic.success(); onClose(); }} />
            </View>
          </View>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  topBar: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  avatarBtn: { borderRadius: 24 },
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg },
  bottom: { position: 'absolute', left: space.lg, right: space.lg, gap: space.sm },
  tile: { height: hit.glove + 8, borderRadius: radius.lg },
  tileInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  sosTile: { overflow: 'hidden' },
  sosFill: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' },
  hazard: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  lvl: { position: 'absolute', right: -6, top: -4, minWidth: 18, height: 16, paddingHorizontal: 3, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  meLvl: { position: 'absolute', right: -4, bottom: -4, minWidth: 20, height: 18, paddingHorizontal: 4, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  riderTag: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  meWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  meHalo: { position: 'absolute', width: 44, height: 44, borderRadius: 22, borderWidth: 1 },
  meDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 3 },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  reportTile: { width: '31.5%', aspectRatio: 1, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.sm },
  reportIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  reaction: { flex: 1, height: 76, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
});
