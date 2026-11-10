// Ports of web Food/utils/foodVariants.js + menuItems.js (determineIsVeg).
const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return Object.values(value);
  return [];
};

export const normalizeFoodVariants = (value) =>
  toArray(value)
    .map((entry = {}, index) => {
      if (typeof entry === 'string') {
        const t = entry.trim();
        return t ? { id: `variant-${index}`, _id: `variant-${index}`, name: t, price: 0 } : null;
      }
      const id = String(entry?.id || entry?._id || `variant-${index}`);
      const name = String(entry?.name || entry?.title || entry?.variantName || entry?.label || entry?.size || '').trim();
      const price = Number(entry?.price ?? entry?.variantPrice ?? entry?.additionalPrice);
      if (!name) return null;
      return { id, _id: id, name, price: Number.isFinite(price) && price >= 0 ? price : 0 };
    })
    .filter(Boolean);

export const getFoodVariants = (item = {}) => {
  if (!item) return [];
  const raw =
    (Array.isArray(item.variants) && item.variants.length ? item.variants : null) ||
    (Array.isArray(item.variations) && item.variations.length ? item.variations : null) ||
    (Array.isArray(item.options) && item.options.length ? item.options : null) ||
    (Array.isArray(item.sizes) && item.sizes.length ? item.sizes : null) ||
    (Array.isArray(item.variantList) && item.variantList.length ? item.variantList : null) ||
    [];
  return normalizeFoodVariants(raw);
};

export const hasFoodVariants = (item) => getFoodVariants(item).length > 0;

export const getFoodDisplayPrice = (item = {}) => {
  const v = getFoodVariants(item);
  if (v.length) return Math.min(...v.map((x) => Number(x.price) || 0));
  const p = Number(item?.price);
  return Number.isFinite(p) ? p : 0;
};

export const getFoodPriceLabel = (item = {}) => {
  const p = getFoodDisplayPrice(item);
  return hasFoodVariants(item) ? `Starting from ₹${Math.round(p)}` : `₹${Math.round(p)}`;
};

export const buildCartLineId = (itemId, variantId = '') => `${String(itemId || '')}::${String(variantId || 'base')}`;

const NON_VEG = ['chicken', 'mutton', 'fish', 'prawn', 'egg', 'lamb', 'beef', 'pork', 'keema', 'biryani', 'kabab', 'kebab', 'tandoori', 'tikka', 'shorma', 'shawarma', 'meat', 'wings', 'lollipop'];

export const determineIsVeg = (item) => {
  if (!item) return true;
  if (item.isVeg === true || item.veg === true || item.is_veg === true || item.is_veg === 1) return true;
  if (item.isVeg === false || item.veg === false || item.is_veg === false || item.is_veg === 0) return false;
  const t = String(item.foodType || item.food_type || item.type || item.category || '').toLowerCase().trim();
  if (t === 'veg' || t === 'vegetarian') return true;
  if (['non-veg', 'nonveg', 'non-vegetarian', 'egg'].includes(t)) return false;
  const name = String(item.name || item.foodName || '').toLowerCase();
  return !NON_VEG.some((k) => name.includes(k));
};

const toArr = (v) => {
  if (Array.isArray(v)) return v;
  if (!v || typeof v !== 'object') return [];
  return Object.values(v).filter((e) => e && typeof e === 'object');
};

const isRec = (i) => i?.isRecommended === true || i?.isRecommended === 1 || String(i?.isRecommended) === 'true';

const normalizeItem = (item = {}, idx = 0) => {
  const isVeg = determineIsVeg(item);
  return {
    ...item,
    id: String(item.id || item._id || `item-${idx}-${Math.random()}`),
    name: item.name || 'Unnamed Item',
    isVeg,
    foodType: isVeg ? 'Veg' : 'Non-Veg',
    price: getFoodDisplayPrice(item),
    variants: getFoodVariants(item),
    isAvailable: item.isAvailable !== false,
    isRecommended: isRec(item),
    isSpicy: item.isSpicy === true || String(item.isSpicy) === 'true',
    description: typeof item.description === 'string' ? item.description : '',
    image: item.image || item.images?.[0] || '',
  };
};

// Same section building as web RestaurantDetails: sections + subsections, plus a "Recommended for you" section on top.
export function buildMenuSections(rawSections) {
  const sections = toArr(rawSections).map((s, si) => ({
    ...s,
    id: String(s.id || s._id || `section-${si}`),
    name: s.name || s.title || 'Unnamed Section',
    items: toArr(s.items).map(normalizeItem),
    subsections: toArr(s.subsections).map((sub, ssi) => ({
      ...sub,
      id: String(sub.id || sub._id || `subsection-${si}-${ssi}`),
      name: sub.name || 'Unnamed Subsection',
      items: toArr(sub.items).map(normalizeItem),
    })),
  }));

  const rec = [];
  sections.forEach((s) => {
    s.items.forEach((i) => isRec(i) && i.isAvailable && rec.push(i));
    s.subsections.forEach((sub) => sub.items.forEach((i) => isRec(i) && i.isAvailable && rec.push(i)));
  });
  const seen = new Set();
  const unique = rec.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));

  const rest = sections.filter((s) => String(s.name).trim().toLowerCase() !== 'recommended for you');
  return unique.length ? [{ id: 'recommended', name: 'Recommended for you', items: unique, subsections: [] }, ...rest] : rest;
}
