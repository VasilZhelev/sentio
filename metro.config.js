const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Browser preview only: swap native-only modules (Mapbox, BLE) for stubs on web.
// Native iOS/Android builds are unaffected.
const webStubs = {
  '@rnmapbox/maps': path.resolve(__dirname, 'scripts/web-preview/rnmapbox.js'),
  'react-native-ble-plx': path.resolve(__dirname, 'scripts/web-preview/ble-plx.js'),
};

const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && webStubs[moduleName]) {
    return { type: 'sourceFile', filePath: webStubs[moduleName] };
  }
  return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
