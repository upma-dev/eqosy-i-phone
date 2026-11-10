import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { foodService, dataOf } from '../api/foodServices';

// Web useZone(): detect the delivery zone for the user's coordinates.
// status: 'loading' | 'IN_SERVICE' | 'OUT_OF_SERVICE'
let lastKey = null;
export const useZone = create((set) => ({
  zoneId: null,
  zone: null,
  status: 'loading',

  load: async () => {
    try {
      const id = await AsyncStorage.getItem('userZoneId');
      if (id) set({ zoneId: id });
    } catch {}
  },

  detect: async (lat, lng) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (key === lastKey) return;
    lastKey = key;
    try {
      const body = await foodService.detectZone(lat, lng);
      const data = dataOf(body)?.data ?? dataOf(body);
      if (data?.status === 'IN_SERVICE' && data.zoneId) {
        set({ zoneId: String(data.zoneId), zone: data.zone || null, status: 'IN_SERVICE' });
        AsyncStorage.setItem('userZoneId', String(data.zoneId)).catch(() => {});
      } else {
        set({ zoneId: null, zone: null, status: 'OUT_OF_SERVICE' });
        AsyncStorage.removeItem('userZoneId').catch(() => {});
      }
    } catch {
      lastKey = null; // allow retry
      set({ status: 'loading' });
    }
  },
}));
