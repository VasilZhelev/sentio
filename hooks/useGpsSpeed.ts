import { useEffect } from 'react';
import * as Location from 'expo-location';
import { useSentioStore } from '@/store/useSentioStore';

// GPS reports a little movement even when standing still
const STANDING_STILL_KMH = 1;

/**
 * Feeds the phone's GPS speed into telemetry. The goggles have no GPS, so this is
 * the source for both the app and the HUD (which receives it as SPD: over BLE).
 */
export function useGpsSpeed() {
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!granted || cancelled) return;

        const watcher = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 },
          ({ coords }) => {
            // Speed is null or negative when the phone has no valid reading
            const kmh = Math.max(0, coords.speed ?? 0) * 3.6;
            useSentioStore.getState().updateTelemetry({ speed: kmh < STANDING_STILL_KMH ? 0 : kmh });
          }
        );

        if (cancelled) watcher.remove();
        else subscription = watcher;
      } catch (err) {
        console.warn('[GPS] Speed tracking unavailable:', err);
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);
}
