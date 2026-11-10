import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VERTICALS } from '../theme';

const KEY = 'eqosy_active_vertical'; // web: eqosy_active_module

// Which part of the super app the user is in: food | taxi | grocery.
export const useVertical = create((set) => ({
  active: 'food',
  ready: false,

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(KEY);
      set({ active: VERTICALS.includes(saved) ? saved : 'food', ready: true });
    } catch {
      set({ ready: true });
    }
  },

  setActive: (id) => {
    if (!VERTICALS.includes(id)) return;
    set({ active: id });
    AsyncStorage.setItem(KEY, id).catch(() => {});
  },
}));
