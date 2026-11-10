// One codebase, four apps. Pick with EXPO_PUBLIC_APP_VARIANT=user|driver|delivery|restaurant.
const VARIANTS = {
  user: { name: 'Eqosy', slug: 'eqosy', id: 'com.eqosy.user' },
  driver: { name: 'Eqosy Driver', slug: 'eqosy-driver', id: 'com.eqosy.driver' },
  delivery: { name: 'Eqosy Delivery', slug: 'eqosy-delivery', id: 'com.eqosy.delivery' },
  restaurant: { name: 'Eqosy Restaurant', slug: 'eqosy-restaurant', id: 'com.eqosy.partner' }, // keeps the old partner id
};

module.exports = ({ config }) => {
  const v = VARIANTS[(process.env.EXPO_PUBLIC_APP_VARIANT === 'partner' ? 'restaurant' : process.env.EXPO_PUBLIC_APP_VARIANT) || 'user'] || VARIANTS.user;
  return {
    ...config,
    name: v.name,
    // All four apps are built from ONE EAS project (projectId in app.json), so the slug
    // must match that project's slug. Apps are told apart by their package id instead.
    slug: 'eqosy-driver',
    ios: { ...config.ios, bundleIdentifier: v.id },
    android: { ...config.android, package: v.id },
  };
};
