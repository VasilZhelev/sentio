import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useSentioStore } from '@/store/useSentioStore';
import Mapbox from '@rnmapbox/maps';
import SOSOverlay from '@/components/SOSOverlay';
import { useSmartGlassesBLE } from '@/hooks/useSmartGlassesBLE';

// Set Mapbox access token ONCE at the root module scope.
// This guarantees the token is registered before any MapView renders on any screen.
Mapbox.setAccessToken('pk.eyJ1IjoidmFzaWwtemhlbGV2IiwiYSI6ImNtbXZ5NnFjYTJkOWUyeXIwbmRjd2RkcTAifQ.c0735l2Vej_xd10i6Ol0SQ');
Mapbox.setTelemetryEnabled(false);

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { theme } = useSentioStore();
  
  // Initialize BLE Scanner & connectivity
  useSmartGlassesBLE();

  return (
    <ThemeProvider value={theme === 'DARK' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <SOSOverlay />
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
