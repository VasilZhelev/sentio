import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSentioStore } from '@/store/useSentioStore';
import { palettes, type ColorScheme, type Colors } from '@/constants/tokens';

export type Theme = {
  scheme: ColorScheme;
  colors: Colors;
  isDark: boolean;
  /** Background for floating "glass" surfaces: translucent where real blur exists (iOS), near-opaque elsewhere. */
  glass: string;
};

/** Resolves the active color scheme from the user's Appearance setting (system / light / dark). */
export function useTheme(): Theme {
  const system = useColorScheme();
  const appearance = useSentioStore((s) => s.appearance);
  const scheme: ColorScheme = appearance === 'system' ? (system === 'light' ? 'light' : 'dark') : appearance;
  return useMemo(() => {
    const colors = palettes[scheme];
    return { scheme, colors, isDark: scheme === 'dark', glass: Platform.OS === 'ios' ? colors.overlay : colors.overlayStrong };
  }, [scheme]);
}
