// Live backend. Override with EXPO_PUBLIC_API_ORIGIN in mobile/.env if needed
// (on a real phone use your PC's LAN IP, never "localhost").
const ORIGIN = (process.env.EXPO_PUBLIC_API_ORIGIN || 'https://eqosy.com').replace(/\/+$/, '');

export const BACKEND_ORIGIN = ORIGIN;
// Same paths as the web app.
export const API_ROOT = `${ORIGIN}/api/v1`; //        Food + auth: <origin>/api/v1/food/..., /auth/...
export const API_BASE_URL = `${ORIGIN}/api/v1/taxi`; // Taxi:      <origin>/api/v1/taxi/users/...
export const FOOD_API_BASE_URL = API_ROOT;
export const SOCKET_ORIGIN = ORIGIN;
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const resolveAssetUrl = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:|data:image\/)/i.test(raw)) return raw;
  return `${BACKEND_ORIGIN}/${raw.replace(/^\/+/, '')}`;
};
