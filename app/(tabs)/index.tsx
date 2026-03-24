import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSentioStore } from '../../store/useSentioStore';
import { THEMES, SPORT_PROFILES, HAZARD_ICONS, UI } from '../../constants/Styles';
import { useBLEBridge } from '../../hooks/useBLEBridge';
import SOSOverlay from '../../components/SOSOverlay';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Mapbox Token
Mapbox.setAccessToken('pk.eyJ1IjoidmFzaWwtemhlbGV2IiwiYSI6ImNtbXZ5NnFjYTJkOWUyeXIwbmRjd2RkcTAifQ.c0735l2Vej_xd10i6Ol0SQ');

// ── Floating Emoji Animation Component ──
const FloatingEmoji = ({ emoji, startX, startY, onComplete }: any) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -250, duration: 2500, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 2500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.5, friction: 5, useNativeDriver: true })
    ]).start(onComplete);
  }, []);

  return (
    <Animated.Text style={{
      position: 'absolute',
      left: startX,
      top: startY,
      opacity,
      transform: [{ scale }, { translateY }],
      fontSize: 56,
      zIndex: 9999,
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 6 },
      textShadowRadius: 10
    }}>
      {emoji}
    </Animated.Text>
  );
};

export default function SentioMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useSentioStore();
  const { theme, sportProfile, ghostRiders, hazards, addHazard, telemetry, bleConnected, isEmergency } = store;
  const p = SPORT_PROFILES[sportProfile];
  const t = THEMES[theme];
  
  const cameraRef = useRef<Mapbox.Camera>(null);
  const { sendPayload } = useBLEBridge();
  
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [activeEmojis, setActiveEmojis] = useState<any[]>([]);
  const [pendingHazardLocation, setPendingHazardLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const centerOnUser = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (telemetry.latitude && telemetry.longitude) {
      cameraRef.current?.setCamera({
        centerCoordinate: [telemetry.longitude, telemetry.latitude],
        zoomLevel: 15,
        animationDuration: 1000,
        pitch: 75,
      });
    }
  };

  // ── Emoji Engine ──
  const fireEmoji = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { width, height } = Dimensions.get('window');
    const startX = (width / 2) + (Math.random() * 80 - 40) - 28;
    const startY = height / 2 + 60;
    const id = Date.now().toString() + Math.random();

    setActiveEmojis(prev => [...prev, { id, emoji, startX, startY }]);
    sendPayload(`EMOJI:${emoji}`);
  };

  const handleMapPress = () => {
    if (selectedRiderId) setSelectedRiderId(null);
    if (pendingHazardLocation) setPendingHazardLocation(null);
  };

  const handleMapLongPress = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPendingHazardLocation({ 
      lng: e.geometry.coordinates[0], 
      lat: e.geometry.coordinates[1] 
    });
  };

  const selectedRider = ghostRiders.find(r => r.id === selectedRiderId);

  // Map hazardous circles as GeoJSON
  const hazardFeatures = hazards.map(h => ({
    type: 'Feature',
    id: h.id,
    properties: {},
    geometry: { type: 'Point', coordinates: [h.longitude, h.latitude] }
  }));

  const hazardCollection: GeoJSON.FeatureCollection = { 
    type: 'FeatureCollection', 
    features: hazardFeatures as any 
  };

  return (
    <View style={styles.root}>
      {/* ── Background Map ── */}
      <Mapbox.MapView
        style={StyleSheet.absoluteFillObject}
        styleURL="mapbox://styles/vasil-zhelev/cmn3epolr002q01ql4jwcfwdi"
        logoEnabled={false}
        attributionEnabled={false}
        onPress={handleMapPress}
        onLongPress={handleMapLongPress}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={[24.6769, 41.6378]}
          pitch={75}
          heading={0}
          animationMode="flyTo"
          animationDuration={2000}
        />
        
        {hasPermission && (
          <Mapbox.UserLocation 
             visible={true}
             showsUserHeadingIndicator={true}
             androidRenderMode="compass"
          />
        )}

        {/* Hazard Red Zones */}
        {hazards.length > 0 && (
          <Mapbox.ShapeSource id="hazard-circles" shape={hazardCollection}>
            <Mapbox.CircleLayer 
              id="hazard-circles-layer" 
              style={{ 
                circleColor: '#EF4444', 
                // 25m radius calculated via zoom interpolation at Lat 41.6
                circleRadius: [
                  'interpolate', ['exponential', 2], ['zoom'],
                  13, 17.5,
                  14, 35,
                  15, 70,
                  16, 140,
                  17, 280,
                  18, 560,
                  19, 1120,
                  20, 2240
                ],
                circlePitchAlignment: 'map',
                circleOpacity: 0.15, 
                circleStrokeWidth: 2, 
                circleStrokeColor: '#EF4444' 
              }} 
            />
          </Mapbox.ShapeSource>
        )}

        {/* Hazard View Markers */}
        {hazards.map((h) => (
          <Mapbox.MarkerView key={h.id} coordinate={[h.longitude, h.latitude]} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.hazardPin}>
              <Text>{HAZARD_ICONS[h.type] || '⚠️'}</Text>
            </View>
          </Mapbox.MarkerView>
        ))}

        {/* Ghost Riders */}
        {ghostRiders.map((r) => {
          const isMoto = sportProfile === 'MOTOCROSS';
          const hex = isMoto ? '#F97316' : '#22D3EE';
          const badgeIcon = isMoto ? '🏍️' : '🎿';
          return (
            <Mapbox.MarkerView key={r.id} coordinate={[r.longitude, r.latitude]} anchor={{ x: 0.5, y: 0.5 }}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => { 
                Haptics.selectionAsync(); 
                setSelectedRiderId(r.id); 
                setPendingHazardLocation(null); 
              }}>
                <View style={styles.bumpAvatarWrap}>
                   <View style={styles.bumpAvatarSpeed}>
                     <Text style={[styles.speedText, { color: hex }]}>{r.speed}</Text>
                   </View>
                   <Image source={{ uri: r.avatarUri }} style={styles.bumpAvatarImg} />
                   <View style={[styles.bumpAvatarBadge, { backgroundColor: hex }]}>
                     <Text style={{ fontSize: 10 }}>{badgeIcon}</Text>
                   </View>
                </View>
              </TouchableOpacity>
            </Mapbox.MarkerView>
          );
        })}

        {/* Pending Hazard Drop Pin Preview */}
        {pendingHazardLocation && !selectedRider && (
          <Mapbox.MarkerView coordinate={[pendingHazardLocation.lng, pendingHazardLocation.lat]} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.hazardPin, { borderColor: '#3B82F6', shadowColor: '#3B82F6' }]}>
              <Text>📍</Text>
            </View>
          </Mapbox.MarkerView>
        )}

      </Mapbox.MapView>

      {/* ── Floating Emoji Layer ── */}
      {activeEmojis.map((e) => (
        <FloatingEmoji
          key={e.id}
          emoji={e.emoji}
          startX={e.startX}
          startY={e.startY}
          onComplete={() => setActiveEmojis(prev => prev.filter(item => item.id !== e.id))}
        />
      ))}

      {/* ── Top Floating Metrics ── */}
      <View pointerEvents="none" style={[styles.topBar, { top: insets.top + 10 }]}>
        <View style={styles.topPill}>
          <Text style={styles.pillEmoji}>{p.icon}</Text>
          <Text style={styles.pillText}>{p.label}</Text>
        </View>
        <View style={styles.topPill}>
          <View style={[styles.bleDot, { backgroundColor: bleConnected ? '#34D399' : '#EF4444' }]} />
          <Text style={styles.pillText}>{bleConnected ? 'HUD' : '...'}</Text>
        </View>
      </View>

      {/* ── Emoji Selection Overlay ── */}
      {selectedRider && (
        <View style={[styles.socialOverlay, { bottom: insets.bottom + 110 }]}>
          <Text style={styles.socialTitle}>{selectedRider.name}</Text>
          <Text style={styles.socialSubtitle}>{selectedRider.speed} km/h • {sportProfile}</Text>
          
          <View style={styles.emojiRow}>
            {['🔥', '🤙', '🚀', '💀'].map(emoji => (
              <TouchableOpacity key={emoji} style={styles.emojiBtn} onPress={() => fireEmoji(emoji)}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Hazard Reporting Overlay ── */}
      {pendingHazardLocation && !selectedRider && (
        <View style={[styles.hazardOverlay, { bottom: insets.bottom + 110 }]}>
          <Text style={styles.hazardOverlayTitle}>Report Hazard</Text>
          <Text style={styles.hazardOverlaySubtitle}>Confirm location to alert the squad.</Text>
          
          <View style={styles.hazardButtonGrid}>
            {p.hazardTypes.map(type => (
              <TouchableOpacity
                key={type}
                style={styles.hazardTypePill}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  addHazard({
                    id: Date.now().toString(),
                    type,
                    latitude: pendingHazardLocation.lat,
                    longitude: pendingHazardLocation.lng,
                    reportedBy: 'You',
                    reportedAgo: 'Just now',
                  });
                  setPendingHazardLocation(null);
                }}
              >
                <Text style={styles.hazardTypeEmoji}>{HAZARD_ICONS[type] || '⚠️'}</Text>
                <Text style={styles.hazardTypeText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelHazardBtn} onPress={() => setPendingHazardLocation(null)}>
            <Text style={styles.cancelHazardText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Target Button ── */}
      {!selectedRider && !pendingHazardLocation && (
        <TouchableOpacity 
          style={[styles.targetBtn, { bottom: insets.bottom + 110 }]} 
          onPress={centerOnUser}
          activeOpacity={0.8}
        >
          <Ionicons name="locate" size={20} color="#3B82F6" />
        </TouchableOpacity>
      )}

      {/* ── Main Bottom Controls ── */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity 
          style={styles.actionCircle} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setPendingHazardLocation({ lat: telemetry.latitude, lng: telemetry.longitude });
          }} 
          activeOpacity={0.8}
        >
          <Text style={styles.actionEmoji}>⚠️</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.centerPill}
          onPress={() => router.push('/map')} /* This goes to dashboard in old terminology */
          activeOpacity={0.9}
        >
          <Text style={[styles.speedBig, { color: p.accent }]}>
            {telemetry.speed}
            <Text style={styles.speedUnit}> km/h</Text>
          </Text>
          <Text style={styles.gForceText}>{telemetry.gForce.toFixed(1)} G</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCircle} 
          onPress={() => router.push('/explore')}
          activeOpacity={0.8}
        >
          <Ionicons name="settings-sharp" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {isEmergency && <SOSOverlay />}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // Top Bar
  topBar: {
    position: 'absolute',
    left: 16, right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  pillEmoji: { fontSize: 14, marginRight: 6 },
  pillText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  bleDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },

  // Bump Avatars
  bumpAvatarWrap: { position: 'relative', width: 56, height: 56 },
  bumpAvatarImg: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: '#FFF',
    backgroundColor: '#cbd5e1',
  },
  bumpAvatarBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 22, height: 22,
    borderRadius: 11, borderWidth: 2, borderColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  bumpAvatarSpeed: {
    position: 'absolute', top: -10, left: '50%', transform: [{ translateX: -14 }],
    backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 8, zIndex: 10,
  },
  speedText: { fontFamily: UI.fontMono, fontWeight: '800', fontSize: 11 },

  // Hazard Pin
  hazardPin: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.5)',
  },

  // Social Overlay
  socialOverlay: {
    position: 'absolute', left: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 24, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  socialTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  socialSubtitle: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 16 },
  emojiRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  emojiBtn: { 
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', alignItems: 'center' 
  },
  emojiText: { fontSize: 28 },

  // Hazard Overlay
  hazardOverlay: {
    position: 'absolute', left: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  hazardOverlayTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 4, textAlign: 'center' },
  hazardOverlaySubtitle: { fontSize: 13, fontWeight: '500', color: '#9CA3AF', marginBottom: 20, textAlign: 'center' },
  hazardButtonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 20 },
  hazardTypePill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', 
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20,
  },
  hazardTypeEmoji: { fontSize: 16, marginRight: 8 },
  hazardTypeText: { fontSize: 14, fontWeight: '700', color: '#F3F4F6' },
  cancelHazardBtn: { 
    paddingVertical: 12, borderRadius: 20, backgroundColor: 'rgba(239, 68, 68, 0.2)', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.5)'
  },
  cancelHazardText: { fontSize: 15, fontWeight: '800', color: '#FCA5A5' },

  // Target Button
  targetBtn: {
    position: 'absolute', right: 24, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },

  // Bottom Controls
  bottomControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row',
    justifyContent: 'space-evenly', alignItems: 'flex-end', paddingHorizontal: 16,
    zIndex: 10,
  },
  actionCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  actionEmoji: { fontSize: 24 },
  
  centerPill: {
    height: 72, backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 36, paddingHorizontal: 28,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  speedBig: { fontSize: 32, fontWeight: '900', fontFamily: UI.fontMono },
  speedUnit: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
  gForceText: { fontSize: 12, fontWeight: '800', color: '#9CA3AF', marginTop: -2 },
});