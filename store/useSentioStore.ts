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
  avatarUri: any;
  level: number;
  achievements: string[];
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
  squadStatus: { onlineCount: number; totalCount: number };
  isEmergency: boolean;
  bleConnected: boolean;
  bleDeviceId: string | null;
  isDemoCentered: boolean;
  glassesBattery: number;

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
  updateGhostRider: (id: string, data: Partial<GhostRider>) => void;
  centerDemoData: (lat: number, lng: number) => void;
  setGlassesBattery: (battery: number) => void;

  // ── Crash Detection ──
  isCrashOverlayVisible: boolean;
  crashCountdown: number;
  crashStatus: 'IDLE' | 'COUNTDOWN' | 'SENT' | 'CANCELLED';
  triggerCrash: () => void;
  cancelCrash: () => void;
  tickCrash: () => void;
  finishCrash: () => void;

  // ── Glasses Notifications ──
  notificationVisible: boolean;
  notificationText: string;
  setNotification: (text: string) => void;
  clearNotification: () => void;

  // ── BLE Connection Log (last 30 entries) ──
  bleLog: string[];
  addBleLog: (entry: string) => void;
  clearBleLog: () => void;
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
    latitude: 41.6337,
    longitude: 24.6882,
  },

  // ── Demo Hazards ──
  hazards: [
    { id: 'h1', type: 'Ice Patch',    latitude: 41.6420, longitude: 24.6900, reportedBy: 'Maverick',  reportedAgo: '5 min' },
    { id: 'h2', type: 'Fallen Tree',  latitude: 41.6335, longitude: 24.6650, reportedBy: 'Goose',     reportedAgo: '12 min' },
    { id: 'h3', type: 'Jump',         latitude: 41.6390, longitude: 24.6850, reportedBy: 'Viper',     reportedAgo: '2 min' },
    { id: 'h4', type: 'Deep Mud',     latitude: 41.6295, longitude: 24.6760, reportedBy: 'Iceman',    reportedAgo: '8 min' },
    { id: 'h5', type: 'Closed Trail', latitude: 41.6380, longitude: 24.6790, reportedBy: 'Phoenix',   reportedAgo: '20 min' },
  ],

  // ── 5 Friends on Pamporovo — matching routes ──
  ghostRiders: [
    { id: 'g1', name: 'Alex',    latitude: 41.6293, longitude: 24.6882, sport: 'SKI', speed: 52, peakGForce: 3.2, crashes: 1, avatarUri: require('../assets/images/avatar_alex.png'), level: 42, achievements: ['🥇', '🚀', '🔥'] },
    { id: 'g2', name: 'Marta',   latitude: 41.6302, longitude: 24.6920, sport: 'SKI', speed: 48, peakGForce: 2.8, crashes: 0, avatarUri: require('../assets/images/avatar_marta.png'), level: 38, achievements: ['👑', '⚡️'] },
    { id: 'g3', name: 'Boris',   latitude: 41.6318, longitude: 24.6840, sport: 'SKI', speed: 40, peakGForce: 2.1, crashes: 0, avatarUri: require('../assets/images/avatar_boris.png'), level: 25, achievements: ['🛡️'] },
    { id: 'g4', name: 'Vanya',   latitude: 41.6285, longitude: 24.6858, sport: 'SKI', speed: 70, peakGForce: 4.5, crashes: 2, avatarUri: require('../assets/images/avatar_vanya.png'), level: 50, achievements: ['🏆', '💀', '💨'] },
    { id: 'g5', name: 'YOU (CLONE)', latitude: 41.6350, longitude: 24.6800, sport: 'SKI', speed: 0, peakGForce: 1.0, crashes: 0, avatarUri: require('../assets/images/avatar_user.png'), level: 99, achievements: ['🚀'] },
  ],

  squadStatus: { onlineCount: 5, totalCount: 5 },

  isEmergency: false,
  bleConnected: false,
  bleDeviceId: null,
  isDemoCentered: false,
  glassesBattery: 100,

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
  updateGhostRider: (id, data) =>
    set((s) => ({
      ghostRiders: s.ghostRiders.map((r) => r.id === id ? { ...r, ...data } : r),
    })),
  setBleConnected: (bleConnected) => set({ bleConnected }),
  setBleDeviceId: (bleDeviceId) => set({ bleDeviceId }),
  setGlassesBattery: (glassesBattery) => set({ glassesBattery }),
  
  // ── Crash Actions ──
  isCrashOverlayVisible: false,
  crashCountdown: 10,
  crashStatus: 'IDLE',
  
  triggerCrash: () => set({ 
    isCrashOverlayVisible: true, 
    crashCountdown: 10, 
    crashStatus: 'COUNTDOWN' 
  }),
  cancelCrash: () => set({ 
    isCrashOverlayVisible: false, 
    crashStatus: 'CANCELLED',
    crashCountdown: 10 
  }),
  tickCrash: () => set((state) => ({ 
    crashCountdown: Math.max(0, state.crashCountdown - 1) 
  })),
  finishCrash: () => set({ 
    crashStatus: 'SENT',
    crashCountdown: 0
  }),

  // ── Glasses Notifications ──
  notificationVisible: false,
  notificationText: '',
  setNotification: (notificationText) => set({ notificationVisible: true, notificationText }),
  clearNotification: () => set({ notificationVisible: false, notificationText: '' }),

  // ── BLE Log ──
  bleLog: [],
  addBleLog: (entry) => set((s) => ({
    bleLog: [`${new Date().toLocaleTimeString('en-GB', { hour12: false })} ${entry}`, ...s.bleLog].slice(0, 30),
  })),
  clearBleLog: () => set({ bleLog: [] }),

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
