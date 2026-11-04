// Sentio design tokens — "Liquid Alpine".
// Content sits on the canvas (no boxed cards). Floating controls use liquid glass.
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
  bg: '#07080A',
  surface: '#111317',
  surfaceRaised: '#1A1D22',
  surfaceSunken: '#16191D',
  overlay: 'rgba(255,255,255,0.07)',
  overlayStrong: 'rgba(24,27,32,0.94)',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  text: '#F5F7FA',
  textSecondary: '#9AA3AE',
  textTertiary: '#5E6672',
  textInverse: '#07080A',
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
  bg: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceSunken: '#E7EAEE',
  overlay: 'rgba(255,255,255,0.45)',
  overlayStrong: 'rgba(255,255,255,0.94)',
  border: 'rgba(14,16,19,0.07)',
  borderStrong: 'rgba(14,16,19,0.12)',
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

// ── Game palette ───────────────────────────────────────
// Only for gamification (badges, tiers, tags, confetti). Never for SOS or status.
export const fun = {
  gold: '#FFC53D',
  silver: '#C3CCD6',
  bronze: '#E3925A',
  legend: '#B794FF',
  violet: '#A78BFA',
  pink: '#FF6FB5',
  lime: '#B6F36A',
  flame: '#FF7A1A',
} as const;

export const tierColor = { bronze: fun.bronze, silver: fun.silver, gold: fun.gold, legend: fun.legend } as const;

// ── Typography ─────────────────────────────────────────
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  /** DIN-like sport face for headlines, labels and numbers. */
  display: 'Barlow_700Bold',
  displaySemi: 'Barlow_600SemiBold',
  /** Condensed for big live numbers (speed, countdown). */
  numeric: 'BarlowCondensed_600SemiBold',
  numericBold: 'BarlowCondensed_700Bold',
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
  hero: { fontFamily: fontFamily.numeric, fontSize: 128, lineHeight: 124, letterSpacing: -3 },
  display: { fontFamily: fontFamily.numeric, fontSize: 64, lineHeight: 64, letterSpacing: -1.5 },
  title: { fontFamily: fontFamily.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.5 },
  headline: { fontFamily: fontFamily.displaySemi, fontSize: 21, lineHeight: 26, letterSpacing: -0.1 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 22 },
  callout: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: fontFamily.displaySemi, fontSize: 12, lineHeight: 16, letterSpacing: 1.4, textTransform: 'uppercase' },
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
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 10,
  },
} as const;

export const motion = {
  fast: 150,
  base: 220,
  spring: { damping: 18, stiffness: 260, mass: 0.8 },
} as const;

/** Numbers that update live must not jitter. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };
