import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { useSentioStore } from '@/store/useSentioStore';
import { getThemePalette, FONTS } from '@/constants/Styles';

export default function TabLayout() {
  const { theme, sportProfile } = useSentioStore();
  const palette = useMemo(() => getThemePalette(sportProfile, theme), [sportProfile, theme]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#1C1C1E', // Tactical deep slate
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          fontFamily: FONTS.sans,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        // PERFORMANCE FIXES:
        // Use lazy loading for tabs so we don't boot all 3 Mapboxes at once
        lazy: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'RADAR',
          tabBarIcon: ({ color }) => (
            <Ionicons size={22} name="map" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'DATA',
          tabBarIcon: ({ color }) => (
            <Ionicons size={22} name="stats-chart" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="showdown"
        options={{
          title: 'SQUAD',
          tabBarIcon: ({ color }) => (
            <Ionicons size={22} name="people" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="glasses"
        options={{
          title: 'GLASSES',
          tabBarIcon: ({ color }) => (
            <Ionicons size={22} name="glasses-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'SYSTEM',
          tabBarIcon: ({ color }) => (
            <Ionicons size={22} name="options" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

