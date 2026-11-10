import foodApi from './foodClient';

// Public Food endpoints used by the Food home (same paths as web services/api/index.js).
export const foodService = {
  heroBanners: (section = 'food') => foodApi.get('/food/hero-banners/public', { params: { section } }),
  promotionBanners: (zoneId, section = 'food') =>
    foodApi.get('/food/hero-banners/home-promotion/public', { params: { zoneId, section } }),
  exploreIcons: () => foodApi.get('/food/explore-icons/public'),
  landingSettings: () => foodApi.get('/food/landing/settings/public'),
  publicCategories: (params = {}) => foodApi.get('/food/restaurant/categories/public', { params }),
  restaurants: (params = {}) => foodApi.get('/food/restaurant/restaurants', { params: { limit: 1000, ...params } }),
  detectZone: (lat, lng) => foodApi.get('/food/zones/detect', { params: { lat, lng } }),
};

// Responses are { success, data: {...} }; foodApi already resolves with the body.
export const dataOf = (res) => res?.data ?? res ?? {};
