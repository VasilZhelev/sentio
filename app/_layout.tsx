import { useEffect, useMemo } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider, type Theme as NavTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import 'react-native-reanimated';
import Mapbox from '@rnmapbox/maps';
import SOSOverlay from '@/components/SOSOverlay';
import GlassesNotification from '@/components/GlassesNotification';
import { useSmartGlassesBLE } from '@/hooks/useSmartGlassesBLE';
import { useOtaUpdates } from '@/hooks/useOtaUpdates';
import { useTheme } from '@/hooks/useTheme';

// Register the Mapbox token once, before any MapView renders.
Mapbox.setAccessToken('pk.eyJ1IjoidmFzaWwtemhlbGV2IiwiYSI6ImNtbXZ5NnFjYTJkOWUyeXIwbmRjd2RkcTAifQ.c0735l2Vej_xd10i6Ol0SQ');
Mapbox.setTelemetryEnabled(false);

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const { colors, isDark } = useTheme();

  useSmartGlassesBLE();
  useOtaUpdates();

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  const navTheme: NavTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: colors.bg, card: colors.surface, text: colors.text, border: colors.border, primary: colors.accent },
    };
  }, [isDark, colors]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={navTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack>
      <GlassesNotification />
      <SOSOverlay />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
