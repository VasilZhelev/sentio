import { create } from 'zustand';
import type { SportProfile } from '@/constants/sports';

export type { SportProfile };
export type Appearance = 'system' | 'light' | 'dark';
export type CrashStatus = 'IDLE' | 'COUNTDOWN' | 'SENT' | 'CANCELLED';

export interface Telemetry {
  speed: number;
  altitude: number;
  gForce: number;
  lapTime: string;
  airTime: number;
  latitude: number;
  longitude: number;
}

/** Running stats for the current riding session. */
export interface Session {
  startedAt: number;
  maxSpeed: number;
  peakG: number;
  maxAltitude: number;
  minAltitude: number;
  gHistory: number[]; // last 40 G-force samples
}

export interface Hazard {
  id: string;
  kind: string; // key from SPORTS[x].hazards
  latitude: number;
  longitude: number;
  reportedBy: string;
  reportedAt: number;
}

export interface GhostRider {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sport: SportProfile;
  speed: number;
  peakGForce: number;
  airTime: number;
  crashes: number;
  avatarUri: any;
  level: number;
}

interface SentioState {
  // ── Onboarding & preferences ──
  hasOnboarded: boolean;
  setHasOnboarded: (v: boolean) => void;
  appearance: Appearance;
  setAppearance: (a: Appearance) => void;
  sportProfile: SportProfile;
  setSportProfile: (profile: SportProfile) => void;
  sosCountdownSeconds: number;
  setSosCountdownSeconds: (s: number) => void;
  hudBrightness: number; // 0..100
  setHudBrightness: (v: number) => void;
  profile: { name: string; avatar: any };

  // ── Live data ──
  telemetry: Telemetry;
  session: Session;
  updateTelemetry: (data: Partial<Telemetry>) => void;
  hazards: Hazard[];
  addHazard: (hazard: Hazard) => void;
  removeHazard: (id: string) => void;
  ghostRiders: GhostRider[];
  updateGhostRider: (id: string, data: Partial<GhostRider>) => void;

  // ── Goggles ──
  bleConnected: boolean;
  bleDeviceId: string | null;
  glassesBattery: number;
  glassesFirmware: string;
  setBleConnected: (status: boolean) => void;
  setBleDeviceId: (id: string | null) => void;
  setGlassesBattery: (battery: number) => void;

  // ── Crash detection / SOS ──
  isCrashOverlayVisible: boolean;
  crashCountdown: number;
  crashStatus: CrashStatus;
  sosSentAt: number | null;
  triggerCrash: () => void;
  cancelCrash: () => void;
  tickCrash: () => void;
  /** Sends the SOS now (countdown finished, "Get help now", or goggles TRIGGER_SOS). */
  finishCrash: () => void;

  // ── Glasses notifications ──
  notificationVisible: boolean;
  notificationText: string;
  setNotification: (text: string) => void;
  clearNotification: () => void;

  // ── BLE log (last 30 entries) ──
  bleLog: string[];
  addBleLog: (entry: string) => void;
  clearBleLog: () => void;
}

const START_TELEMETRY: Telemetry = {
  speed: 0,
  altitude: 1926,
  gForce: 1.0,
  lapTime: '00:00.00',
  airTime: 0,
  latitude: 41.6337,
  longitude: 24.6882,
};

const minutesAgo = (m: number) => Date.now() - m * 60_000;

