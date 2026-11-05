import { useEffect, useState, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device, BleError, Characteristic, State } from 'react-native-ble-plx';
import { useSentioStore } from '../store/useSentioStore';
import * as Haptics from 'expo-haptics';

// ─── Nordic UART Service (NUS) — matches ESP32 firmware ──────────────────────
const SENTIO_DEVICE_NAME    = 'Sentio_Glasses';
const NUS_SERVICE_UUID      = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const NUS_TX_CHARACTERISTIC = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'; // Notify: ESP32 → App
const NUS_RX_CHARACTERISTIC = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E'; // Write:  App → ESP32

export type DiscoveredBleDevice = {
  id: string;
  name: string;
  rssi: number | null;
};

// ─── Base64 helpers ───────────────────────────────────────────────────────────
function toBase64(str: string): string {
  try { return btoa(unescape(encodeURIComponent(str))); }
  catch { try { return btoa(str); } catch { return ''; } }
}
function fromBase64(b64: string): string {
  try { return decodeURIComponent(escape(atob(b64))); }
  catch { try { return atob(b64); } catch { return ''; } }
}

function deviceLabel(device: Device): string {
  return device.name ?? device.localName ?? 'Unknown device';
}

function isSentioGlasses(device: Device): boolean {
  const names = [device.name, device.localName]
    .filter(Boolean)
    .map(n => n!.toLowerCase());

  const nameMatch = names.some(
    n => n === SENTIO_DEVICE_NAME.toLowerCase()
      || (n.includes('sentio') && n.includes('glasses'))
  );

  const uuidMatch = (device.serviceUUIDs ?? []).some(
    uuid => uuid.toUpperCase() === NUS_SERVICE_UUID.toUpperCase()
  );

  return nameMatch || uuidMatch;
}

// ─── Android BLE Permissions ──────────────────────────────────────────────────
async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const permissions: string[] = [
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ];

  if (Platform.Version >= 31) {
    permissions.push(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    );
  }

  const granted = await PermissionsAndroid.requestMultiple(permissions);
  const results = Object.values(granted);
  const allGranted = results.every(v => v === PermissionsAndroid.RESULTS.GRANTED);

  if (!allGranted) {
    console.warn('[BLE] Some permissions denied:', granted);
    if (Platform.Version >= 31) {
      const scanOk = granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN]
        === PermissionsAndroid.RESULTS.GRANTED;
      const connectOk = granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]
        === PermissionsAndroid.RESULTS.GRANTED;
      return scanOk && connectOk;
    }
    return granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]
      === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE-LEVEL SINGLETONS — idempotent across multiple hook invocations
// ─────────────────────────────────────────────────────────────────────────────
let _manager:       BleManager | null = null;
let _device:        Device | null = null;
let _isScanning:    boolean = false;
let _scanLock:      boolean = false;
let _connecting:    boolean = false;
let _speedInterval: ReturnType<typeof setInterval> | null = null;
let _timeInterval:  ReturnType<typeof setInterval> | null = null;
let _initialized:   boolean = false;
let _stateListener: boolean = false;
let _scanTimeout:   ReturnType<typeof setTimeout> | null = null;

type ScanListener = (scanning: boolean) => void;
const _scanListeners = new Set<ScanListener>();

type DiscoveredListener = (devices: DiscoveredBleDevice[]) => void;
const _discoveredListeners = new Set<DiscoveredListener>();
const _discoveredMap = new Map<string, DiscoveredBleDevice>();

function notifyScanListeners(v: boolean) {
  _isScanning = v;
  _scanListeners.forEach(fn => fn(v));
}

function notifyDiscoveredListeners() {
  const list = Array.from(_discoveredMap.values()).sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999));
  _discoveredListeners.forEach(fn => fn(list));
}

function getManager(): BleManager {
  if (!_manager) _manager = new BleManager();
  return _manager;
}

function clearIntervals() {
  if (_speedInterval) { clearInterval(_speedInterval); _speedInterval = null; }
  if (_timeInterval) { clearInterval(_timeInterval); _timeInterval = null; }
}

function ensureBluetoothStateListener() {
  if (_stateListener) return;
  _stateListener = true;

  getManager().onStateChange((state: State) => {
    const store = useSentioStore.getState();
    if (state === 'PoweredOn') {
      if (!_device && !_scanLock && !_connecting) {
        store.addBleLog('✅ Bluetooth ready — scanning');
        _scanForDevices();
      }
    } else if (state === 'PoweredOff') {
      store.setBleConnected(false);
      store.addBleLog('⏳ Bluetooth off — turn it on');
    }
  }, true);
}

// ─── Write a string to ESP32 RX characteristic (without response per firmware) ─
async function _sendRaw(text: string): Promise<boolean> {
  if (!_device) { console.warn('[BLE] sendRaw: no device'); return false; }
  const ble = getManager();
  const payload = toBase64(text);

  try {
    await ble.writeCharacteristicWithoutResponseForDevice(
      _device.id,
      NUS_SERVICE_UUID,
      NUS_RX_CHARACTERISTIC,
      payload
    );
    console.log(`[BLE → glasses] "${text}"`);
    useSentioStore.getState().addBleLog(`→ ${text}`);
    return true;
  } catch (err) {
    // Fallback for firmware builds that only accept write-with-response
    try {
      await ble.writeCharacteristicWithResponseForDevice(
        _device.id,
        NUS_SERVICE_UUID,
        NUS_RX_CHARACTERISTIC,
        payload
      );
      console.log(`[BLE → glasses] "${text}" (with response)`);
      useSentioStore.getState().addBleLog(`→ ${text}`);
      return true;
    } catch (fallbackErr) {
      console.warn('[BLE] Write failed:', fallbackErr);
      return false;
    }
  }
}

// ─── Safety commands: acknowledged write, retried once ───────────────────────
async function _sendReliable(text: string): Promise<boolean> {
  if (!_device) { console.warn('[BLE] sendReliable: no device'); return false; }
  const payload = toBase64(text);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await getManager().writeCharacteristicWithResponseForDevice(
        _device.id,
        NUS_SERVICE_UUID,
        NUS_RX_CHARACTERISTIC,
        payload
      );
      useSentioStore.getState().addBleLog(`→ ${text}`);
      return true;
    } catch (err) {
      console.warn('[BLE] Reliable write failed:', err);
    }
  }
  useSentioStore.getState().addBleLog(`❌ Not delivered: ${text}`);
  return false;
}

// ─── Handle incoming messages from ESP32 ─────────────────────────────────────
function _handleIncoming(raw: string) {
  const msg = raw.trim();
  const store = useSentioStore.getState();

  // Streams several times a second, so it stays out of the connection log
  if (msg.startsWith('GFORCE:')) {
    const g = parseFloat(msg.replace('GFORCE:', ''));
    if (!isNaN(g)) store.updateTelemetry({ gForce: g });
    return;
  }

  console.log(`[BLE ← glasses] "${msg}"`);
  store.addBleLog(`← ${msg}`);

  if (msg === 'CRASH_ALERT') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    store.triggerCrash();
    // Keep the HUD countdown in step with the one set in the app
    _sendReliable(`CDN:${store.sosCountdownSeconds}`);
  }
  if (msg === 'TRIGGER_SOS' && store.crashStatus !== 'SENT') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    store.finishCrash();
  }
  if (msg.startsWith('BAT:')) {
    const b = parseInt(msg.replace('BAT:', ''), 10);
    if (!isNaN(b)) store.setGlassesBattery(b);
  }
}

function _stopScan() {
  const ble = getManager();
  try { ble.stopDeviceScan(); } catch { /* ignore */ }
  notifyScanListeners(false);
  if (_scanTimeout) {
    clearTimeout(_scanTimeout);
    _scanTimeout = null;
  }
}

// ─── Connect to a discovered device & subscribe ───────────────────────────────
async function _connectAndListen(deviceOrId: Device | string) {
  if (_connecting || _device) return;
  _connecting = true;
  _stopScan();
  _scanLock = false;

  const ble = getManager();
  const deviceId = typeof deviceOrId === 'string' ? deviceOrId : deviceOrId.id;
  const label = typeof deviceOrId === 'string'
    ? (_discoveredMap.get(deviceId)?.name ?? deviceId)
    : deviceLabel(deviceOrId);

  try {
    useSentioStore.getState().addBleLog(`🔗 Connecting to ${label}...`);

    const connected = await ble.connectToDevice(deviceId, {
      autoConnect: false,
      timeout: 20000,
    });
    _device = connected;

    await connected.discoverAllServicesAndCharacteristics();

    // MTU negotiation is optional — don't fail the connection if it errors
    try {
      await connected.requestMTU(512);
    } catch {
      console.log('[BLE] MTU 512 not negotiated — continuing');
    }

    const store = useSentioStore.getState();
    store.setBleConnected(true);
    store.setBleDeviceId(connected.id);
    store.addBleLog(`✅ Connected to ${label}`);
    console.log(`[BLE] ✅ Connected to ${label} (${connected.id})`);

    connected.monitorCharacteristicForService(
      NUS_SERVICE_UUID,
      NUS_TX_CHARACTERISTIC,
      (_err: BleError | null, char: Characteristic | null) => {
        if (_err) {
          if ((_err as any).errorCode !== 205) {
            console.warn('[BLE] Monitor error:', _err.message);
          }
          return;
        }
        if (char?.value) _handleIncoming(fromBase64(char.value));
      }
    );

    if (_speedInterval) clearInterval(_speedInterval);
    _speedInterval = setInterval(() => {
      const spd = Math.round(useSentioStore.getState().telemetry.speed);
      _sendRaw(`SPD:${spd}`);
    }, 1000);

    const sendTime = () => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      _sendRaw(`TIM:${timeStr}`);
    };
    if (_timeInterval) clearInterval(_timeInterval);
    _timeInterval = setInterval(sendTime, 60000);
    setTimeout(sendTime, 1000);

    ble.onDeviceDisconnected(connected.id, () => {
      console.log('[BLE] ⚠️ Disconnected');
      const s = useSentioStore.getState();
      s.setBleConnected(false);
      s.setBleDeviceId(null);
      s.addBleLog('⚠️ Disconnected — retrying in 3s');
      _device = null;
      _connecting = false;
      clearIntervals();
      setTimeout(() => _scanForDevices(), 3000);
    });

  } catch (err: any) {
    console.error('[BLE] Connection failed:', err?.message ?? err);
    useSentioStore.getState().setBleConnected(false);
    useSentioStore.getState().addBleLog(`❌ Connect failed: ${err?.message ?? 'unknown'}`);
    _device = null;
    try { await ble.cancelDeviceConnection(deviceId); } catch { /* ignore */ }
    setTimeout(() => _scanForDevices(), 5000);
  } finally {
    _connecting = false;
  }
}

