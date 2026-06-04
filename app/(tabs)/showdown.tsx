import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform,
  Dimensions
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import TacticalBlur from '../../components/TacticalBlur';
import { useSentioStore } from '../../store/useSentioStore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getThemePalette, FONTS, UI, TACTICAL_TAG } from '../../constants/Styles';

const { width, height } = Dimensions.get('window');
const MEDALS = ['🥇', '🥈', '🥉'];

export default function ShowdownScreen() {
  const { ghostRiders, telemetry, sportProfile, theme } = useSentioStore();
  const palette = useMemo(() => getThemePalette(sportProfile, theme), [sportProfile, theme]);

  const allRiders = useMemo(() => {
    const user = {
      id: 'user_1',
      name: 'YOU',
      speed: telemetry.speed,
      peakGForce: telemetry.gForce,
      crashes: 0,
      avatarUri: require('../../assets/images/avatar_user.png'),
      level: 45,
      achievements: ['✨', '💎', '🚀'],
    };
    return [...ghostRiders, user];
  }, [ghostRiders, telemetry]);

  const sortedBySpeed = [...allRiders].sort((a, b) => b.speed - a.speed);
  const sortedByGForce = [...allRiders].sort((a, b) => b.peakGForce - a.peakGForce);

  return (
    <View style={styles.root}>
      {/* ── IMMERSIVE MAP BACKGROUND ── */}
      <Mapbox.MapView
        style={StyleSheet.absoluteFillObject}
        styleURL={theme === 'DARK' ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Light}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Mapbox.Camera
          zoomLevel={11}
          centerCoordinate={[24.6946, 41.6504]} 
          pitch={45}
        />
      </Mapbox.MapView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SQUAD DASH</Text>
          <View style={[styles.badgeContainer, { backgroundColor: palette.accent + '20' }]}>
            <Text style={[styles.badgeText, { color: palette.accent }]}>COMPETITIVE // REGION: EU-CENTRAL</Text>
          </View>
        </View>

        {renderPodium('SPEED DEMONS', 'speedometer', '#FF3B30', sortedBySpeed, 'speed', 'KPH', palette)}
        {renderPodium('HEAVY G-FORCE', 'rocket', '#5E5CE6', sortedByGForce, 'peakGForce', 'G', palette)}

        <TouchableOpacity 
          style={[styles.shareBtn, UI.tacticalShadow]}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
          activeOpacity={0.8}
        >
          <TacticalBlur tint="dark" intensity={UI.glassBlur} style={styles.shareBlur}>
            <Text style={styles.shareText}>EXPORT RECAP</Text>
            <Ionicons name="share-social" size={20} color="#FFF" style={{ marginLeft: 10 }} />
          </TacticalBlur>
        </TouchableOpacity>
        
      </ScrollView>
    </View>
  );
}

function renderPodium(title: string, icon: any, color: string, data: any[], valueKey: any, unit: string, palette: any) {
  const top3 = data.slice(0, 3);

  // Gamification: reorder visually so 1st is center, 2nd is left, 3rd is right
  const visuallyOrdered = [top3[1], top3[0], top3[2]].filter(Boolean);
  const rankMap = new Map();
  top3.forEach((r, i) => rankMap.set(r.id, i));

  return (
    <TacticalBlur tint="dark" intensity={UI.glassBlur + 10} style={[styles.card, UI.tacticalShadow]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      
      <View style={styles.podiumContainer}>
        {visuallyOrdered.map((rider) => {
          const rank = rankMap.get(rider.id);
          const isFirst = rank === 0;
          
          let rankColor = color;
          if (rank === 0) rankColor = '#FFD700'; // Gold
          if (rank === 1) rankColor = '#C0C0C0'; // Silver
          if (rank === 2) rankColor = '#CD7F32'; // Bronze

          return (
            <View key={rider.id} style={[styles.podiumItem, isFirst && styles.firstPlaceItem]}>
              <View style={styles.avatarWrapper}>
                <Image 
                  source={typeof rider.avatarUri === 'string' ? { uri: rider.avatarUri } : rider.avatarUri} 
                  style={[
                    styles.avatar, 
                    { borderColor: rankColor, borderWidth: rank === 0 ? 3 : 2 },
                    isFirst && { width: 72, height: 72, borderRadius: 36, shadowColor: rankColor, shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width:0, height:0 } }
                  ]} 
                />
                
                {rider.level && (
                  <View style={[styles.levelBadge, isFirst && { backgroundColor: rankColor, borderColor: rankColor }]}>
                    <Text style={[styles.levelText, isFirst && { color: '#000' }]}>{rider.level}</Text>
                  </View>
                )}

                <View style={[styles.medal, isFirst && { bottom: -10, transform: [{scale: 1.2}], backgroundColor: rankColor }]}>
                  <Text style={styles.medalText}>{MEDALS[rank]}</Text>
                </View>
              </View>

              <Text style={[styles.name, isFirst && { fontSize: 13, fontWeight: '900', color: '#FFF' }]} numberOfLines={1}>
                {rider.name}
              </Text>
              
              {rider.achievements && rider.achievements.length > 0 && (
                <View style={styles.achievementsRow}>
                  {rider.achievements.map((ach: string, i: number) => (
                    <Text key={i} style={[styles.achievementText, isFirst && { fontSize: 14 }]}>{ach}</Text>
                  ))}
                </View>
              )}

              <Text style={[styles.value, { color: rankColor }]}>
                {Number(rider[valueKey]).toFixed(valueKey === 'peakGForce' ? 1 : 0)}
                <Text style={[styles.unit, { color: rankColor }]}>{unit}</Text>
              </Text>
            </View>
          );
        })}
      </View>
    </TacticalBlur>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  scroll: { padding: UI.pagePadding, paddingTop: 60, paddingBottom: 120 },

  header: { alignItems: 'center', marginBottom: 32 },
  headerTitle: { 
    color: '#FFF', 
    fontSize: 28, 
    fontWeight: '900', 
    letterSpacing: 2, 
    fontFamily: FONTS.sans,
    marginBottom: 8,
  },
  badgeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: FONTS.mono,
    letterSpacing: 1,
  },
  
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '800', 
    letterSpacing: 1, 
    fontFamily: FONTS.sans 
  },
  
  podiumContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
  },
  podiumItem: { alignItems: 'center', width: '31%', paddingBottom: 10 },
  firstPlaceItem: { width: '36%', paddingBottom: 0 },
  
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  levelBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 2,
  },
  levelText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    fontFamily: FONTS.technical,
  },
  medal: { 
    position: 'absolute', 
    bottom: -8, 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    width: 24, 
    height: 24, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 2,
  },
  medalText: { fontSize: 13 },
  
  name: { color: '#8E8E93', fontSize: 11, fontWeight: '800', marginTop: 4, textAlign: 'center', fontFamily: FONTS.sans },
  
  achievementsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  achievementText: {
    fontSize: 11,
    marginHorizontal: 1,
  },

  value: { color: '#FFF', fontSize: 16, fontWeight: '900', marginTop: 4, fontFamily: FONTS.technical },
  unit: { fontSize: 10, color: '#8E8E93' },
  
  shareBtn: {
    marginTop: 10,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  shareBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  shareText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 1, fontFamily: FONTS.sans },
});
