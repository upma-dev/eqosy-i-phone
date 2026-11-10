import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

// Web keeps two sessions after the unified OTP login:
//   Food session  -> user_accessToken / user_refreshToken
//   Taxi session  -> userToken (+ userInfo)   (same token as Food when the backend sends no taxiAuth)
// Here `token` is the Taxi token (existing screens use it), `foodToken` is the Food one.
const KEYS = {
  token: 'userToken',
  user: 'userInfo',
  foodToken: 'user_accessToken',
  refreshToken: 'user_refreshToken',
};

const save = (key, value) =>
  value ? SecureStore.setItemAsync(key, String(value)) : SecureStore.deleteItemAsync(key).catch(() => {});

export const useAuth = create((set, get) => ({
  ready: false,
  token: null,
  foodToken: null,
  refreshToken: null,
  user: null,

  // Load saved session on app start.
  hydrate: async () => {
    try {
      const [token, userRaw, foodToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(KEYS.token),
        SecureStore.getItemAsync(KEYS.user),
        SecureStore.getItemAsync(KEYS.foodToken),
        SecureStore.getItemAsync(KEYS.refreshToken),
      ]);
      set({
        token: token || null,
        foodToken: foodToken || token || null,
        refreshToken: refreshToken || null,
        user: userRaw ? JSON.parse(userRaw) : null,
        ready: true,
      });
    } catch {
      set({ ready: true });
    }
  },

  // Old call shape signIn(token, user) still works; Food login passes the extra tokens.
  signIn: async (token, user, extra = {}) => {
    const foodToken = extra.foodToken || token;
    const refreshToken = extra.refreshToken || null;
    await Promise.all([
      save(KEYS.token, token),
      save(KEYS.user, JSON.stringify(user || {})),
      save(KEYS.foodToken, foodToken),
      save(KEYS.refreshToken, refreshToken),
    ]);
    set({ token, user, foodToken, refreshToken });
  },

  // Used after a refresh-token call: new access token for both verticals.
  setTokens: async ({ token, foodToken, refreshToken }) => {
    const next = {};
    if (token) next.token = token;
    if (foodToken) next.foodToken = foodToken;
    if (refreshToken) next.refreshToken = refreshToken;
    await Promise.all([
      token ? save(KEYS.token, token) : null,
      foodToken ? save(KEYS.foodToken, foodToken) : null,
      refreshToken ? save(KEYS.refreshToken, refreshToken) : null,
    ]);
    set(next);
  },

  setUser: async (user) => {
    await save(KEYS.user, JSON.stringify(user || {}));
    set({ user });
  },

  signOut: async () => {
    await Promise.all(Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k).catch(() => {})));
    set({ token: null, foodToken: null, refreshToken: null, user: null });
  },

  getToken: () => get().token,
}));
