import api from '../../api/client';

// Same endpoints as web Taxi/modules/driver (services/registrationService.js + DriverHome/ActiveTrip/DriverWallet).
export const driverApi = {
  sendLoginOtp: (phone) => api.post('/drivers/auth/send-otp', { phone, role: 'driver' }),
  verifyLoginOtp: (phone, otp) => api.post('/drivers/auth/verify-otp', { phone, otp, role: 'driver' }),
  me: () => api.get('/drivers/me'),
  updateMe: (payload) => api.patch('/drivers/me', payload),
  goOnline: (location) => api.patch('/drivers/online', { location }),
  goOffline: () => api.patch('/drivers/offline'),
  pushLocation: (coordinates, lat, lng) => api.patch('/drivers/location', { coordinates, lat, lng }),
  activeRide: () => api.get('/rides/active/me'),
  ride: (id) => api.get(`/rides/${id}`),
  setRideStatus: (id, body) => api.patch(`/rides/${id}/status`, body),
  rides: (params) => api.get('/rides', { params }),
  wallet: () => api.get('/drivers/wallet'),
  requestWithdrawal: (body) => api.post('/drivers/wallet/withdrawals', body),
  notifications: (params) => api.get('/drivers/notifications', { params }),
};

// Server wraps payloads as { success, data }.
export const pick = (r) => r?.data?.data || r?.data || r;
