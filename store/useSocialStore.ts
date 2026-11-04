// Social + game layer: feed, badges, XP/levels, challenges, celebrations.
// All demo data for now (no backend yet), but every interaction is live in-app.
import { create } from 'zustand';
import { ROUTES } from '@/hooks/usePamporovoSimulation';
import type { IconName } from '@/constants/sports';

export type Tier = 'bronze' | 'silver' | 'gold' | 'legend';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  tier: Tier;
  unlocked: boolean;
  progress?: number; // 0..1 when locked
}

export interface Challenge {
  id: string;
  title: string;
  icon: IconName;
  current: number;
  target: number;
  unit: string;
  xp: number;
  claimed: boolean;
}

type LatLng = { lat: number; lng: number };

export type PostMedia =
  | { kind: 'route'; points: LatLng[] }
  | { kind: 'scene'; center: LatLng; bearing: number; zoom?: number }
  | { kind: 'badge'; badgeId: string };

export interface Post {
  id: string;
  riderId: string; // matches ghostRiders ids
  minutesAgo: number;
  place: string;
  text: string;
  media: PostMedia;
  stats?: { label: string; value: string }[];
  tag?: { label: string; tone: 'gold' | 'violet' | 'pink' | 'lime' };
  fires: number;
  comments: number;
  fired: boolean;
}

export interface Celebration {
  id: number;
  title: string;
  subtitle: string;
  icon: IconName;
  tier: Tier;
}

const run = (id: string) => ROUTES[id][0].waypoints.map((w) => ({ lat: w.lat, lng: w.lng }));

/** XP needed to reach the next level from `level`. */
export const xpForLevel = (level: number) => 500 + level * 150;

interface SocialState {
  xp: number; // xp inside the current level
  level: number;
  streakDays: number;
  addXp: (amount: number, reason: string) => void;
  xpToast: { id: number; amount: number; reason: string } | null;
  clearXpToast: () => void;

  celebration: Celebration | null;
  celebrate: (c: Omit<Celebration, 'id'>) => void;
  dismissCelebration: () => void;

  badges: Badge[];
  unlockBadge: (id: string) => void;

  challenges: Challenge[];
  claimChallenge: (id: string) => void;
  progressChallenge: (id: string, by: number) => void;
  progressBadge: (id: string, by: number) => void;

  posts: Post[];
  toggleFire: (postId: string) => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  xp: 3120,
  level: 23,
  streakDays: 5,
  xpToast: null,
  addXp: (amount, reason) =>
    set((s) => {
      let xp = s.xp + amount;
      let level = s.level;
      let leveled = false;
      while (xp >= xpForLevel(level)) {
        xp -= xpForLevel(level);
        level += 1;
        leveled = true;
      }
      if (leveled) {
        setTimeout(() => get().celebrate({ title: `Level ${level}!`, subtitle: 'You levelled up. New badges unlocked on the way.', icon: 'arrow-up-circle', tier: 'legend' }), 400);
      }
      return { xp, level, xpToast: { id: Date.now(), amount, reason } };
    }),
  clearXpToast: () => set({ xpToast: null }),

  celebration: null,
  celebrate: (c) => set({ celebration: { ...c, id: Date.now() } }),
  dismissCelebration: () => set({ celebration: null }),

  badges: [
    { id: 'first-chair', name: 'First chair', description: 'On the lift before 9:00', icon: 'sunny', tier: 'gold', unlocked: true },
    { id: 'speed-60', name: 'Sixty club', description: 'Hit 60 km/h', icon: 'flash', tier: 'silver', unlocked: true },
    { id: 'crew-5', name: 'Pack leader', description: 'Ride with 4+ friends', icon: 'people', tier: 'bronze', unlocked: true },
    { id: 'scout', name: 'Trail scout', description: 'Report 10 hazards', icon: 'eye', tier: 'silver', unlocked: false, progress: 0.6 },
    { id: 'air-2', name: 'Hang time', description: '2 s of air time', icon: 'airplane', tier: 'gold', unlocked: false, progress: 0.45 },
    { id: 'vertical-10k', name: 'Everest-ish', description: '10 000 m vertical this season', icon: 'trending-down', tier: 'legend', unlocked: false, progress: 0.72 },
    { id: 'powder', name: 'Powder hound', description: 'Ride after 20 cm fresh snow', icon: 'snow', tier: 'gold', unlocked: false, progress: 0.9 },
    { id: 'guardian', name: 'Guardian', description: 'Confirm 5 crew hazard reports', icon: 'shield-checkmark', tier: 'bronze', unlocked: false, progress: 0.2 },
  ],
  unlockBadge: (id) => {
    const b = get().badges.find((x) => x.id === id);
    if (!b || b.unlocked) return;
    set((s) => ({ badges: s.badges.map((x) => (x.id === id ? { ...x, unlocked: true, progress: 1 } : x)) }));
    get().celebrate({ title: b.name, subtitle: `Badge unlocked · ${b.description}`, icon: b.icon, tier: b.tier });
  },

