import { API_BASE_URL } from '../config';
import { createClient } from './http';

// Taxi API: <origin>/api/v1/taxi. Public routes never get a token (same rule as the web app).
const PUBLIC_USER_ROUTE =
  /^\/users\/(app-modules|goods-types|vehicle-types|register|signup|login|profile-image|auth\/send-otp|auth\/verify-otp|otp-login)(\/|$)/;

const api = createClient({
  baseURL: API_BASE_URL,
  pickToken: (s) => s.token,
  isPublic: (path) => PUBLIC_USER_ROUTE.test(path),
});

export default api;
