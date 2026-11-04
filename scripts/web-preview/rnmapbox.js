// Web-preview stub for @rnmapbox/maps.
// Renders a flat Mapbox Static Images snapshot of the same style/camera, with MarkerView
// children projected on top, and fires onDidFinishLoadingStyle so loading overlays clear.
// Pitch/3D is ignored. Native builds never load this file (see metro.config.js).
const React = require('react');
const { View, Image } = require('react-native');

let accessToken = null;

const Camera = () => null;
const MarkerView = ({ children }) => children ?? null;
const Null = () => null;

const STYLE_URLS = {
  Dark: 'mapbox://styles/mapbox/dark-v11',
  Light: 'mapbox://styles/mapbox/light-v11',
  Street: 'mapbox://styles/mapbox/streets-v12',
  Outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  Satellite: 'mapbox://styles/mapbox/satellite-v9',
  SatelliteStreet: 'mapbox://styles/mapbox/satellite-streets-v12',
};

const TILE = 512;
function project([lng, lat], zoom) {
  const scale = TILE * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function MapView({ style, styleURL, children, onDidFinishLoadingStyle, onDidFinishLoadingMap }) {
  const [size, setSize] = React.useState(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      onDidFinishLoadingStyle && onDidFinishLoadingStyle();
      onDidFinishLoadingMap && onDidFinishLoadingMap();
    }, 50);
    return () => clearTimeout(t);
  }, []);

  const items = React.Children.toArray(children);
  const cam = items.find((c) => c && c.type === Camera);
  const camProps = (cam && cam.props) || {};
  const center = camProps.centerCoordinate || [24.6946, 41.6504];
  const zoom = Math.max(0, (camProps.zoomLevel ?? 12) - 1); // static API zoom is for 512px tiles
  const markers = items.filter((c) => c && c.type === MarkerView);

  let uri = null;
  if (size && accessToken) {
    const m = /^mapbox:\/\/styles\/(.+)$/.exec(styleURL || STYLE_URLS.Dark);
    const stylePath = m ? m[1] : 'mapbox/dark-v11';
    const w = Math.min(1280, Math.round(size.width));
    const h = Math.min(1280, Math.round(size.height));
    uri = `https://api.mapbox.com/styles/v1/${stylePath}/static/${center[0]},${center[1]},${zoom.toFixed(2)},0,0/${w}x${h}@2x?attribution=false&logo=false&access_token=${accessToken}`;
  }

  const c = project(center, zoom);
  return React.createElement(
    View,
    {
      style: [{ backgroundColor: '#20242a', overflow: 'hidden' }, style],
      onLayout: (e) => setSize(e.nativeEvent.layout),
    },
    uri && React.createElement(Image, { source: { uri }, style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } }),
    size &&
      markers.map((mk, i) => {
        const p = project(mk.props.coordinate, zoom);
        return React.createElement(
          View,
          {
            key: mk.key || i,
            style: {
              position: 'absolute',
              left: size.width / 2 + (p.x - c.x),
              top: size.height / 2 + (p.y - c.y),
              transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
            },
          },
          mk.props.children
        );
      })
  );
}

const Mapbox = new Proxy(
  {
    MapView,
    Camera,
    MarkerView,
    StyleURL: STYLE_URLS,
    setAccessToken: (t) => { accessToken = t; },
    setTelemetryEnabled: () => {},
  },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === '__esModule') return false;
      return typeof prop === 'string' && /^[A-Z]/.test(prop) ? Null : () => {};
    },
  }
);

module.exports = Mapbox;
module.exports.default = Mapbox;
