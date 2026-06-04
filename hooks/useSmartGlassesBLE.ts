import { useEffect, useRef, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Characteristic, Device, Subscription } from 'react-native-ble-plx';
import { useSentioStore } from '../store/useSentioStore';
import * as Haptics from 'expo-haptics';

// --- Lightweight Base64 Polyfill for pure RN ---
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const btoa = (input: string = '') => {
  let str = input; let output = '';
  for (let block = 0, charCode, i = 0, map = chars; str.charAt(i | 0) || (map = '=', i % 1); output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
    charCode = str.charCodeAt(i += 3/4);
    if (charCode > 0xFF) console.warn("btoa string not ASCII");
    block = block << 8 | charCode;
  }
  return output;
};
const atob = (input: string = '') => {
  let str = input.replace(/=+$/, ''); let output = '';
  if (str.length % 4 == 1) console.warn("atob invalid length");
  for (let bc = 0, bs = 0, buffer, i = 0; buffer = str.charAt(i++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
};

// Use same UUIDs as defined in our Protocol Spec
const SENTIO_DEVICE_NAME = 'SENTIO_GLASSES';
const SENTIO_SERVICE_UUID = '87654321-4321-4321-4321-1234567890AB';
const CRASH_CHARACTERISTIC_UUID = '87654321-4321-4321-4321-1234567890A1';
const GFORCE_CHARACTERISTIC_UUID = '87654321-4321-4321-4321-1234567890A2';
const COMMAND_CHARACTERISTIC_UUID = '87654321-4321-4321-4321-1234567890A3';

const bleManager = new BleManager();

export function useSmartGlassesBLE() {
  const [device, setDevice] = useState<Device | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const { 
    setBleConnected, 
    triggerCrash, 
    updateTelemetry,
    setGlassesBattery,
    bleConnected
  } = useSentioStore();

  const scanSubscription = useRef<Subscription | null>(null);

  useEffect(() => {
    // Attempt auto-connect on mount if not connected
    if (!bleConnected && !isScanning) {
      requestPermissionsAndScan();
    }

    return () => {
      bleManager.stopDeviceScan();
      scanSubscription.current?.remove();
    };
  }, []);

  const requestPermissionsAndScan = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        
        const allGranted = Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (!allGranted) {
          console.warn('BLE permissions not granted');
          return;
        }
      }
      
      scanAndConnect();
    } catch (err) {
      console.warn('Failed to request BLE permissions', err);
    }
  };

  const scanAndConnect = () => {
    // Ensure BLE is PoweredOn before scanning
    bleManager.state().then((state) => {
      if (state === 'PoweredOn') {
        startScanning();
      } else {
        const sub = bleManager.onStateChange((newState) => {
          if (newState === 'PoweredOn') {
            sub.remove();
            startScanning();
          }
        }, true);
      }
    });
  };

  const startScanning = () => {
    if (isScanning) return;
    setIsScanning(true);
    
    bleManager.startDeviceScan(null, null, async (error, scannedDevice) => {
      if (error) {
        console.warn('BLE Scan Error:', error.message);
        setIsScanning(false);
        return;
      }

      // Check if it's our glasses
      if (scannedDevice && scannedDevice.name === SENTIO_DEVICE_NAME) {
        bleManager.stopDeviceScan();
        setIsScanning(false);
        connectToDevice(scannedDevice);
      }
    });
  };

  const connectToDevice = async (d: Device) => {
    try {
      const connectedDevice = await d.connect();
      setDevice(connectedDevice);
      
      const deviceWithServices = await connectedDevice.discoverAllServicesAndCharacteristics();
      
      setBleConnected(true);
      
      // Start listening to the Crash Characteristic (Notify)
      deviceWithServices.monitorCharacteristicForService(
        SENTIO_SERVICE_UUID,
        CRASH_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            // Log it but don't show red screens to user if it's just a disconnect
            console.log('Crash Characteristic Monitor:', error.message);
            return;
          }
          if (characteristic?.value) {
            // Buffer base64 conversion depending on format
            // If the ESP sends "0x01" or "CRASH", trigger:
            console.log('Crash event received from glasses!');
            triggerCrash();
          }
        }
      );

      // Start listening to the G-Force Characteristic (Notify)
      deviceWithServices.monitorCharacteristicForService(
        SENTIO_SERVICE_UUID,
        GFORCE_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.log('Telemetry Characteristic Monitor:', error.message);
            return;
          }
          if (characteristic?.value) {
             try {
               // Decode base64 to string, expecting "1.50,87"
               const decoded = atob(characteristic.value);
               const parts = decoded.split(',');
               if (parts.length >= 2) {
                 const g = parseFloat(parts[0]);
                 const b = parseInt(parts[1], 10);
                 if (!isNaN(g)) updateTelemetry({ gForce: g });
                 if (!isNaN(b)) setGlassesBattery(b);
               }
             } catch (err) {
               console.warn("Failed to parse telemetry:", err);
             }
          }
        }
      );

      // Listen for disconnection
      const sub = bleManager.onDeviceDisconnected(deviceWithServices.id, () => {
        setBleConnected(false);
        setDevice(null);
        scanAndConnect(); // Reconnect loop
      });
      scanSubscription.current = sub;

    } catch (e) {
      console.log('BLE Connection Failed', e);
      setBleConnected(false);
    }
  };

  // Helper function to send commands back to glasses display
  const sendCommandToDisplay = async (jsonData: string) => {
    if (!device || !bleConnected) return;

    try {
      const b64 = btoa(jsonData);
      await device.writeCharacteristicWithResponseForService(
        SENTIO_SERVICE_UUID,
        COMMAND_CHARACTERISTIC_UUID,
        b64
      );
    } catch (e) {
      console.warn('Write error:', e);
    }
  };

  return {
    device,
    isScanning,
    scanAndConnect,
    sendCommandToDisplay
  };
}
