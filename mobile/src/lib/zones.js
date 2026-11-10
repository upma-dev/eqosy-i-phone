import api from '../api/client';

const unwrapZones = (response) => {
  const payload = response?.data?.data || response?.data || response;
  return payload?.results || payload?.zones || (Array.isArray(payload) ? payload : []);
};

export const getZoneServiceLocationId = (zone) =>
  zone?.service_location_id?._id ||
  zone?.service_location_id?.id ||
  zone?.service_location_id ||
  zone?.service_location?._id ||
  zone?.service_location?.id ||
  zone?.service_location ||
  zone?._id ||
  zone?.id ||
  '';

const isZoneActive = (zone) => zone?.active !== false && Number(zone?.status ?? 1) !== 0;

const toPoint = (p) => {
  if (Array.isArray(p) && p.length >= 2) {
    const lng = Number(p[0]);
    const lat = Number(p[1]);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  if (p && typeof p === 'object') {
    const lat = Number(p.lat ?? p.latitude);
    const lng = Number(p.lng ?? p.longitude ?? p.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  return null;
};

const zonePath = (zone) => {
  let source = zone?.geometry?.coordinates || zone?.coordinates;
  if (Array.isArray(source?.[0]) && Array.isArray(source?.[0]?.[0])) source = source[0];
  return Array.isArray(source) ? source.map(toPoint).filter(Boolean) : [];
};

const inCircle = (point, zone) => {
  if (zone?.boundary_mode !== 'circle' || zone?.circle_center?.lat == null || zone?.circle_center?.lng == null) {
    return false;
  }
  const cLat = Number(zone.circle_center.lat);
  const cLng = Number(zone.circle_center.lng);
  const radius = Number(zone.circle_radius_meters || 5000);
  const R = 6371000;
  const dLat = ((point.lat - cLat) * Math.PI) / 180;
  const dLng = ((point.lng - cLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((cLat * Math.PI) / 180) * Math.cos((point.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= radius;
};

const inPolygon = (point, polygon) => {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    const hit =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (hit) inside = !inside;
  }
  return inside;
};

export const fetchActiveRideZones = async () => unwrapZones(await api.get('/admin/zones')).filter(isZoneActive);

// coords = [lng, lat]. Returns the service-location id of the zone containing the point.
export const resolveServiceLocationId = (coords, zones = []) => {
  if (!Array.isArray(coords) || coords.length !== 2) {
    return zones.length ? String(getZoneServiceLocationId(zones[0]) || '') : '';
  }
  const point = { lat: Number(coords[1]), lng: Number(coords[0]) };
  for (const zone of zones) {
    if (inCircle(point, zone) || inPolygon(point, zonePath(zone))) {
      const id = getZoneServiceLocationId(zone);
      if (id) return String(id);
    }
  }
  return '';
};
