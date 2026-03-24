import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useSentioStore } from '@/store/useSentioStore';
import ModeSelector from '@/components/ModeSelector';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { theme, hasSelectedMode } = useSentioStore();

  // Show mode selector before entering the app
  if (!hasSelectedMode) {
    return (
      <>
        <StatusBar style={theme === 'DARK' ? 'light' : 'dark'} />
        <ModeSelector />
      </>
    );
  }

  return (
    <ThemeProvider value={theme === 'DARK' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={theme === 'DARK' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
