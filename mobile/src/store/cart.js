import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildCartLineId } from '../lib/menu';

const KEY = 'eqosy_food_cart';
let loadedOnce = false;

// Port of web Food/context/CartContext.jsx: one cart, one restaurant at a time, lines keyed by item+variant.
const persist = (items) => AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {});

export const useCart = create((set, get) => ({
  items: [],

  load: async () => {
    if (loadedOnce) return; // later calls would overwrite newer in-memory changes with older storage
    loadedOnce = true;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set({ items: JSON.parse(raw) });
    } catch {}
  },

  // item: menu item, restaurant: { id, name }, variant: optional { id, name, price }
  add: (item, restaurant, variant = null, quantity = 1) => {
    const lineItemId = buildCartLineId(item.id, variant?.id);
    const cur = get().items;
    const existing = cur.find((l) => l.lineItemId === lineItemId);
    const next = existing
      ? cur.map((l) => (l.lineItemId === lineItemId ? { ...l, quantity: l.quantity + quantity } : l))
      : [
          ...cur,
          {
            id: lineItemId,
            lineItemId,
            itemId: String(item.id),
            name: item.name,
            price: variant ? Number(variant.price) || 0 : Number(item.price) || 0,
            variantId: variant?.id || '',
            variantName: variant?.name || '',
            quantity,
            image: item.image || '',
            isVeg: item.isVeg !== false,
            restaurant: restaurant.name,
            restaurantId: String(restaurant.id),
          },
        ];
    set({ items: next });
    persist(next);
  },

  setQuantity: (lineItemId, quantity) => {
    const next = quantity <= 0 ? get().items.filter((l) => l.lineItemId !== lineItemId) : get().items.map((l) => (l.lineItemId === lineItemId ? { ...l, quantity } : l));
    set({ items: next });
    persist(next);
  },

  clear: () => { set({ items: [] }); persist([]); },

  restaurantId: () => get().items[0]?.restaurantId || null,
  count: () => get().items.reduce((n, l) => n + l.quantity, 0),
  total: () => get().items.reduce((n, l) => n + l.price * l.quantity, 0),
  qtyOfItem: (itemId) => get().items.filter((l) => l.itemId === String(itemId)).reduce((n, l) => n + l.quantity, 0),
}));
