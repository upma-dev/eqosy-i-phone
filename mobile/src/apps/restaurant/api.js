import foodApi from '../../api/foodClient';

// Same endpoints as web services/api/index.js (restaurantAPI) and services/api/auth.js.
const R = '/food/restaurant';
const normalize = (p) => String(p || '').replace(/\D/g, '').slice(-10);

// UI statuses -> backend enum (web restaurantAPI.updateOrderStatus).
const outgoing = (s) => {
  const v = String(s || '').toLowerCase().trim();
  if (v === 'ready') return 'ready_for_pickup';
  if (v === 'out_for_delivery') return 'picked_up';
  if (v === 'cancelled') return 'cancelled_by_restaurant';
  return v;
};

const REASON_CODES = {
  'item not available': 'out_of_stock',
  'outside delivery area': 'outside_service_area',
  'kitchen closing soon': 'restaurant_closed',
  'technical issue': 'technical_issue',
};

export const restaurantApi = {
  requestOtp: (phone) => foodApi.post('/food/auth/restaurant/request-otp', { phone: normalize(phone) }),
  verifyOtp: (phone, otp) =>
    foodApi.post('/food/auth/restaurant/verify-otp', { phone: normalize(phone), otp: String(otp).replace(/\D/g, '').slice(0, 6), platform: 'mobile' }),
  current: () => foodApi.get(`${R}/current`),
  setAccepting: (isAcceptingOrders) => foodApi.patch(`${R}/availability`, { isAcceptingOrders: Boolean(isAcceptingOrders) }),
  orders: (params = {}) => foodApi.get(`${R}/orders`, { params: { limit: 50, page: 1, ...params } }),
  updateStatus: (id, body) => foodApi.patch(`${R}/orders/${id}/status`, { ...body, ...(body.orderStatus ? { orderStatus: outgoing(body.orderStatus) } : {}) }),
  accept: (id, prepMins) => {
    const mins = Math.round(Number(prepMins));
    return restaurantApi.updateStatus(id, { orderStatus: 'preparing', ...(mins >= 1 ? { prepMinutes: mins } : {}) });
  },
  reject: (id, reason = '') => {
    const code = REASON_CODES[String(reason).trim().toLowerCase()] || '';
    return restaurantApi.updateStatus(id, { orderStatus: 'cancelled_by_restaurant', note: reason, ...(code ? { reasonCode: code } : {}) });
  },
  markReady: (id) => restaurantApi.updateStatus(id, { orderStatus: 'ready_for_pickup' }),
  finance: (params) => foodApi.get(`${R}/finance`, { params }),
};

export const body = (r) => r?.data ?? r ?? {};

// Same bucket logic as the web list normaliser.
export const uiStatus = (o) => {
  const v = String(o?.orderStatus || o?.status || '').toLowerCase();
  if (v === 'created') return 'confirmed';
  if (v === 'ready_for_pickup') return 'ready';
  if (v === 'picked_up') return 'out_for_delivery';
  if (v.includes('cancel')) return 'cancelled';
  return v || 'confirmed';
};

export const orderId = (o) => String(o?._id || o?.orderMongoId || o?.id || '');
export const orderLabel = (o) => String(o?.orderId || o?.order_id || o?._id || '').slice(-8);
export const orderTotal = (o) => Number(o?.pricing?.total ?? o?.total ?? 0);
