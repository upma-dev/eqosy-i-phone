import { create } from 'zustand';
import { restaurantApi, body } from './api';

// Restaurant profile + "accepting orders" state shared by the screens.
export const useRestaurant = create((set) => ({
  restaurant: null,
  accepting: true,
  setAccepting: (accepting) => set({ accepting }),
  setRestaurant: (restaurant) => set({ restaurant }),
  refresh: async () => {
    try {
      const d = body(await restaurantApi.current());
      const restaurant = d.restaurant || d;
      set({ restaurant, accepting: restaurant?.isAcceptingOrders !== false });
      return restaurant;
    } catch {
      return null;
    }
  },
}));
