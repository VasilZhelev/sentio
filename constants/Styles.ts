import { Platform } from 'react-native';

// ── Types ──────────────────────────────────────────────
export type Theme = 'LIGHT' | 'DARK';
export type SportProfile = 'SKI' | 'MOTOCROSS';

export type Palette = {
  background: string;
  surface: string;
  text: string;
  textSoft: string;
  accent: string;
  border: string;
  warning?: string;
  success?: string;
};

// ── UI Constants ───────────────────────────────────────
export const UI = {
  pagePadding: 20,
  cardPadding: 20,
  borderRadius: 24,
  borderRadiusSm: 12,
  minButtonHeight: 56,
  glassBlur: 70, // Intensity for BlurView
  
  // Tactical Styling
  tacticalShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  gloveSize: 72, // Tactical button size
  fontMono: 'SpaceGrotesk_400Regular', // Legacy compat
};

export const FONTS = {
  sans: 'Inter_700Bold', // Primary UI
  technical: 'SpaceGrotesk_700Bold', // Data/Numbers
  mono: 'SpaceGrotesk_400Regular', // Tactical Tags
};

// ── Status Tag Style ──
export const TACTICAL_TAG = (palette: Palette) => ({
  fontSize: 10,
  fontFamily: FONTS.mono,
  color: palette.textSoft,
  letterSpacing: 1.5,
  backgroundColor: 'rgba(0,0,0,0.5)',
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 4,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.15)',
});

// ── Palette Logic ──────────────────────────────────────
export function getThemePalette(profile: SportProfile, theme: Theme): Palette {
  const isDark = theme === 'DARK';
  const accent = profile === 'SKI' ? '#007AFF' : '#FF9500';
  
  if (isDark) {
    return {
      background: '#000000',
      surface: 'rgba(28, 28, 30, 0.7)',
      text: '#FFFFFF',
      textSoft: '#8E8E93',
      accent: accent,
      border: 'rgba(255, 255, 255, 0.15)',
      warning: '#FF9500',
      success: '#34C759',
    };
  } else {
    return {
      background: '#F2F2F7',
      surface: 'rgba(255, 255, 255, 0.85)',
      text: '#000000',
      textSoft: '#636366',
      accent: accent,
      border: 'rgba(0, 0, 0, 0.1)',
      warning: '#FF9500',
      success: '#34C759',
    };
  }
}

// ── Sport Profiles ─────────────────────────────────────
export const SPORT_PROFILES: Record<SportProfile, {
  label: string;
  metrics: string[];
  hazardTypes: string[];
  icon: string;
}> = {
  SKI: {
    label: 'SLOPES',
    metrics: ['SPEED', 'ALTITUDE', 'AIR-TIME'],
    hazardTypes: ['ICE', 'CROWDED', 'CLOSE_CALL', 'TREE'],
    icon: '🎿',
  },
  MOTOCROSS: {
    label: 'TRAILS',
    metrics: ['SPEED', 'G-FORCE', 'LAP TIME'],
    hazardTypes: ['MUD', 'JUMP', 'CRASH', 'WASH_OUT'],
    icon: '🏍️',
  },
};

// Legacy Compatibility
export const THEMES: any = null;
