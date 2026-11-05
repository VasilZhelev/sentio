import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeOut, FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing, useReducedMotion } from 'react-native-reanimated';
import Mapbox from '@rnmapbox/maps';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Glass, Avatar, Sheet, Button, PressableScale, useTabBarSpace } from '@/components/ui';
import { ProgressRing, Scrim } from '@/components/fun';
import { EmojiSpam } from '@/components/EmojiSpam';
import { useSentioStore, type GhostRider, type Hazard } from '@/store/useSentioStore';
import { useSocialStore } from '@/store/useSocialStore';
import { useSmartGlassesBLE } from '@/hooks/useSmartGlassesBLE';
import { usePamporovoSimulation } from '@/hooks/usePamporovoSimulation';
import { useTerminalBridge } from '@/hooks/useTerminalBridge';
import { useTheme } from '@/hooks/useTheme';
import { SPORTS, hazardFor, type IconName } from '@/constants/sports';
import { radius, space, fun, fontFamily } from '@/constants/tokens';
import { distanceMeters, formatDistance, formatAgo } from '@/lib/format';
import { haptic } from '@/lib/haptics';

const DARK_STYLE = 'mapbox://styles/vasil-zhelev/cmn3epolr002q01ql4jwcfwdi';
const LIGHT_STYLE = 'mapbox://styles/mapbox/outdoors-v12'; // until a light custom style exists
const SOS_HOLD_MS = 2000;
const HUD_SHADOW = { textShadowColor: 'rgba(0,0,0,0.45)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 12 };

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

  // Stable reference: a new array on each live telemetry update could reset the user's zoom
  const cameraCenter = useMemo(() => [telemetry.longitude, telemetry.latitude], [telemetry.longitude, telemetry.latitude]);
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
    setToast({ icon: h.icon, text: `${h.label} reported` });
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
        <Mapbox.Camera zoomLevel={14.2} centerCoordinate={cameraCenter} pitch={62} heading={200} animationDuration={0} />

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
                <View style={[styles.hazard, { backgroundColor: colors.warning }]}>
                  <Ionicons name={kind.icon} size={15} color="#1A1200" />
                </View>
              </Pressable>
            </Mapbox.MarkerView>
          );
        })}

        {riders.map((r) => {
          const selected = liveRider?.id === r.id;
          const hot = r.speed > 30;
          return (
            <Mapbox.MarkerView key={r.id} id={r.id} coordinate={[r.longitude, r.latitude]} allowOverlap allowOverlapWithPuck>
              <Pressable onPress={() => { haptic.select(); setSelectedRider(r); }} accessibilityRole="button" accessibilityLabel={`${r.name}, ${r.speed} km/h`} style={{ alignItems: 'center' }} hitSlop={6}>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Pulse color={hot ? fun.flame : colors.accent} size={selected ? 50 : 42} />
                  <Avatar source={r.avatarUri} size={selected ? 50 : 42} ringColor={selected ? colors.accent : hot ? fun.flame : '#fff'} />
                </View>
                <View style={[styles.riderTag, { backgroundColor: selected ? colors.accent : 'rgba(10,12,15,0.78)' }]}>
                  <Text variant="caption" color={selected ? colors.onAccent : '#fff'} tabular style={{ fontFamily: fontFamily.displaySemi, fontSize: 12 }}>
                    {r.name} · {r.speed}
                  </Text>
                </View>
              </Pressable>
            </Mapbox.MarkerView>
          );
        })}

        <Mapbox.MarkerView id="me" coordinate={[telemetry.longitude, telemetry.latitude]} allowOverlap allowOverlapWithPuck>
          <View style={styles.meWrap} accessible accessibilityLabel="Your position">
            <View style={[styles.meHalo, { backgroundColor: colors.accent }]} />
            <View style={[styles.meDot, { backgroundColor: colors.accent }]} />
          </View>
        </Mapbox.MarkerView>
      </Mapbox.MapView>

      {!mapLoaded && <Animated.View exiting={FadeOut.duration(300)} style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />}

      {/* legibility veils: top for the HUD, bottom for the controls */}
      <Scrim position="top" height={insets.top + 190} to={isDark ? 0.75 : 0.45} />
      <Scrim position="bottom" height={bottomSpace + 130} to={isDark ? 0.6 : 0.25} />

      {/* ── HUD: speed straight on the map, like a helmet display ── */}
      <View style={[styles.hud, { top: insets.top + space.sm }]} pointerEvents="none" accessible accessibilityLabel={`Speed ${Math.round(telemetry.speed)} kilometres per hour`}>
        <Text variant="overline" color="rgba(255,255,255,0.75)" style={HUD_SHADOW}>
          {SPORTS[sport].short} · live
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
          <Text variant="hero" color="#fff" tabular style={[{ fontSize: 112, lineHeight: 108 }, HUD_SHADOW]}>
            {Math.round(telemetry.speed)}
          </Text>
          <Text variant="headline" color="rgba(255,255,255,0.85)" style={[{ marginBottom: 14 }, HUD_SHADOW]}>
            km/h
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: space.lg }}>
          <HudStat label="Max" value={`${Math.round(session.maxSpeed)}`} />
          <HudStat label="Alt" value={`${Math.round(telemetry.altitude)} m`} />
          <HudStat label="G" value={bleConnected ? telemetry.gForce.toFixed(1) : '--'} />
        </View>
      </View>

      {/* ── Top-right: you + a vertical glass control stack (Apple Maps style) ── */}
      <View style={[styles.rail, { top: insets.top + space.sm }]} pointerEvents="box-none">
        <PressableScale onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel={`Your profile, level ${level}`}>
          <Avatar source={profile.avatar} size={48} ringColor="#fff" />
          <View style={[styles.meLvl, { backgroundColor: colors.accent }]}>
            <Text variant="caption" color={colors.onAccent} style={{ fontSize: 10, lineHeight: 13, fontFamily: fontFamily.display }} tabular>
              {level}
            </Text>
          </View>
        </PressableScale>
        <Glass radius={24} style={{ width: 48, marginTop: space.md }}>
          <RailButton
            icon="glasses"
            label={bleConnected ? `Goggles connected, ${battery} percent` : 'Goggles offline'}
            dot={bleConnected ? colors.success : colors.textTertiary}
            onPress={() => router.navigate('/goggles')}
          />
          <View style={[styles.railDivider, { backgroundColor: colors.borderStrong }]} />
          <RailButton icon="snow" label="Weather, minus 4 degrees, 35 centimetres fresh snow" caption="−4°" />
          <View style={[styles.railDivider, { backgroundColor: colors.borderStrong }]} />
          <RailButton icon="navigate" label="Recenter on me" color={colors.accent} />
        </Glass>
      </View>

      {toast && (
        <Animated.View entering={FadeInDown.springify().damping(20)} exiting={FadeOut} style={[styles.toastWrap, { top: insets.top + 196 }]} accessibilityLiveRegion="polite">
          <Glass>
            <View style={styles.toast}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text variant="label">{toast.text}</Text>
            </View>
          </Glass>
        </Animated.View>
      )}

      {/* ── Controls, each shaped by what it does ── */}
      <View style={[styles.controls, { bottom: bottomSpace - space.xs }]} pointerEvents="box-none">
        {/* Report: a tool → glass circle */}
        <PressableScale onPress={() => { haptic.tap(); setReportOpen(true); }} accessibilityRole="button" accessibilityLabel="Report a hazard">
          <Glass style={styles.circle}>
            <Ionicons name="warning" size={26} color={colors.warning} />
          </Glass>
        </PressableScale>

        {/* Talk: the thing you do most while riding → big hold-to-talk capsule */}
        <TalkCapsule talking={talking} onStart={() => { haptic.tap(); setTalking(true); }} onEnd={() => setTalking(false)} />

        {/* SOS: never ambiguous → solid red, hold with a progress ring */}
        <SosButton onTrigger={triggerCrash} />
      </View>

      <EmojiSpam triggerDate={spam.ts} currentEmoji={spam.emoji} />

      {/* ── Report sheet ── */}
      <Sheet visible={reportOpen} onClose={() => setReportOpen(false)} title="What’s up ahead?" subtitle="Your crew and nearby riders see it on the map.">
        <View style={styles.reportGrid}>
          {SPORTS[sport].hazards.map((h) => (
            <PressableScale key={h.key} onPress={() => report(h.key)} accessibilityRole="button" accessibilityLabel={`Report ${h.label}`} style={styles.reportItem}>
              <View style={[styles.reportIcon, { backgroundColor: colors.warningSoft }]}>
                <Ionicons name={h.icon} size={28} color={colors.warning} />
              </View>
              <Text variant="label" align="center" numberOfLines={2}>
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
                <Text variant="title" style={{ fontSize: 28, lineHeight: 32 }}>
                  {liveRider.name}
                </Text>
                <Text variant="callout" tone="secondary" tabular>
                  {formatDistance(dist(liveRider.latitude, liveRider.longitude))} away · Level {liveRider.level}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="display" tabular style={{ fontSize: 48, lineHeight: 48 }}>
                  {liveRider.speed}
                </Text>
                <Text variant="caption" tone="secondary">
                  km/h
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {[
                { e: '❤️', d: 'heart', l: 'Love' },
                { e: '⚡', d: 'boost', l: 'Send it' },
                { e: '🤘', d: 'rock', l: 'Respect' },
                { e: '💀', d: 'skull', l: 'Careful' },
              ].map((r) => (
                <PressableScale key={r.d} onPress={() => react(r.e, r.d)} accessibilityRole="button" accessibilityLabel={r.l} style={{ alignItems: 'center', gap: 6 }}>
                  <View style={[styles.reaction, { backgroundColor: colors.surfaceSunken }]}>
                    <Text style={{ fontSize: 30, lineHeight: 36 }}>{r.e}</Text>
                  </View>
                  <Text variant="caption" tone="secondary">
                    {r.l}
                  </Text>
                </PressableScale>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button label="Ping" icon="notifications" variant="secondary" style={{ flex: 1 }} onPress={() => { haptic.success(); setToast({ icon: 'notifications', text: `Pinged ${liveRider.name}` }); setSelectedRider(null); }} />
              <Button label="Ride with" icon="navigate" style={{ flex: 1 }} onPress={() => setSelectedRider(null)} />
            </View>
          </View>
        )}
      </Sheet>

      <HazardSheet hazard={selectedHazard} onClose={() => setSelectedHazard(null)} distance={selectedHazard ? dist(selectedHazard.latitude, selectedHazard.longitude) : 0} />
    </View>
  );
}

function HudStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
      <Text variant="overline" color="rgba(255,255,255,0.6)" style={HUD_SHADOW}>
        {label}
      </Text>
      <Text variant="headline" color="#fff" tabular style={[{ fontFamily: fontFamily.numeric, fontSize: 22 }, HUD_SHADOW]}>
        {value}
      </Text>
    </View>
  );
}

