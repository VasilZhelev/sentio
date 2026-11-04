// Web-preview stub for react-native-ble-plx (no Bluetooth in the browser preview).
const noopSub = { remove() {} };

const State = {
  Unknown: 'Unknown',
  Resetting: 'Resetting',
  Unsupported: 'Unsupported',
  Unauthorized: 'Unauthorized',
  PoweredOff: 'PoweredOff',
  PoweredOn: 'PoweredOn',
};

class BleManager {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        if (prop === 'state') return async () => State.PoweredOff;
        if (prop === 'then') return undefined;
        if (typeof prop === 'string' && /^on[A-Z]/.test(prop)) return () => noopSub;
        return async () => null;
      },
    });
  }
}

class BleError extends Error {}

module.exports = { BleManager, BleError, State, Device: class {}, Characteristic: class {}, LogLevel: {}, ScanMode: {} };
