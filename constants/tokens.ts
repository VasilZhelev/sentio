// Sentio design tokens — "Alpine premium".
// Rule: `sos` red is reserved for crash / SOS states only. Never use it for errors or decoration.
import type { TextStyle } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export type Colors = {
  bg: string;
  surface: string;
  surfaceRaised: string;
  surfaceSunken: string;
  overlay: string; // translucent surface over the map (with blur)
  overlayStrong: string; // used where real blur is unavailable (Android, web)
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  accent: string;
  accentSoft: string; // accent tint background
  onAccent: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  sos: string;
  sosSoft: string;
  onSos: string;
  scrim: string;
};

const dark: Colors = {
  bg: '#0E1013',
  surface: '#161A1F',
  surfaceRaised: '#1F242B',
  surfaceSunken: '#0A0C0E',
  overlay: 'rgba(22,26,31,0.72)',
  overlayStrong: 'rgba(22,26,31,0.95)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  text: '#F2F4F7',
  textSecondary: '#9BA4AF',
  textTertiary: '#6B7480',
  textInverse: '#0E1013',
  accent: '#4FD1FF',
  accentSoft: 'rgba(79,209,255,0.14)',
  onAccent: '#04222E',
  success: '#3DDC97',
  successSoft: 'rgba(61,220,151,0.14)',
  warning: '#FFB020',
  warningSoft: 'rgba(255,176,32,0.14)',
  sos: '#FF3B3B',
  sosSoft: 'rgba(255,59,59,0.16)',
  onSos: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.55)',
};

const light: Colors = {
  bg: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceSunken: '#E9EDF1',
  overlay: 'rgba(255,255,255,0.78)',
  overlayStrong: 'rgba(255,255,255,0.96)',
  border: 'rgba(14,16,19,0.08)',
  borderStrong: 'rgba(14,16,19,0.16)',
  text: '#0E1013',
  textSecondary: '#5B6470',
  textTertiary: '#8A939E',
  textInverse: '#FFFFFF',
  accent: '#0A7FB8',
  accentSoft: 'rgba(10,127,184,0.10)',
  onAccent: '#FFFFFF',
  success: '#12A06A',
  successSoft: 'rgba(18,160,106,0.10)',
  warning: '#C77700',
  warningSoft: 'rgba(199,119,0,0.10)',
  sos: '#E5262B',
  sosSoft: 'rgba(229,38,43,0.10)',
  onSos: '#FFFFFF',
  scrim: 'rgba(14,16,19,0.40)',
};

export const palettes: Record<ColorScheme, Colors> = { dark, light };

// ── Typography ─────────────────────────────────────────
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export type TypeVariant =
  | 'hero'
  | 'display'
  | 'title'
  | 'headline'
  | 'body'
  | 'bodyStrong'
  | 'callout'
  | 'label'
  | 'caption'
  | 'overline';

export const type: Record<TypeVariant, TextStyle> = {
  hero: { fontFamily: fontFamily.bold, fontSize: 96, lineHeight: 100, letterSpacing: -4 },
  display: { fontFamily: fontFamily.bold, fontSize: 56, lineHeight: 60, letterSpacing: -2 },
  title: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  headline: { fontFamily: fontFamily.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 22 },
  callout: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, textTransform: 'uppercase' },
};

// ── Layout ─────────────────────────────────────────────
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 20, xl: 28, pill: 999 } as const;

/** Touch target sizes. `glove` is for anything used while riding. */
export const hit = { min: 48, glove: 64 } as const;

export const elevation = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const motion = {
  fast: 150,
  base: 220,
  spring: { damping: 18, stiffness: 260, mass: 0.8 },
} as const;

/** Numbers that update live must not jitter. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };
