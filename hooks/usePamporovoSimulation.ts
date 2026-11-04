import { useEffect, useRef } from 'react';
import { useSentioStore } from '../store/useSentioStore';

// ─────────────────────────────────────────────────────────────────────────────
// Pamporovo Ski Resort — realistic movement simulation
//
// Timing model:
//   Each waypoint pair covers ~250–350m of real distance.
//   Casual skiing speed: 15–45 km/h → ~4–12 m/s → 250m takes 20–60s.
//   We pick 30s per step on piste so a full run takes ~3 min (realistic).
//
//   Chairlift speed: ~4–6 km/h → ~1.2 m/s → 300m takes ~250s.
//   We use 90s per lift step (compressed time so it doesn't bore the viewer).
//
// Tick: 2 seconds. Progress per tick = 2 / stepSecs.
// ─────────────────────────────────────────────────────────────────────────────

type WP = { lat: number; lng: number; speedKmh: number };
type Segment = { waypoints: WP[]; isLift: boolean };

// ── Piste routes: each has a descent segment + a lift segment ──
// Coords are placed ON actual Pamporovo piste lines.
export const ROUTES: Record<string, Segment[]> = {

  // Alex — Malina piste (wide blue/red, main family run)
  g1: [
    {
      isLift: false,
      waypoints: [
        { lat: 41.6294, lng: 24.6880, speedKmh: 22 },   // top, just setting off
        { lat: 41.6312, lng: 24.6862, speedKmh: 35 },   // open mid-slope
        { lat: 41.6334, lng: 24.6838, speedKmh: 42 },   // steeper section
        { lat: 41.6358, lng: 24.6814, speedKmh: 38 },
        { lat: 41.6382, lng: 24.6792, speedKmh: 30 },   // easing toward base
        { lat: 41.6408, lng: 24.6768, speedKmh: 20 },
        { lat: 41.6432, lng: 24.6750, speedKmh: 8 },    // braking into base
      ],
    },
    {
      isLift: true,  // Stoykite chairlift
      waypoints: [
        { lat: 41.6432, lng: 24.6750, speedKmh: 5 },
        { lat: 41.6408, lng: 24.6768, speedKmh: 6 },
        { lat: 41.6382, lng: 24.6792, speedKmh: 6 },
        { lat: 41.6358, lng: 24.6814, speedKmh: 6 },
        { lat: 41.6334, lng: 24.6838, speedKmh: 5 },
        { lat: 41.6312, lng: 24.6862, speedKmh: 5 },
        { lat: 41.6294, lng: 24.6880, speedKmh: 4 },
      ],
    },
  ],

  // Marta — Rodopi east flank (tree-lined red run)
  g2: [
    {
      isLift: false,
      waypoints: [
        { lat: 41.6298, lng: 24.6918, speedKmh: 20 },
        { lat: 41.6318, lng: 24.6898, speedKmh: 32 },
        { lat: 41.6342, lng: 24.6875, speedKmh: 40 },   // open fast section
        { lat: 41.6366, lng: 24.6850, speedKmh: 36 },
        { lat: 41.6390, lng: 24.6826, speedKmh: 28 },
        { lat: 41.6412, lng: 24.6804, speedKmh: 18 },
        { lat: 41.6434, lng: 24.6788, speedKmh: 7 },
      ],
    },
    {
      isLift: true,  // Perelik gondola
      waypoints: [
        { lat: 41.6434, lng: 24.6788, speedKmh: 5 },
        { lat: 41.6410, lng: 24.6808, speedKmh: 6 },
        { lat: 41.6386, lng: 24.6832, speedKmh: 6 },
        { lat: 41.6362, lng: 24.6856, speedKmh: 6 },
        { lat: 41.6336, lng: 24.6880, speedKmh: 5 },
        { lat: 41.6312, lng: 24.6902, speedKmh: 5 },
        { lat: 41.6298, lng: 24.6918, speedKmh: 4 },
      ],
    },
  ],

  // Boris — Studenets (gentle blue, west side — beginner-friendly)
  g3: [
    {
      isLift: false,
      waypoints: [
        { lat: 41.6320, lng: 24.6838, speedKmh: 15 },   // cautious at top
        { lat: 41.6340, lng: 24.6812, speedKmh: 24 },
        { lat: 41.6362, lng: 24.6786, speedKmh: 28 },
        { lat: 41.6384, lng: 24.6762, speedKmh: 25 },
        { lat: 41.6406, lng: 24.6744, speedKmh: 18 },
        { lat: 41.6428, lng: 24.6730, speedKmh: 10 },
        { lat: 41.6448, lng: 24.6718, speedKmh: 5 },
      ],
    },
    {
      isLift: true,  // Button/drag lift
      waypoints: [
        { lat: 41.6448, lng: 24.6718, speedKmh: 5 },
        { lat: 41.6426, lng: 24.6732, speedKmh: 6 },
        { lat: 41.6404, lng: 24.6748, speedKmh: 6 },
        { lat: 41.6382, lng: 24.6766, speedKmh: 6 },
        { lat: 41.6360, lng: 24.6790, speedKmh: 5 },
        { lat: 41.6338, lng: 24.6816, speedKmh: 5 },
        { lat: 41.6320, lng: 24.6838, speedKmh: 4 },
      ],
    },
  ],

  // Vanya — FIS slalom black run (the fast one)
  g4: [
    {
      isLift: false,
      waypoints: [
        { lat: 41.6286, lng: 24.6856, speedKmh: 35 },   // charging from top
        { lat: 41.6308, lng: 24.6840, speedKmh: 55 },   // full speed
        { lat: 41.6330, lng: 24.6818, speedKmh: 60 },   // peak
        { lat: 41.6354, lng: 24.6796, speedKmh: 52 },
        { lat: 41.6378, lng: 24.6773, speedKmh: 40 },
        { lat: 41.6402, lng: 24.6750, speedKmh: 25 },
        { lat: 41.6428, lng: 24.6732, speedKmh: 10 },
      ],
    },
    {
      isLift: true,  // Express quad
      waypoints: [
        { lat: 41.6428, lng: 24.6732, speedKmh: 5 },
        { lat: 41.6402, lng: 24.6752, speedKmh: 6 },
        { lat: 41.6376, lng: 24.6775, speedKmh: 6 },
        { lat: 41.6352, lng: 24.6798, speedKmh: 6 },
        { lat: 41.6328, lng: 24.6820, speedKmh: 5 },
        { lat: 41.6308, lng: 24.6842, speedKmh: 5 },
        { lat: 41.6286, lng: 24.6856, speedKmh: 4 },
      ],
    },
  ],
};

// ── Timing ────────────────────────────────────────────────────────────────────
const PISTE_STEP_SECS = 30;  // 30s per waypoint step → full run ≈ 3 min
const LIFT_STEP_SECS  = 90;  // 90s per waypoint step → full lift ride ≈ 9 min
const TICK_MS         = 2000; // position update every 2 seconds

interface RiderSim {
  segIdx:   number;   // 0 = piste, 1 = lift
  wpIdx:    number;   // index of the FROM waypoint
  progress: number;   // 0–1 within the current step
}

// Starting configs — 2 on piste, 2 on lift, all at different points
const INIT: Record<string, { segIdx: number; wpIdx: number; progress: number }> = {
  g1: { segIdx: 0, wpIdx: 1, progress: 0.4 },  // mid-piste, descending
  g2: { segIdx: 1, wpIdx: 2, progress: 0.2 },  // on the lift, mid-way up
  g3: { segIdx: 0, wpIdx: 3, progress: 0.7 },  // lower third of piste
  g4: { segIdx: 1, wpIdx: 1, progress: 0.6 },  // on the lift, lower section
};

export function usePamporovoSimulation(riderIds: string[]) {
  const updateGhostRider = useSentioStore((s) => s.updateGhostRider);
  const simRef = useRef<Record<string, RiderSim>>({});

  useEffect(() => {
    // Seed initial sim state
    riderIds.forEach((id) => {
      const init = INIT[id] ?? { segIdx: 0, wpIdx: 0, progress: 0 };
      simRef.current[id] = { ...init };
    });

    const interval = setInterval(() => {
      riderIds.forEach((id) => {
        const route = ROUTES[id];
        if (!route) return;

        const sim = simRef.current[id];
        const seg = route[sim.segIdx];
        const stepSecs = seg.isLift ? LIFT_STEP_SECS : PISTE_STEP_SECS;
        const progressPerTick = (TICK_MS / 1000) / stepSecs;

        sim.progress += progressPerTick;

        // Step completed → move to next waypoint pair
        if (sim.progress >= 1) {
          sim.progress -= 1; // carry over (no jerky jump)
          sim.wpIdx += 1;

          // Reached end of this segment → switch to next segment
          if (sim.wpIdx >= seg.waypoints.length - 1) {
            sim.wpIdx = 0;
            sim.segIdx = (sim.segIdx + 1) % route.length;
          }
        }

        // Smooth linear interpolation between two waypoints
        const curSeg = route[sim.segIdx];
        const maxIdx = curSeg.waypoints.length - 1;
        const wp1 = curSeg.waypoints[Math.min(sim.wpIdx, maxIdx)];
        const wp2 = curSeg.waypoints[Math.min(sim.wpIdx + 1, maxIdx)];
        const t = sim.progress;

        const lat = wp1.lat + (wp2.lat - wp1.lat) * t;
        const lng = wp1.lng + (wp2.lng - wp1.lng) * t;

        // Interpolate speed with small noise (±3 km/h) — feels organic
        const baseSpeed = wp1.speedKmh + (wp2.speedKmh - wp1.speedKmh) * t;
        const noise = (Math.random() - 0.5) * 3;
        const speed = Math.max(0, Math.round(baseSpeed + noise));

        updateGhostRider(id, { latitude: lat, longitude: lng, speed });
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
