import { create } from 'zustand';
import { driverApi, pick } from './api';

// Driver profile + duty state shared by the screens.
export const useDriver = create((set) => ({
  driver: null,
  isOnline: false,
  setOnline: (isOnline) => set({ isOnline }),
  setDriver: (driver) => set({ driver, isOnline: Boolean(driver?.isOnline) }),
  refresh: async () => {
    try {
      const d = pick(await driverApi.me());
      const driver = d?.driver || d;
      set({ driver, isOnline: Boolean(driver?.isOnline) });
      return driver;
    } catch {
      return null;
    }
  },
}));
