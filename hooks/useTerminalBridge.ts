/**
 * useTerminalBridge Hook
 * ──────────────────────
 * Hooks the running app to the PC's Terminal Bridge over WebSockets.
 * Allows triggering tactical in-app commands directly from terminal keystrokes.
 */

import { useEffect } from 'react';
import Constants from 'expo-constants';
import { useSentioStore } from '../store/useSentioStore';
import * as Haptics from 'expo-haptics';

export function useTerminalBridge(onEmojiSpam: (emoji: string) => void) {
  const { triggerCrash, updateTelemetry, telemetry, addHazard } = useSentioStore();

  useEffect(() => {
    // Determine the PC's IP address from Expo's Metro Bundler host Uri
    const hostUri = Constants.expoConfig?.hostUri;
    const pcIp = hostUri ? hostUri.split(':')[0] : 'localhost';
    const wsUrl = `ws://${pcIp}:8989`;

    console.log(`[BRIDGE CLIENT] Connecting to terminal bridge at ${wsUrl}`);
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;

    function connect() {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[BRIDGE CLIENT] Link established with PC Terminal Bridge.');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[BRIDGE CLIENT] Received trigger:', data);

          switch (data.type) {
            case 'SOS_TRIGGER':
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              triggerCrash();
              break;

            case 'MOCK_HAZARD':
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              // Spawn a random mock hazard slightly ahead of the user
              const types = ['Icy Patch', 'Fallen Tree', 'Deep Mud', 'Rut Trap', 'Big Queue'];
              const randomType = types[Math.floor(Math.random() * types.length)];
              addHazard({
                id: `mock_${Date.now()}`,
                type: randomType,
                latitude: telemetry.latitude + (Math.random() - 0.5) * 0.005,
                longitude: telemetry.longitude + (Math.random() - 0.5) * 0.005,
                reportedBy: 'PC Terminal',
                reportedAgo: 'Just now',
              });
              break;

            case 'EMOJI_SPAM':
              onEmojiSpam(data.emoji || '⚡');
              break;

            case 'SPEED_BOOST':
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              updateTelemetry({ speed: telemetry.speed + 20 });
              break;

            case 'RESET_TELEMETRY':
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              updateTelemetry({ speed: 12 }); // Reset back to a sensible baseline speed
              break;
          }
        } catch (err) {
          console.error('[BRIDGE CLIENT] Parse error:', err);
        }
      };

      ws.onclose = () => {
        console.log('[BRIDGE CLIENT] Connection closed. Retrying in 5 seconds...');
        reconnectTimer = setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        console.log('[BRIDGE CLIENT] Socket error, closing...');
        ws?.close();
      };
    }

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [triggerCrash, updateTelemetry, telemetry, addHazard, onEmojiSpam]);
}