  challenges: [
    { id: 'c-vertical', title: 'Ride 1 500 m vertical', icon: 'trending-down', current: 1500, target: 1500, unit: 'm', xp: 150, claimed: false },
    { id: 'c-runs', title: 'Lap 8 runs with your crew', icon: 'people', current: 5, target: 8, unit: 'runs', xp: 120, claimed: false },
    { id: 'c-report', title: 'Report a hazard', icon: 'warning', current: 0, target: 1, unit: '', xp: 50, claimed: false },
  ],
  claimChallenge: (id) => {
    const c = get().challenges.find((x) => x.id === id);
    if (!c || c.claimed || c.current < c.target) return;
    set((s) => ({ challenges: s.challenges.map((x) => (x.id === id ? { ...x, claimed: true } : x)) }));
    get().addXp(c.xp, c.title);
    get().celebrate({ title: 'Challenge complete', subtitle: `${c.title} · +${c.xp} XP`, icon: c.icon, tier: 'gold' });
  },

  progressChallenge: (id, by) =>
    set((s) => ({ challenges: s.challenges.map((c) => (c.id === id ? { ...c, current: Math.min(c.target, c.current + by) } : c)) })),
  progressBadge: (id, by) => {
    const b = get().badges.find((x) => x.id === id);
    if (!b || b.unlocked) return;
    const next = Math.min(1, (b.progress ?? 0) + by);
    if (next >= 1) get().unlockBadge(id);
    else set((s) => ({ badges: s.badges.map((x) => (x.id === id ? { ...x, progress: next } : x)) }));
  },

  posts: [
    {
      id: 'p1',
      riderId: 'g4',
      minutesAgo: 12,
      place: 'Snezhanka · Pamporovo',
      text: 'Finally broke 70 on the top section. Legs are gone 🥵',
      media: { kind: 'route', points: run('g4') },
      stats: [
        { label: 'Top speed', value: '71 km/h' },
        { label: 'Vertical', value: '412 m' },
        { label: 'Time', value: '2:48' },
      ],
      tag: { label: 'Personal best', tone: 'gold' },
      fires: 42,
      comments: 8,
      fired: false,
    },
    {
      id: 'p2',
      riderId: 'g1',
      minutesAgo: 34,
      place: 'Snow park · Pamporovo',
      text: 'Kicker sesh 🛫 2.1 seconds of air, landed it clean.',
      media: { kind: 'scene', center: { lat: 41.6335, lng: 24.684 }, bearing: 140, zoom: 15.2 },
      stats: [
        { label: 'Air time', value: '2.1 s' },
        { label: 'Landing', value: '4.5 G' },
      ],
      tag: { label: 'Big air', tone: 'violet' },
      fires: 27,
      comments: 5,
      fired: true,
    },
    {
      id: 'p3',
      riderId: 'g2',
      minutesAgo: 58,
      place: 'Rodopi east',
      text: 'Unlocked this one before anyone else in the crew 😌',
      media: { kind: 'badge', badgeId: 'first-chair' },
      fires: 19,
      comments: 3,
      fired: false,
    },
    {
      id: 'p4',
      riderId: 'g3',
      minutesAgo: 95,
      place: 'Snezhanka peak',
      text: 'Bluebird morning from the top. Who’s in for one more?',
      media: { kind: 'scene', center: { lat: 41.6455, lng: 24.6765 }, bearing: 200, zoom: 13.6 },
      fires: 31,
      comments: 11,
      fired: false,
    },
    {
      id: 'p5',
      riderId: 'g2',
      minutesAgo: 140,
      place: 'Malina run',
      text: 'Smooth cruiser lap with Alex 🌲',
      media: { kind: 'route', points: run('g2') },
      stats: [
        { label: 'Top speed', value: '48 km/h' },
        { label: 'Distance', value: '1.9 km' },
      ],
      fires: 12,
      comments: 1,
      fired: false,
    },
  ],
  toggleFire: (postId) =>
    set((s) => ({
      posts: s.posts.map((p) => (p.id === postId ? { ...p, fired: !p.fired, fires: p.fires + (p.fired ? -1 : 1) } : p)),
    })),
}));
