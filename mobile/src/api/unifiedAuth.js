import foodApi from './foodClient';

// Same calls as the web login (services/api/auth.js): one OTP login for Food + Taxi.
const USER_PHONE_LENGTH = 10;

export const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length > USER_PHONE_LENGTH ? digits.slice(-USER_PHONE_LENGTH) : digits;
};

export const unifiedAuth = {
  requestOtp: (phone) => foodApi.post('/auth/unified/request-otp', { phone: normalizePhone(phone) }),

  // Returns { accessToken, refreshToken, user, taxiAuth?: { token, user } }
  verifyOtp: ({ phone, otp, ref, name, fcmToken }) => {
    const payload = {
      phone: normalizePhone(phone),
      otp: String(otp ?? '').replace(/\D/g, '').slice(0, 4),
      platform: 'mobile',
    };
    if (ref && String(ref).trim()) payload.ref = String(ref).trim();
    if (name && String(name).trim()) payload.name = String(name).trim();
    if (fcmToken && String(fcmToken).trim()) payload.fcmToken = String(fcmToken).trim();
    return foodApi.post('/auth/unified/verify-otp', payload);
  },
};

// Turns the verify-otp body into what the auth store needs (mirrors web setUnifiedAuthData).
export const sessionFromVerify = (body) => {
  const data = body?.data || body || {};
  const foodToken = data.accessToken || null;
  const taxi = data.taxiAuth;
  const token = taxi?.token || foodToken;
  const user = taxi?.user || data.user || null;
  return { token, user, foodToken: foodToken || token, refreshToken: data.refreshToken || null };
};
