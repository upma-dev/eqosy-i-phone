import axios from 'axios';
import { API_ROOT } from '../config';
import { useAuth } from '../store/auth';

// Auth / config / content endpoints: a 401 here must not log the user out (same rule as the web app).
const AUTH_OR_PUBLIC =
  /\/(auth\/|login|verify-otp|send-otp|otp-login|signup|register|onboarding|forgot-password|pages|pages-content|config\/|terms|privacy|public)/i;

// ---- one shared refresh at a time -------------------------------------------------------------
let refreshing = null;

async function refreshSession() {
  const { refreshToken, token, foodToken } = useAuth.getState();
  if (!refreshToken) throw new Error('no refresh token');
  const sharedSession = !token || token === foodToken; // Taxi and Food use the same token

  const { data } = await axios.post(
    `${API_ROOT}/food/auth/refresh-token`,
    { refreshToken },
    { timeout: 10000 },
  );
  const fresh = data?.data?.accessToken || data?.accessToken;
  if (!fresh) throw new Error('refresh failed');
  await useAuth.getState().setTokens({
    foodToken: fresh,
    ...(sharedSession ? { token: fresh } : {}),
    refreshToken: data?.data?.refreshToken || data?.refreshToken || undefined,
  });
  return fresh;
}

const refreshOnce = () => {
  if (!refreshing) refreshing = refreshSession().finally(() => { refreshing = null; });
  return refreshing;
};

const readableError = (error) => {
  if (error.response) {
    const body = error.response.data && typeof error.response.data === 'object' ? error.response.data : {};
    const msg = String(body.message || body.error || '');
    return { ...body, message: msg || 'Something went wrong. Please try again.', status: error.response.status };
  }
  const offline = error.code === 'ERR_NETWORK' || error.message === 'Network Error';
  return {
    message: offline ? 'No internet connection. Please check and try again.' : 'Request timed out. Please try again.',
    code: error.code,
    offline,
  };
};

/**
 * Builds an axios client for one backend base URL.
 *  - resolves with the response body, rejects with { message, status, ... } (same as the web helpers)
 *  - attaches the Bearer token chosen by `pickToken`
 *  - on 401: refreshes the session once and retries, otherwise signs out
 *  - `isPublic(path)` lets a client skip the token for public routes
 */
export function createClient({ baseURL, pickToken, isPublic = () => false }) {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const path = String(config.url || '').split('?')[0];
    if (!isPublic(path) && !config.headers?.Authorization) {
      const token = pickToken(useAuth.getState());
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    // React Native sets the multipart boundary itself.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const original = error.config;
      const status = error.response?.status;
      const msg = String(error.response?.data?.message || error.response?.data?.error || '');
      const tokenDead =
        status === 401 ||
        /authorization token (has expired|is invalid|is required)|jwt expired|no longer exists/i.test(msg);
      const url = String(original?.url || '');

      if (tokenDead && original && !original._retry && !AUTH_OR_PUBLIC.test(url) && useAuth.getState().token) {
        original._retry = true;
        try {
          const fresh = await refreshOnce();
          original.headers = { ...(original.headers || {}), Authorization: `Bearer ${fresh}` };
          return client(original);
        } catch {
          useAuth.getState().signOut();
        }
      } else if (tokenDead && !AUTH_OR_PUBLIC.test(url) && useAuth.getState().token) {
        useAuth.getState().signOut();
      }
      return Promise.reject(readableError(error));
    },
  );

  return client;
}
