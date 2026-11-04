import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { TabBar } from '@/components/TabBar';
import { useSentioStore } from '@/store/useSentioStore';

export default function TabLayout() {
  const hasOnboarded = useSentioStore((s) => s.hasOnboarded);
  if (!hasOnboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, lazy: true }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="crew" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="goggles" />
    </Tabs>
  );
}
