import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────
export type Theme = 'DARK' | 'LIGHT';
export type SportProfile = 'MOTOCROSS' | 'SKI';

export interface Telemetry {
  speed: number;
  altitude: number;
  gForce: number;
  lapTime: string;
  airTime: number;
  latitude: number;
  longitude: number;
}

export interface Hazard {
  id: string;
  type: string;
  latitude: number;
  longitude: number;
  reportedBy: string;
  reportedAgo: string;
}

export interface GhostRider {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sport: SportProfile;
  speed: number;
  peakGForce: number;
  crashes: number;
  avatarUri: string;
}

// ─── Store ───────────────────────────────────────────────
interface SentioState {
  // Mode selection
  hasSelectedMode: boolean;
  setHasSelectedMode: (v: boolean) => void;

  theme: Theme;
  sportProfile: SportProfile;
  telemetry: Telemetry;
  hazards: Hazard[];
  ghostRiders: GhostRider[];
  isEmergency: boolean;
  bleConnected: boolean;
  bleDeviceId: string | null;
  isDemoCentered: boolean;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSportProfile: (profile: SportProfile) => void;
  toggleSportProfile: () => void;
  updateTelemetry: (data: Partial<Telemetry>) => void;
  addHazard: (hazard: Hazard) => void;
  removeHazard: (id: string) => void;
  setEmergency: (status: boolean) => void;
  setBleConnected: (status: boolean) => void;
  setBleDeviceId: (id: string | null) => void;
  centerDemoData: (lat: number, lng: number) => void;
}

export const useSentioStore = create<SentioState>((set) => ({
  hasSelectedMode: false,
  setHasSelectedMode: (hasSelectedMode) => set({ hasSelectedMode }),

  theme: 'LIGHT', // Default to light for Bump style
  sportProfile: 'MOTOCROSS',

  telemetry: {
    speed: 0,
    altitude: 1926,
    gForce: 1.0,
    lapTime: '00:00.00',
    airTime: 0,
    latitude: 41.6378,
    longitude: 24.6769,
  },

  // ── Demo Hazards ──
  hazards: [
    { id: 'h1', type: 'Ice Patch',    latitude: 41.6420, longitude: 24.6900, reportedBy: 'Maverick',  reportedAgo: '5 min' },
    { id: 'h2', type: 'Fallen Tree',  latitude: 41.6335, longitude: 24.6650, reportedBy: 'Goose',     reportedAgo: '12 min' },
    { id: 'h3', type: 'Jump',         latitude: 41.6390, longitude: 24.6850, reportedBy: 'Viper',     reportedAgo: '2 min' },
    { id: 'h4', type: 'Deep Mud',     latitude: 41.6295, longitude: 24.6760, reportedBy: 'Iceman',    reportedAgo: '8 min' },
    { id: 'h5', type: 'Closed Trail', latitude: 41.6380, longitude: 24.6790, reportedBy: 'Phoenix',   reportedAgo: '20 min' },
  ],

  // ── Demo Ghost Riders (High Quality Avatars) ──
  ghostRiders: [
    { id: 'g1', name: 'Maverick',  latitude: 41.6441, longitude: 24.6885, sport: 'SKI', speed: 67, peakGForce: 3.2, crashes: 1, avatarUri: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&h=120&fit=crop' }, // Malina
    { id: 'g2', name: 'Goose',     latitude: 41.6315, longitude: 24.6582, sport: 'SKI', speed: 82, peakGForce: 2.8, crashes: 0, avatarUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop' }, // Stoikite
    { id: 'g3', name: 'Iceman',    latitude: 41.6398, longitude: 24.6845, sport: 'SKI', speed: 88, peakGForce: 4.5, crashes: 3, avatarUri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop' }, // Studenets
    { id: 'g4', name: 'Phoenix',   latitude: 41.6280, longitude: 24.6770, sport: 'SKI', speed: 55, peakGForce: 2.1, crashes: 0, avatarUri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop' }, // Smolyan Lakes Side
    { id: 'g5', name: 'Viper',     latitude: 41.6385, longitude: 24.6795, sport: 'SKI', speed: 104, peakGForce: 5.1, crashes: 5, avatarUri: 'https://images.unsplash.com/photo-1506803682981-6e718a9dd3ee?w=120&h=120&fit=crop' }, // The Wall (Stena)
    // User Clone for Testing Social Actions
    { id: 'clone1', name: 'Vasil Clone', latitude: 41.6378, longitude: 24.6769, sport: 'SKI', speed: 0, peakGForce: 1.2, crashes: 0, avatarUri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=120&h=120&fit=crop' }, // Snezhanka Peak 
  ],

  isEmergency: false,
  bleConnected: false,
  bleDeviceId: null,
  isDemoCentered: false,

  // ── Actions ──
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'DARK' ? 'LIGHT' : 'DARK' })),
  setSportProfile: (sportProfile) => set({ sportProfile }),
  toggleSportProfile: () =>
    set((s) => ({ sportProfile: s.sportProfile === 'MOTOCROSS' ? 'SKI' : 'MOTOCROSS' })),
  updateTelemetry: (data) =>
    set((s) => ({ telemetry: { ...s.telemetry, ...data } })),
  addHazard: (hazard) =>
    set((s) => ({ hazards: [...s.hazards, hazard] })),
  removeHazard: (id) =>
    set((s) => ({ hazards: s.hazards.filter((h) => h.id !== id) })),
  setEmergency: (isEmergency) => set({ isEmergency }),
  setBleConnected: (bleConnected) => set({ bleConnected }),
  setBleDeviceId: (bleDeviceId) => set({ bleDeviceId }),
  
  // Teleports all demo data from Pamporovo to the user's real physical GPS location
  centerDemoData: (lat: number, lng: number) => set((s) => {
    if (s.isDemoCentered) return s; // Only do this once per session

    const latOffset = lat - 41.6378;
    const lngOffset = lng - 24.6769;

    return {
      isDemoCentered: true,
      ghostRiders: s.ghostRiders.map((r) => ({
        ...r,
        latitude: r.latitude + latOffset,
        longitude: r.longitude + lngOffset,
      })),
      hazards: s.hazards.map((h) => ({
        ...h,
        latitude: h.latitude + latOffset,
        longitude: h.longitude + lngOffset,
      })),
    };
  }),
}));
