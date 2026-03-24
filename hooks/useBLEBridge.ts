import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device, BleError, Characteristic } from 'react-native-ble-plx';
import * as Location from 'expo-location';
import { useSentioStore } from '../store/useSentioStore';
import * as Haptics from 'expo-haptics';

// ─── BLE Constants (Your ESP32) ──────────────────────────
const DEVICE_NAME       = 'Sentio_HUD';
const SERVICE_UUID      = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const RX_CHAR_UUID      = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'; // Write: App → Goggles
const TX_CHAR_UUID      = '8c3395b0-6435-4493-adbb-36dafc99db63'; // Notify: Goggles → App

// ─── Helpers ─────────────────────────────────────────────
// Safe Base64 encoding/decoding for Unicode Emojis
function toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(b64: string): string {
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch(e) {
    return atob(b64); // Fallback for raw ascii
  }
}

// ─── Android BLE Permissions ─────────────────────────────
async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ]);

  return Object.values(granted).every(
    (v) => v === PermissionsAndroid.RESULTS.GRANTED
  );
}

// ─── Singleton BLE Manager ───────────────────────────────
let manager: BleManager | null = null;
function getManager(): BleManager {
  if (!manager) manager = new BleManager();
  return manager;
}

// ─── Hook ────────────────────────────────────────────────
export function useBLEBridge() {
  const deviceRef = useRef<Device | null>(null);
  const speedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // ── Start GPS tracking ──
  const startGPSTracking = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[GPS] Location permissions denied');
      return;
    }

    console.log('[GPS] ✅ Starting high-accuracy GPS tracking');

    locationSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (location) => {
        const rawSpeedMs = location.coords.speed;

        // Convert m/s → km/h, ignore invalid/negative values
        let speedKmh = 0;
        if (rawSpeedMs !== null && rawSpeedMs > 0) {
          speedKmh = Math.round(rawSpeedMs * 3.6);
          // Stationary filter: Natural GPS drift causes ghost speeds of 1-2 km/h when standing still.
          if (speedKmh < 3) {
            speedKmh = 0;
          }
        }

        /*
        // Update the store with real GPS speed + altitude + coords
        const store = useSentioStore.getState();
        store.updateTelemetry({
          speed: speedKmh,
          altitude: location.coords.altitude
            ? Math.round(location.coords.altitude)
            : store.telemetry.altitude,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // The first time we get a real GPS lock, teleport the demo riders from Sofia to here
        if (!store.isDemoCentered) {
          store.centerDemoData(location.coords.latitude, location.coords.longitude);
        }
        */
      }
    );
  }, []);

  // ── Connect and listen to ESP32 ──
  const connectAndListen = useCallback(async (device: Device) => {
    const ble = getManager();
    try {
      const connected = await ble.connectToDevice(device.id, { autoConnect: true });
      deviceRef.current = connected;

      await connected.discoverAllServicesAndCharacteristics();
      useSentioStore.getState().setBleConnected(true);
      useSentioStore.getState().setBleDeviceId(connected.id);

      console.log(`[BLE] ✅ Connected to ${DEVICE_NAME}`);

      // ── Listen for data on TX characteristic (Goggles → App) ──
      // Expects: "CRASH", "GFORCE:X.XX", or other telemetry strings
      connected.monitorCharacteristicForService(
        SERVICE_UUID,
        TX_CHAR_UUID,
        (_error: BleError | null, characteristic: Characteristic | null) => {
          if (_error) {
            console.warn('[BLE] Monitor error:', _error.message);
            return;
          }
          if (characteristic?.value) {
            const decoded = fromBase64(characteristic.value).trim();
            console.log(`[BLE] ← from goggles: "${decoded}"`);

            // Parse CRASH signal
            if (decoded === 'CRASH') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              useSentioStore.getState().setEmergency(true);
            }

            // Parse G-Force value: "GFORCE:2.35"
            if (decoded.startsWith('GFORCE:')) {
              const gVal = parseFloat(decoded.replace('GFORCE:', ''));
              if (!isNaN(gVal)) {
                useSentioStore.getState().updateTelemetry({ gForce: gVal });
              }
            }
          }
        }
      );

      // ── Send SPD:XX every 1 second from real GPS data ──
      speedIntervalRef.current = setInterval(async () => {
        try {
          const speed = useSentioStore.getState().telemetry.speed;
          const payload = toBase64(`SPD:${speed}`);
          await ble.writeCharacteristicWithResponseForDevice(
            connected.id,
            SERVICE_UUID,
            RX_CHAR_UUID,
            payload
          );
        } catch {
          // Silently ignore write failures
        }
      }, 1000);

      // ── Detect disconnection ──
      ble.onDeviceDisconnected(connected.id, () => {
        console.log('[BLE] ⚠️ Device disconnected');
        useSentioStore.getState().setBleConnected(false);
        useSentioStore.getState().setBleDeviceId(null);
        if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
        deviceRef.current = null;
        // Auto-reconnect after 3 seconds
        setTimeout(() => scanForDevices(), 3000);
      });
    } catch (err) {
      console.error('[BLE] Connection failed:', err);
      useSentioStore.getState().setBleConnected(false);
    }
  }, []);

  // ── Scan for Sentio HUD ──
  const scanForDevices = useCallback(async () => {
    if (isScanning) return;

    const hasPermission = await requestBlePermissions();
    if (!hasPermission) {
      console.warn('[BLE] Bluetooth permissions denied');
      return;
    }

    const ble = getManager();
    setIsScanning(true);
    console.log(`[BLE] 🔍 Scanning for ${DEVICE_NAME}...`);

    ble.startDeviceScan(null, null, (error, scannedDevice) => {
      if (error) {
        console.warn('[BLE] Scan error:', error.message);
        setIsScanning(false);
        return;
      }

      if (scannedDevice?.name === DEVICE_NAME) {
        ble.stopDeviceScan();
        setIsScanning(false);
        connectAndListen(scannedDevice);
      }
    });

    // Stop scan after 15 seconds if nothing found
    setTimeout(() => {
      ble.stopDeviceScan();
      setIsScanning(false);
    }, 15000);
  }, [isScanning, connectAndListen]);

  // ── Send generic payload to ESP32 (Emoji, Crash, etc) ──
  const sendPayload = useCallback(async (text: string) => {
    if (!deviceRef.current) return;
    try {
      const payload = toBase64(text);
      await getManager().writeCharacteristicWithResponseForDevice(
        deviceRef.current.id,
        SERVICE_UUID,
        RX_CHAR_UUID,
        payload
      );
      console.log(`[BLE] → sent to goggles: "${text}"`);
    } catch (err) {
      console.warn('[BLE] Failed to send payload:', err);
    }
  }, []);

  // ── Auto-scan + GPS on mount ──
  useEffect(() => {
    startGPSTracking();
    scanForDevices();

    return () => {
      const ble = getManager();
      ble.stopDeviceScan();
      if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
      if (locationSubRef.current) locationSubRef.current.remove();
      if (deviceRef.current) {
        ble.cancelDeviceConnection(deviceRef.current.id);
      }
    };
  }, []);

  return { scanForDevices, isScanning, sendPayload };
}
