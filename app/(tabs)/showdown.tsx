import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useSentioStore } from '../../store/useSentioStore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { THEMES } from '../../constants/Styles';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function ShowdownScreen() {
  const { ghostRiders, telemetry, sportProfile, theme } = useSentioStore();
  const t = THEMES[theme];

  const allRiders = useMemo(() => {
    const user = {
      id: 'user_1',
      name: 'You',
      speed: telemetry.speed,
      peakGForce: telemetry.gForce,
      crashes: 0,
      avatarUri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=120&h=120&fit=crop',
      sport: sportProfile
    };
    const mappedRiders = ghostRiders.map(r => ({ ...r, sport: sportProfile }));
    return [...mappedRiders, user];
  }, [ghostRiders, telemetry, sportProfile]);

  const sortedBySpeed = [...allRiders].sort((a, b) => b.speed - a.speed);
  const sortedByGForce = [...allRiders].sort((a, b) => b.peakGForce - a.peakGForce);
  const sortedByCrashes = [...allRiders].sort((a, b) => b.crashes - a.crashes);

  const renderPodium = (
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    color: string,
    data: any[],
    valueKey: 'speed' | 'peakGForce' | 'crashes',
    unit: string,
    isWreck: boolean = false
  ) => {
    const top3 = data.slice(0, 3);
    const rest = data.slice(3, 5);

    return (
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name={icon} size={20} color={color} style={{ marginRight: 6 }} />
          <Text style={[styles.cardTitle, { color: t.text }]}>{title}</Text>
        </View>
        
        {/* Top 3 Podium (Horizontal) */}
        <View style={styles.podiumContainer}>
          {top3.map((rider, index) => (
            <View key={rider.id} style={styles.podiumItem}>
              <View>
                <Image source={{ uri: rider.avatarUri }} style={[styles.podiumAvatar, index === 0 && { borderColor: color, borderWidth: 2 }]} />
                <View style={styles.medalBadge}><Text style={styles.medalText}>{MEDALS[index]}</Text></View>
              </View>
              <Text style={[styles.podiumName, { color: t.text }]} numberOfLines={1}>{rider.name}</Text>
              <Text style={[styles.podiumValue, index === 0 && { color, fontSize: 16 }]}>
                {Number(rider[valueKey]).toFixed(valueKey === 'peakGForce' ? 1 : 0)}
                <Text style={styles.podiumUnit}>{unit}</Text>
                {index === 0 && isWreck && <Text style={{fontSize:10}}>💀</Text>}
              </Text>
            </View>
          ))}
        </View>

        {/* The Rest (Tiny List) */}
        {rest.length > 0 && (
          <View style={styles.restContainer}>
            {rest.map((rider, index) => (
              <View key={rider.id} style={styles.restRow}>
                <Text style={[styles.restRank, { color: t.textSoft }]}>#{index + 4}</Text>
                <Image source={{ uri: rider.avatarUri }} style={styles.restAvatar} />
                <Text style={[styles.restName, { color: t.textSoft }]} numberOfLines={1}>{rider.name}</Text>
                <Text style={[styles.restValue, { color: t.text }]}>
                  {Number(rider[valueKey]).toFixed(valueKey === 'peakGForce' ? 1 : 0)} <Text style={{fontSize: 10}}>{unit}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} indicatorStyle={theme === 'DARK' ? 'white' : 'black'}>
        
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: t.text }]}>STAT SHOWDOWN</Text>
        </View>

        {renderPodium('Speed Demon', 'speedometer', theme === 'DARK' ? '#39FF14' : '#16A34A', sortedBySpeed, 'speed', 'kph')}
        {renderPodium("Heavy G's", 'rocket', theme === 'DARK' ? '#00F0FF' : '#0284C7', sortedByGForce, 'peakGForce', 'G')}
        {renderPodium('Wrecking Ball', 'warning', theme === 'DARK' ? '#FF073A' : '#DC2626', sortedByCrashes, 'crashes', 'bails', true)}

        <TouchableOpacity 
          style={[styles.shareBtn, { backgroundColor: t.text }]}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
        >
          <Text style={[styles.shareText, { color: t.background }]}>SHARE RESULTS</Text>
          <Ionicons name="share-social-outline" size={20} color={t.background} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 30 },
  header: {
    marginTop: Platform.OS === 'ios' ? 0 : 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1.5, fontStyle: 'italic' },
  
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  
  podiumContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  podiumItem: { alignItems: 'center', width: '31%' },
  podiumAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E5E7EB' },
  medalBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#FFF', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', shadowColor:'#000', shadowOpacity: 0.2, shadowRadius:3, elevation:2 },
  medalText: { fontSize: 10 },
  podiumName: { fontSize: 12, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  podiumValue: { fontSize: 14, fontWeight: '900', marginTop: 2, fontVariant: ['tabular-nums'] },
  podiumUnit: { fontSize: 10, fontWeight: '600' },
  
  restContainer: { borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.2)', paddingTop: 12, gap: 6 },
  restRow: { flexDirection: 'row', alignItems: 'center' },
  restRank: { fontSize: 11, fontWeight: '800', width: 24 },
  restAvatar: { width: 20, height: 20, borderRadius: 10, marginRight: 8 },
  restName: { flex: 1, fontSize: 12, fontWeight: '600' },
  restValue: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 100, marginTop: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  shareText: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});
