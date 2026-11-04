/**
 * useTerminalBridge
 * Connects the running app to the PC terminal bridge (ws://<metro-host>:8989) so demo
 * events (SOS, hazards, emoji, speed) can be triggered from the keyboard.
 */
import { useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { useSentioStore } from '../store/useSentioStore';
import { SPORTS } from '@/constants/sports';

export function useTerminalBridge(onEmojiSpam: (emoji: string) => void) {
  const onEmojiRef = useRef(onEmojiSpam);
  onEmojiRef.current = onEmojiSpam;

  useEffect(() => {
    const hostUri = Constants.expoConfig?.hostUri;
    const pcIp = hostUri ? hostUri.split(':')[0] : 'localhost';
    const wsUrl = `ws://${pcIp}:8989`;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    function connect() {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const store = useSentioStore.getState();
          switch (data.type) {
            case 'SOS_TRIGGER':
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              store.triggerCrash();
              break;
            case 'MOCK_HAZARD': {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              const kinds = SPORTS[store.sportProfile].hazards;
              const kind = kinds[Math.floor(Math.random() * kinds.length)].key;
              store.addHazard({
                id: `mock_${Date.now()}`,
                kind,
                latitude: store.telemetry.latitude + (Math.random() - 0.5) * 0.005,
                longitude: store.telemetry.longitude + (Math.random() - 0.5) * 0.005,
                reportedBy: 'Terminal',
                reportedAt: Date.now(),
              });
              break;
            }
            case 'EMOJI_SPAM':
              onEmojiRef.current(data.emoji || '⚡');
              break;
            case 'SPEED_BOOST':
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              store.updateTelemetry({ speed: store.telemetry.speed + 20 });
              break;
            case 'RESET_TELEMETRY':
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              store.updateTelemetry({ speed: 12 });
              break;
          }
        } catch (err) {
          console.error('[BRIDGE CLIENT] Parse error:', err);
        }
      };

      ws.onclose = () => {
        if (!disposed) reconnectTimer = setTimeout(connect, 5000);
      };
      ws.onerror = () => ws?.close();
    }

    connect();
    return () => {
      disposed = true;
      ws?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);
}