export const useSentioStore = create<SentioState>((set) => ({
  hasOnboarded: false,
  setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),
  appearance: 'system',
  setAppearance: (appearance) => set({ appearance }),
  sportProfile: 'SKI',
  setSportProfile: (sportProfile) => set({ sportProfile }),
  sosCountdownSeconds: 15,
  setSosCountdownSeconds: (sosCountdownSeconds) => set({ sosCountdownSeconds }),
  hudBrightness: 80,
  setHudBrightness: (hudBrightness) => set({ hudBrightness }),
  profile: { name: 'You', avatar: require('../assets/images/avatar_user.png') },

  telemetry: START_TELEMETRY,
  session: {
    startedAt: Date.now(),
    maxSpeed: 0,
    peakG: 1.0,
    maxAltitude: START_TELEMETRY.altitude,
    minAltitude: START_TELEMETRY.altitude,
    gHistory: [],
  },
  updateTelemetry: (data) =>
    set((s) => {
      const t = { ...s.telemetry, ...data };
      return {
        telemetry: t,
        session: {
          ...s.session,
          maxSpeed: Math.max(s.session.maxSpeed, t.speed),
          peakG: Math.max(s.session.peakG, t.gForce),
          maxAltitude: Math.max(s.session.maxAltitude, t.altitude),
          minAltitude: Math.min(s.session.minAltitude, t.altitude),
          gHistory: data.gForce !== undefined ? [...s.session.gHistory, t.gForce].slice(-40) : s.session.gHistory,
        },
      };
    }),

  // Demo hazards around Pamporovo
  hazards: [
    { id: 'h1', kind: 'ice', latitude: 41.6362, longitude: 24.6905, reportedBy: 'Marta', reportedAt: minutesAgo(5) },
    { id: 'h2', kind: 'queue', latitude: 41.6312, longitude: 24.6812, reportedBy: 'Boris', reportedAt: minutesAgo(12) },
    { id: 'h3', kind: 'closed', latitude: 41.6378, longitude: 24.6838, reportedBy: 'Alex', reportedAt: minutesAgo(20) },
  ],
  addHazard: (hazard) => set((s) => ({ hazards: [...s.hazards, hazard] })),
  removeHazard: (id) => set((s) => ({ hazards: s.hazards.filter((h) => h.id !== id) })),

  // Crew riding with you (positions animated by usePamporovoSimulation)
  ghostRiders: [
    { id: 'g1', name: 'Alex', latitude: 41.6293, longitude: 24.6882, sport: 'SKI', speed: 52, peakGForce: 3.2, airTime: 1.4, crashes: 1, avatarUri: require('../assets/images/avatar_alex.png'), level: 42 },
    { id: 'g2', name: 'Marta', latitude: 41.6302, longitude: 24.692, sport: 'SKI', speed: 48, peakGForce: 2.8, airTime: 0.9, crashes: 0, avatarUri: require('../assets/images/avatar_marta.png'), level: 38 },
    { id: 'g3', name: 'Boris', latitude: 41.6318, longitude: 24.684, sport: 'SKI', speed: 40, peakGForce: 2.1, airTime: 0.6, crashes: 0, avatarUri: require('../assets/images/avatar_boris.png'), level: 25 },
    { id: 'g4', name: 'Vanya', latitude: 41.6285, longitude: 24.6858, sport: 'SKI', speed: 70, peakGForce: 4.5, airTime: 2.1, crashes: 2, avatarUri: require('../assets/images/avatar_vanya.png'), level: 50 },
  ],
  updateGhostRider: (id, data) =>
    set((s) => ({ ghostRiders: s.ghostRiders.map((r) => (r.id === id ? { ...r, ...data } : r)) })),

  bleConnected: false,
  bleDeviceId: null,
  glassesBattery: 100,
  glassesFirmware: 'v2.1.0',
  setBleConnected: (bleConnected) => set({ bleConnected }),
  setBleDeviceId: (bleDeviceId) => set({ bleDeviceId }),
  setGlassesBattery: (glassesBattery) => set({ glassesBattery }),

  isCrashOverlayVisible: false,
  crashCountdown: 15,
  crashStatus: 'IDLE',
  sosSentAt: null,
  triggerCrash: () =>
    set((s) =>
      s.crashStatus === 'COUNTDOWN' || s.crashStatus === 'SENT'
        ? s
        : { isCrashOverlayVisible: true, crashCountdown: s.sosCountdownSeconds, crashStatus: 'COUNTDOWN', sosSentAt: null }
    ),
  cancelCrash: () => set((s) => ({ isCrashOverlayVisible: false, crashStatus: 'CANCELLED', crashCountdown: s.sosCountdownSeconds, sosSentAt: null })),
  tickCrash: () => set((s) => ({ crashCountdown: Math.max(0, s.crashCountdown - 1) })),
  finishCrash: () => set({ isCrashOverlayVisible: true, crashStatus: 'SENT', crashCountdown: 0, sosSentAt: Date.now() }),

  notificationVisible: false,
  notificationText: '',
  setNotification: (notificationText) => set({ notificationVisible: true, notificationText }),
  clearNotification: () => set({ notificationVisible: false, notificationText: '' }),

  bleLog: [],
  addBleLog: (entry) =>
    set((s) => ({
      bleLog: [`${new Date().toLocaleTimeString('en-GB', { hour12: false })} ${entry}`, ...s.bleLog].slice(0, 30),
    })),
  clearBleLog: () => set({ bleLog: [] }),
}));
