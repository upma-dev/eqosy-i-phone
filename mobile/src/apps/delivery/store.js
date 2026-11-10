import { create } from 'zustand';
import { deliveryApi, body } from './api';

// Delivery partner profile + duty + current order shared by the screens.
export const useDelivery = create((set) => ({
  partner: null,
  isOnline: false,
  activeOrder: null,
  setOnline: (isOnline) => set({ isOnline }),
  setActiveOrder: (activeOrder) => set({ activeOrder }),
  setPartner: (partner) => set({ partner }),
  refresh: async () => {
    try {
      const d = body(await deliveryApi.me());
      const partner = d.user || d.profile || d;
      set({ partner, isOnline: ['online', 'available'].includes(String(partner?.availabilityStatus || partner?.status || '').toLowerCase()) || partner?.isOnline === true });
      return partner;
    } catch {
      return null;
    }
  },
}));

// ---- order helpers (payload from socket or /orders/current) --------------------------------
export const orderKey = (o) => String(o?.orderMongoId || o?._id || o?.orderId || o?.id || '');
export const orderLabel = (o) => String(o?.displayOrderId || o?.order_id || o?.orderId || '').slice(-8);

const loc = (l) => {
  if (!l) return null;
  if (Array.isArray(l.coordinates) && l.coordinates.length >= 2) return { lat: l.coordinates[1], lng: l.coordinates[0] };
  const lat = l.latitude ?? l.lat;
  const lng = l.longitude ?? l.lng;
  return lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : null;
};
export const restaurantPoint = (o) => loc(o?.restaurantLocation) || loc(o?.restaurantId?.location);
export const customerPoint = (o) => loc(o?.deliveryAddress?.location) || loc(o?.deliveryAddress) || loc(o?.customerLocation);

// Trip phase, same rules as web store deriveTripStatusFromOrder.
export function tripPhase(o) {
  if (!o) return 'IDLE';
  const s = String(o.deliveryStatus || o.orderState?.status || o.orderStatus || o.status || '').toLowerCase();
  const ds = String(o.deliveryState?.status || '').toLowerCase();
  const phase = o.deliveryState?.currentPhase;
  if (['delivered', 'completed'].includes(s) || ['delivered', 'completed'].includes(ds)) return 'COMPLETED';
  if (phase === 'at_drop' || s === 'reached_drop' || ds === 'reached_drop') return 'REACHED_DROP';
  if (phase === 'en_route_to_delivery' || ['picked_up', 'delivering', 'out_for_delivery'].includes(s) || ['picked_up', 'delivering', 'out_for_delivery'].includes(ds)) return 'PICKED_UP';
  if (phase === 'at_pickup' || s === 'reached_pickup' || ds === 'reached_pickup') return 'REACHED_PICKUP';
  return 'PICKING_UP';
}
