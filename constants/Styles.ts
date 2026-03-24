import { Platform } from 'react-native';
import type { Theme, SportProfile } from '../store/useSentioStore';

// ─── Visual Themes (Aesthetic Layer) ───────────────────
export const THEMES: Record<Theme, {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSoft: string;
  border: string;
}> = {
  LIGHT: {
    background: '#F8F7F4',   // warm paper white
    surface:    '#FFFFFF',
    surfaceAlt: '#EDE9E3',
    text:       '#0B0C10',
    textSoft:   '#6B7280',
    border:     '#D1CCC4',
  },
  DARK: {
    background: '#0B0C10',
    surface:    '#1A1D24',
    surfaceAlt: '#252930',
    text:       '#F0F0F0',
    textSoft:   '#7A8290',
    border:     '#2E3340',
  },
};

// ─── Sport Profiles (Functional Layer) ─────────────────
export const SPORT_PROFILES: Record<SportProfile, {
  accent: string;
  accentSoft: string;
  label: string;
  metrics: string[];
  hazardTypes: string[];
  icon: string;
}> = {
  MOTOCROSS: {
    accent:     '#FF5722',
    accentSoft: 'rgba(255, 87, 34, 0.15)',
    label:      'MOTO / MTB',
    metrics:    ['Speed', 'G-Force', 'Lap Time'],
    hazardTypes: ['Deep Mud', 'Fallen Tree', 'Jump'],
    icon:       '🏍️',
  },
  SKI: {
    accent:     '#00E5FF',
    accentSoft: 'rgba(0, 229, 255, 0.15)',
    label:      'SKI / SNOW',
    metrics:    ['Speed', 'Altitude', 'Air-Time'],
    hazardTypes: ['Ice Patch', 'Closed Trail', 'Cliff'],
    icon:       '🎿',
  },
};

// ─── UI Constants ──────────────────────────────────────
export const UI = {
  minButtonHeight: 64,
  borderRadius: 20,
  borderRadiusSm: 14,
  cardPadding: 20,
  pagePadding: 20,
  fontMono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

// ─── Hazard Icons ──────────────────────────────────────
export const HAZARD_ICONS: Record<string, string> = {
  'Deep Mud':     '💧',
  'Fallen Tree':  '🌲',
  'Jump':         '🚀',
  'Ice Patch':    '🧊',
  'Closed Trail': '🚧',
  'Cliff':        '⛰️',
};
