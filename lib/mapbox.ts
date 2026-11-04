// Mapbox token + Static Images helpers. Static images give us real mountain photography
// (satellite, tilted for a 3D feel) for feed posts, stories and profile covers.
export const MAPBOX_TOKEN =
  'pk.eyJ1IjoidmFzaWwtemhlbGV2IiwiYSI6ImNtbXZ5NnFjYTJkOWUyeXIwbmRjd2RkcTAifQ.c0735l2Vej_xd10i6Ol0SQ';

const SATELLITE = 'mapbox/satellite-v9'; // no labels: reads as a photo

type LatLng = { lat: number; lng: number };

/** Google encoded polyline (precision 5), as used by Mapbox path overlays. */
export function encodePolyline(points: LatLng[]) {
  let lastLat = 0;
  let lastLng = 0;
  let out = '';
  const enc = (v: number) => {
    let n = v < 0 ? ~(v << 1) : v << 1;
    let s = '';
    while (n >= 0x20) {
      s += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
      n >>= 5;
    }
    return s + String.fromCharCode(n + 63);
  };
  for (const p of points) {
    const lat = Math.round(p.lat * 1e5);
    const lng = Math.round(p.lng * 1e5);
    out += enc(lat - lastLat) + enc(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }
  return out;
}

type ViewOpts = { zoom?: number; bearing?: number; pitch?: number; width?: number; height?: number; style?: string };

/** A tilted satellite "photo" of a place. */
export function sceneUrl(center: LatLng, { zoom = 14, bearing = 0, pitch = 60, width = 640, height = 400, style = SATELLITE }: ViewOpts = {}) {
  return `https://api.mapbox.com/styles/v1/${style}/static/${center.lng},${center.lat},${zoom},${bearing},${pitch}/${width}x${height}@2x?attribution=false&logo=false&access_token=${MAPBOX_TOKEN}`;
}

/** A run drawn on satellite imagery, auto-framed. */
export function routeUrl(points: LatLng[], { width = 640, height = 360, color = '4FD1FF', style = SATELLITE }: { width?: number; height?: number; color?: string; style?: string } = {}) {
  const line = encodeURIComponent(encodePolyline(points));
  const start = points[0];
  const end = points[points.length - 1];
  const overlays = [
    `path-6+ffffff-0.5(${line})`,
    `path-4+${color}-1(${line})`,
    `pin-s+ffffff(${start.lng},${start.lat})`,
    `pin-s+${color}(${end.lng},${end.lat})`,
  ].join(',');
  return `https://api.mapbox.com/styles/v1/${style}/static/${overlays}/auto/${width}x${height}@2x?padding=48&attribution=false&logo=false&access_token=${MAPBOX_TOKEN}`;
}
