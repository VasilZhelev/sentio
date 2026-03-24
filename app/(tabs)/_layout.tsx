import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { useSentioStore } from '@/store/useSentioStore';
import { THEMES, SPORT_PROFILES } from '@/constants/Styles';

export default function TabLayout() {
  const { theme, sportProfile } = useSentioStore();
  const t = THEMES[theme];
  const accent = SPORT_PROFILES[sportProfile].accent;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: t.textSoft,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.5,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="map" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="speedometer" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="showdown"
        options={{
          title: 'Showdown',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="trophy" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="settings-sharp" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
