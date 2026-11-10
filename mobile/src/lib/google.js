// Google Maps web-service calls (Places, Geocoding, Directions) over plain HTTPS.
import { GOOGLE_MAPS_API_KEY } from '../config';
import { decodePolyline, estimateMinutes, haversineMeters } from './geo';

const BASE = 'https://maps.googleapis.com/maps/api';

const getJson = async (url) => {
  const res = await fetch(url);
  return res.json();
};

export const hasMapsKey = () => Boolean(GOOGLE_MAPS_API_KEY);

export const autocomplete = async (input, { lat, lng } = {}) => {
  if (!hasMapsKey() || !String(input || '').trim()) return [];
  const loc = lat != null && lng != null ? `&location=${lat},${lng}&radius=50000` : '';
  const data = await getJson(
    `${BASE}/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:in${loc}&key=${GOOGLE_MAPS_API_KEY}`,
  );
  return (data.predictions || []).map((p) => ({
    placeId: p.place_id,
    title: p.structured_formatting?.main_text || p.description,
    address: p.description,
  }));
};

// -> { title, address, coords: [lng, lat] }
export const placeDetails = async (placeId, fallbackTitle = '') => {
  const data = await getJson(
    `${BASE}/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${GOOGLE_MAPS_API_KEY}`,
  );
  const r = data.result;
  if (!r?.geometry?.location) return null;
  return {
    title: r.name || fallbackTitle,
    address: r.formatted_address || fallbackTitle,
    coords: [r.geometry.location.lng, r.geometry.location.lat],
  };
};

export const reverseGeocode = async (lat, lng) => {
  if (!hasMapsKey()) return '';
  const data = await getJson(`${BASE}/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`);
  return data.results?.[0]?.formatted_address || '';
};

// Real driving route; falls back to straight-line estimate when there is no key / no route.
export const getRoute = async (fromCoords, toCoords) => {
  const fallback = () => {
    const distanceMeters = haversineMeters(fromCoords, toCoords);
    return { distanceMeters, durationMinutes: estimateMinutes(distanceMeters), path: [] };
  };
  if (!hasMapsKey()) return fallback();
  try {
    const data = await getJson(
      `${BASE}/directions/json?origin=${fromCoords[1]},${fromCoords[0]}&destination=${toCoords[1]},${toCoords[0]}&key=${GOOGLE_MAPS_API_KEY}`,
    );
    const route = data.routes?.[0];
    const leg = route?.legs?.[0];
    if (!leg) return fallback();
    return {
      distanceMeters: Number(leg.distance?.value || 0),
      durationMinutes: Math.max(1, Math.round(Number(leg.duration?.value || 0) / 60)),
      path: decodePolyline(route.overview_polyline?.points || ''),
    };
  } catch {
    return fallback();
  }
};
