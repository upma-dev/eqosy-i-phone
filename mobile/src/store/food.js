import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAV_KEY = 'eqosy_food_favorites';

// Food-side UI state (web: vegMode in Home.jsx, favorites in ProfileContext).
export const useFood = create((set, get) => ({
  vegMode: false,
  setVegMode: (vegMode) => set({ vegMode }),

  favorites: [],
  loadFavorites: async () => {
    try {
      const raw = await AsyncStorage.getItem(FAV_KEY);
      if (raw) set({ favorites: JSON.parse(raw) });
    } catch {}
  },
  toggleFavorite: (key) => {
    const cur = get().favorites;
    const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
    set({ favorites: next });
    AsyncStorage.setItem(FAV_KEY, JSON.stringify(next)).catch(() => {});
  },
}));
