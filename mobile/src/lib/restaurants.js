import { normalizeImageUrl } from './image';

// Same field handling as web Home.jsx (restaurant transform), trimmed to what the cards need.
const pickImage = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return normalizeImageUrl(v);
  return normalizeImageUrl(v.url || v.secure_url || v.image || v.imageUrl || v.src || '');
};

export const getDisplayName = (r) => {
  const c = [r?.name, r?.restaurantName, r?.restaurantName?.english, r?.restaurantName?.value, r?.onboarding?.step1?.restaurantName];
  const found = c.find((x) => typeof x === 'string' && x.trim());
  return found ? found.trim() : 'Restaurant';
};

const toRad = (d) => (d * Math.PI) / 180;
export const distanceKm = (lat1, lng1, lat2, lng2) => {
  const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const isTrue = (v) => v === true || v === 'true';

export function transformRestaurant(r, user) {
  const loc = r.location;
  const lat = loc?.latitude ?? (Array.isArray(loc?.coordinates) ? loc.coordinates[1] : null);
  const lng = loc?.longitude ?? (Array.isArray(loc?.coordinates) ? loc.coordinates[0] : null);
  let distance = r.distance || '--';
  let km = null;
  if (user?.latitude && user?.longitude && lat && lng) {
    km = distanceKm(user.latitude, user.longitude, Number(lat), Number(lng));
    distance = km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m`;
  }

  const covers = [...(Array.isArray(r.coverImages) ? r.coverImages : [r.coverImages]), r.coverImage].map(pickImage).filter(Boolean);
  const profile = [r.profileImage, r.onboarding?.step2?.profileImageUrl, r.image, r.imageUrl].map(pickImage).filter(Boolean);
  const images = Array.from(new Set([...covers, ...profile]));

  const recommended = (Array.isArray(r.recommendedImages) ? r.recommendedImages : [])
    .map((it, i) => {
      const image = pickImage(it?.image || it?.url || it?.src);
      return image ? { id: it?.id || it?._id || `${r._id}-rec-${i}`, image, name: it?.name || '', price: Number(it?.price || 0) } : null;
    })
    .filter(Boolean);

  const firstOffer = Array.isArray(r.offers) && r.offers[0] ? (typeof r.offers[0] === 'string' ? r.offers[0] : r.offers[0]?.title || r.offers[0]?.discountText || r.offers[0]?.code) : null;
  const firstCoupon = Array.isArray(r.coupons) && r.coupons[0] ? (typeof r.coupons[0] === 'string' ? r.coupons[0] : r.coupons[0]?.title || (r.coupons[0]?.discount ? `${r.coupons[0].discount}% OFF` : null)) : null;
  const offer = r.offer || r.offerText || r.discountText || r.discount || r.activeOffer || firstOffer || firstCoupon || null;

  const pureVeg =
    isTrue(r.pureVegRestaurant) || isTrue(r.pureVeg) || isTrue(r.isPureVeg) || r.foodType === 'Veg' || r.foodTypeScope === 'Veg' ||
    (Array.isArray(r.cuisines) && r.cuisines.some((c) => String(c).toLowerCase().includes('pure veg')));

  return {
    id: r.restaurantId || r._id,
    mongoId: r._id || null,
    name: getDisplayName(r),
    cuisine: Array.isArray(r.cuisines) && r.cuisines.length ? r.cuisines.slice(0, 3).join(', ') : 'Multi-cuisine',
    rating: Number(r.rating) || 0,
    deliveryTime: r.deliveryTime || r.estimatedDeliveryTime || (r.estimatedDeliveryTimeMinutes ? `${r.estimatedDeliveryTimeMinutes} mins` : '25-30 mins'),
    distance,
    distanceInKm: km,
    image: images[0] || '',
    images,
    recommendedImages: recommended,
    avgPrice: r.avgPrice || r.priceForOne || null,
    offer,
    slug: r.slug,
    pureVegRestaurant: pureVeg,
    isActive: r.isActive !== false,
    isAcceptingOrders: r.isAcceptingOrders !== false,
    isSponsored: isTrue(r.isSponsored),
    raw: r,
  };
}

// Sponsored first, then closed ones last (best effort), keeping server order otherwise.
export const sortForDisplay = (list) =>
  [...list].sort((a, b) => {
    if (a.isSponsored !== b.isSponsored) return a.isSponsored ? -1 : 1;
    const ao = a.isActive && a.isAcceptingOrders;
    const bo = b.isActive && b.isAcceptingOrders;
    if (ao !== bo) return ao ? -1 : 1;
    return 0;
  });