function RailButton({ icon, label, caption, dot, color, onPress }: { icon: IconName; label: string; caption?: string; dot?: string; color?: string; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress ? () => { haptic.tap(); onPress(); } : undefined} accessibilityRole="button" accessibilityLabel={label} style={styles.railBtn}>
      <View>
        <Ionicons name={icon} size={caption ? 17 : 20} color={color ?? colors.text} />
        {dot && <View style={[styles.railDot, { backgroundColor: dot }]} />}
      </View>
      {caption && (
        <Text variant="caption" tabular style={{ fontFamily: fontFamily.displaySemi, fontSize: 11, lineHeight: 13 }}>
          {caption}
        </Text>
      )}
    </Pressable>
  );
}

/** Hold-to-talk. Expands into a live waveform while held. */
function TalkCapsule({ talking, onStart, onEnd }: { talking: boolean; onStart: () => void; onEnd: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPressIn={onStart} onPressOut={onEnd} accessibilityRole="button" accessibilityLabel="Hold to talk to your crew" style={{ flex: 1 }}>
      <Glass tint={talking ? colors.accent : undefined} lens={talking} style={styles.talk}>
        <View style={styles.talkInner}>
          {talking ? (
            <>
              <Waveform />
              <Text variant="headline" color={colors.onAccent} style={{ fontSize: 17 }}>
                Talking…
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="mic" size={22} color={colors.text} />
              <View>
                <Text variant="headline" style={{ fontSize: 17, lineHeight: 20 }}>
                  Hold to talk
                </Text>
                <Text variant="caption" tone="secondary" style={{ fontSize: 11, lineHeight: 13 }}>
                  Crew channel · 4 online
                </Text>
              </View>
            </>
          )}
        </View>
      </Glass>
    </Pressable>
  );
}