// ─── Scan for Sentio_Glasses ──────────────────────────────────────────────────
async function _scanForDevices() {
  if (_device || _scanLock || _connecting) return;
  _scanLock = true;

  try {
    ensureBluetoothStateListener();

    const hasPermission = await requestBlePermissions();
    if (!hasPermission) {
      useSentioStore.getState().addBleLog('❌ Bluetooth permissions denied — check app settings');
      _scanLock = false;
      return;
    }

    const ble = getManager();
    _stopScan();
    await new Promise(r => setTimeout(r, 300));

    if (_device) {
      _scanLock = false;
      return;
    }

    const state = await ble.state();
    if (state !== 'PoweredOn') {
      _scanLock = false;
      if (state === 'Unauthorized') {
        // iOS: user denied Bluetooth access — the onStateChange listener resumes once it's granted
        useSentioStore.getState().addBleLog('❌ Bluetooth access denied — enable it in Settings › Sentio');
      } else if (state === 'Unknown' || state === 'Resetting') {
        // iOS reports Unknown for a moment after BleManager is created (and while the permission prompt is open)
        console.log('[BLE] State', state, '— retrying shortly');
        setTimeout(() => _scanForDevices(), 1000);
      } else {
        useSentioStore.getState().addBleLog('⏳ Bluetooth off — waiting...');
        console.log('[BLE] Waiting for PoweredOn...');
      }
      return;
    }

    _discoveredMap.clear();
    notifyDiscoveredListeners();

    notifyScanListeners(true);
    useSentioStore.getState().addBleLog(`🔍 Scanning for "${SENTIO_DEVICE_NAME}"...`);
    console.log(`[BLE] 🔍 Scanning for "${SENTIO_DEVICE_NAME}"...`);

    const scanOptions = Platform.OS === 'android'
      ? { allowDuplicates: true }
      : { allowDuplicates: false };

    const onDeviceFound = (error: BleError | null, scannedDevice: Device | null) => {
      if (error) {
        console.warn('[BLE] Scan error:', error.message, 'code:', (error as any).errorCode);
        useSentioStore.getState().addBleLog(`❌ Scan error: ${error.message}`);
        _stopScan();
        _scanLock = false;
        setTimeout(() => _scanForDevices(), 3000);
        return;
      }

      if (!scannedDevice) return;

      const label = deviceLabel(scannedDevice);
      const prev = _discoveredMap.get(scannedDevice.id);
      if (!prev || prev.rssi !== scannedDevice.rssi) {
        _discoveredMap.set(scannedDevice.id, {
          id: scannedDevice.id,
          name: label,
          rssi: scannedDevice.rssi,
        });
        notifyDiscoveredListeners();
      }

      if (scannedDevice.name || scannedDevice.localName) {
        console.log(`[BLE] 📶 "${label}" (${scannedDevice.id}) RSSI=${scannedDevice.rssi}`);
      }

      if (isSentioGlasses(scannedDevice)) {
        _stopScan();
        _scanLock = false;
        useSentioStore.getState().addBleLog(`📡 Found ${label} — connecting...`);
        _connectAndListen(scannedDevice);
      }
    };

    // Broad scan — matches by device name (Sentio_Glasses) or NUS service UUID
    ble.startDeviceScan(null, scanOptions, onDeviceFound);

    _scanTimeout = setTimeout(() => {
      if (_isScanning && !_device && !_connecting) {
        _stopScan();
        _scanLock = false;
        useSentioStore.getState().addBleLog('⏱ Scan timed out — retrying in 5s...');
        setTimeout(() => _scanForDevices(), 5000);
      }
    }, 30000);

  } catch (err: any) {
    console.warn('[BLE] scanForDevices exception:', err?.message ?? err);
    _stopScan();
    _scanLock = false;
    setTimeout(() => _scanForDevices(), 5000);
  }
}

async function _connectById(deviceId: string) {
  if (_device || _connecting) return;
  _scanLock = false;
  await _connectAndListen(deviceId);
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — safe to call from multiple components
// ─────────────────────────────────────────────────────────────────────────────
export function useSmartGlassesBLE() {
  const [isScanning, setIsScanning] = useState(_isScanning);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredBleDevice[]>(
    Array.from(_discoveredMap.values())
  );

  useEffect(() => {
    _scanListeners.add(setIsScanning);
    _discoveredListeners.add(setDiscoveredDevices);
    return () => {
      _scanListeners.delete(setIsScanning);
      _discoveredListeners.delete(setDiscoveredDevices);
    };
  }, []);

  useEffect(() => {
    if (!_initialized) {
      _initialized = true;
      _scanForDevices();
    }
  }, []);

  const sendCancel          = useCallback(() => _sendReliable('CANCEL'), []);
  const sendSos             = useCallback(() => _sendReliable('SOS'), []);
  const sendMessage         = useCallback((text: string, from?: string) => {
    useSentioStore.getState().setNotification(from ? `${from}: ${text}` : text);
    // "|" separates the sender from the text on the HUD
    const body = text.replace(/\|/g, ' ');
    return _sendRaw(from ? `MSG:${from}|${body}` : `MSG:${body}`);
  }, []);
  const sendCommandToDisplay = useCallback((jsonData: string) => _sendRaw(jsonData), []);
  const sendBatteryLevel     = useCallback((level: number) => _sendRaw(`BAT:${Math.max(0, Math.min(100, Math.round(level)))}`), []);
  const scanForDevices       = useCallback(() => {
    _scanLock = false;
    _connecting = false;
    return _scanForDevices();
  }, []);
  const connectToDevice      = useCallback((deviceId: string) => _connectById(deviceId), []);

  return {
    isScanning,
    discoveredDevices,
    scanForDevices,
    connectToDevice,
    sendCancel,
    sendSos,
    sendMessage,
    sendBatteryLevel,
    sendCommandToDisplay,
  };
}
