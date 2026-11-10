import api from './client';
import { BACKEND_ORIGIN } from '../config';

export const authService = {
  startOtp: (phone) => api.post('/users/auth/send-otp', { phone }),
  verifyOtp: (phone, otp, token = null, platform = null) =>
    api.post('/users/auth/verify-otp', {
      phone,
      otp,
      ...(token ? { token } : {}),
      ...(platform ? { platform } : {}),
    }),
  signup: (payload) => api.post('/users/signup', payload),
  getCurrentUser: () => api.get('/users/me'),
  updateCurrentUser: (payload) => api.patch('/users/me', payload),
  requestAccountDeletion: (reason) => api.post('/users/me/delete-request', { reason }),
  getWallet: () => api.get('/users/wallet'),
  getNotifications: () => api.get('/users/notifications'),
  saveMobileFcmToken: (token) => api.post(`${BACKEND_ORIGIN}/api/v1/fcm-tokens/mobile/save`, { token }),
};

export const userService = {
  getAppModules: (params = {}) => api.get('/users/app-modules', { params }),
  getAvailablePromos: (params) => api.get('/promos/available', { params }),
};

export const rideService = {
  list: (params) => api.get('/rides', { params }),
  active: () => api.get('/rides/active/me'),
  get: (id) => api.get(`/rides/${id}`),
  create: (payload) => api.post('/rides', payload),
  cancel: (id, body = {}) => api.patch(`/rides/${id}/cancel`, body),
  vehicleTypes: (service_location_id) => api.get('/users/vehicle-types', { params: { service_location_id } }),
  setPrices: () => api.get('/admin/types/set-prices', { params: { scope: 'ride' } }),
  gstSettings: () => api.get('/rides/app-settings/gst'),
  tipSettings: () => api.get('/rides/app-settings/tip'),
  availableDrivers: (params) => api.get('/rides/available-drivers', { params }),
  pendingCancellationDues: () => api.get('/rides/pending-cancellation-dues'),
  getBids: (id) => api.get(`/rides/${id}/bids`),
  acceptBid: (id, bidId) => api.post(`/rides/${id}/bids/${bidId}/accept`, {}),
  payWithWallet: (id, body) => api.post(`/rides/${id}/complete-payment/wallet`, body),
  feedback: (id, body) => api.patch(`/rides/${id}/feedback`, body),
};

export const unwrap = (r) => r?.data?.data || r?.data || r;
