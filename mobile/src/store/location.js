import { create } from 'zustand';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'eqosy_user_location'; // web: readEqosyLocation()

// Current user location shown in the header ("Dewas, Dewas" + street/coordinates).
export const useLocationStore = create((set, get) => ({
  loading: false,
  coords: null, // { latitude, longitude }
  title: '',
  subtitle: '',

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set(JSON.parse(raw));
    } catch {}
  },

  refresh: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') return;
      let pos = null;
      try {
        pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } catch {
        pos = await Location.getLastKnownPositionAsync().catch(() => null); // GPS off / no fix
      }
      if (!pos) return;
      const { latitude, longitude } = pos.coords;
      let title = '';
      let subtitle = '';
      try {
        const [a] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (a) {
          const city = a.city || a.subregion || a.district || '';
          title = [a.district || a.subregion || city, a.city || a.region].filter(Boolean).join(', ');
          subtitle = [a.name, a.street, a.postalCode].filter(Boolean).join(', ');
        }
      } catch {}
      if (!title) title = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      const next = { coords: { latitude, longitude }, title, subtitle };
      set(next);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
    } catch {
      // location unavailable: keep the saved one
    } finally {
      set({ loading: false });
    }
  },
}));