function Waveform() {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 24 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <WaveBar key={i} delay={i * 110} color={colors.onAccent} />
      ))}
    </View>
  );
}

function WaveBar({ delay, color }: { delay: number; color: string }) {
  const t = useSharedValue(0.3);
  useEffect(() => {
    const id = setTimeout(() => {
      t.value = withRepeat(withTiming(1, { duration: 380, easing: Easing.inOut(Easing.quad) }), -1, true);
    }, delay);
    return () => clearTimeout(id);
  }, [delay, t]);
  const st = useAnimatedStyle(() => ({ height: 6 + t.value * 18 }));
  return <Animated.View style={[{ width: 4, borderRadius: 2, backgroundColor: color }, st]} />;
}

/**
 * Manual SOS. Solid red circle; press and hold 2 s while a ring fills.
 * Timed with a JS timer, so it can't fire early even if the OS reduces motion.
 */
function SosButton({ onTrigger }: { onTrigger: () => void }) {
  const { colors } = useTheme();
  const [progress, setProgress] = useState(0);
  const start = useRef(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const buzz = useRef(0);

  const stop = () => {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
    setProgress(0);
  };

  useEffect(() => stop, []);

  return (
    <Pressable
      onPressIn={() => {
        start.current = Date.now();
        buzz.current = 0;
        haptic.warning();
        tick.current = setInterval(() => {
          const p = Math.min(1, (Date.now() - start.current) / SOS_HOLD_MS);
          setProgress(p);
          if (Math.floor(p * 5) > buzz.current) {
            buzz.current = Math.floor(p * 5);
            haptic.heavy();
          }
          if (p >= 1) {
            stop();
            haptic.sos();
            onTrigger();
          }
        }, 32);
      }}
      onPressOut={stop}
      accessibilityRole="button"
      accessibilityLabel="SOS"
      accessibilityHint="Press and hold for two seconds to start an emergency alert"
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={() => onTrigger()}
      style={styles.sosShadow}
    >
      <ProgressRing size={68} stroke={4} progress={progress} color="#fff" track={colors.sos} hole={colors.sos}>
        <Text variant="headline" color="#fff" style={{ fontFamily: fontFamily.display, fontSize: 17, letterSpacing: 1 }}>
          {progress > 0 ? `${Math.ceil((1 - progress) * 2)}` : 'SOS'}
        </Text>
      </ProgressRing>
    </Pressable>
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
            <View style={[styles.reportIcon, { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.warningSoft }]}>
              <Ionicons name={kind.icon} size={28} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="title" style={{ fontSize: 26, lineHeight: 30 }}>
                {kind.label}
              </Text>
              <Text variant="callout" tone="secondary">
                {formatDistance(distance)} away · {hazard.reportedBy}, {formatAgo(hazard.reportedAt).toLowerCase()}
              </Text>
            </View>
          </View>
          <View>
            <Text variant="bodyStrong" style={{ marginBottom: space.md }}>
              Still there?
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button label="It’s gone" icon="close" variant="secondary" style={{ flex: 1 }} onPress={() => { haptic.success(); removeHazard(hazard.id); onClose(); }} />
              <Button label="Still there" icon="checkmark" style={{ flex: 1 }} onPress={() => { haptic.success(); onClose(); }} />
            </View>
          </View>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  hud: { position: 'absolute', left: space.xl },
  rail: { position: 'absolute', right: space.lg, alignItems: 'center' },
  railBtn: { height: 52, alignItems: 'center', justifyContent: 'center', gap: 1 },
  railDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 10 },
  railDot: { position: 'absolute', right: -4, top: -2, width: 8, height: 8, borderRadius: 4 },
  meLvl: { position: 'absolute', right: -4, bottom: -4, minWidth: 20, height: 18, paddingHorizontal: 4, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, height: 44 },
  controls: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md },
  circle: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  talk: { height: 64 },
  talkInner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.md },
  sosShadow: { borderRadius: 34, shadowColor: '#FF3B3B', shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
  hazard: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  riderTag: { marginTop: 5, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  meWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  meHalo: { position: 'absolute', width: 44, height: 44, borderRadius: 22, opacity: 0.22 },
  meDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: '#fff' },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.xl },
  reportItem: { width: '33.33%', alignItems: 'center', gap: space.sm, paddingHorizontal: 4 },
  reportIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  reaction: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
});
