import foodApi from '../../api/foodClient';

// Same endpoints as web services/api/index.js (deliveryAPI) and services/api/auth.js.
const D = '/food/delivery';
const normalize = (p) => String(p || '').replace(/\D/g, '').slice(-10);

export const deliveryApi = {
  requestOtp: (phone) => foodApi.post('/food/auth/delivery/request-otp', { phone: normalize(phone) }),
  verifyOtp: (phone, otp) =>
    foodApi.post('/food/auth/delivery/verify-otp', { phone: normalize(phone), otp: String(otp).replace(/\D/g, '').slice(0, 6), platform: 'mobile' }),
  me: () => foodApi.get('/food/auth/me'),
  setAvailability: (isOnline, extra = {}) => foodApi.patch(`${D}/availability`, { status: isOnline ? 'online' : 'offline', ...extra }),
  updateLocation: (latitude, longitude, isOnline = true) => foodApi.patch(`${D}/availability`, { status: isOnline ? 'online' : 'offline', latitude, longitude }),
  currentOrder: () => foodApi.get(`${D}/orders/current`),
  acceptOrder: (id, body = {}) => foodApi.patch(`${D}/orders/${id}/accept`, body),
  rejectOrder: (id, body = {}) => foodApi.patch(`${D}/orders/${id}/reject`, body),
  reachedPickup: (id) => foodApi.patch(`${D}/orders/${id}/reached-pickup`, {}),
  confirmPickup: (id, confirmedOrderId, loc = {}, extra = {}) =>
    foodApi.patch(`${D}/orders/${id}/confirm-pickup`, { confirmedOrderId, latitude: loc.lat, longitude: loc.lng, billImageUrl: extra.billImageUrl }),
  reachedDrop: (id) => foodApi.patch(`${D}/orders/${id}/reached-drop`, {}),
  verifyDropOtp: (id, otp) => foodApi.post(`${D}/orders/${id}/verify-drop-otp`, { otp: String(otp) }),
  collectCash: (id) => foodApi.post(`${D}/orders/${id}/collect/cash`, {}),
  wallet: () => foodApi.get(`${D}/wallet`),
  earnings: (params) => foodApi.get(`${D}/earnings`, { params }),
  tripHistory: (params) => foodApi.get(`${D}/trip-history`, { params }),
  pocket: () => foodApi.get(`${D}/pocket-details`),
};

// Body is { success, message, data }.
export const body = (r) => r?.data ?? r ?? {};
