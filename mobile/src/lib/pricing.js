// Fare estimate. Same rules as the web app so the amount matches what the backend charges.
const id = (v) => String(v?._id || v?.id || v || '').trim();
const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

export const unwrapData = (r) => r?.data?.data || r?.data || r;

export const getSetPriceRows = (response) => {
  const data = unwrapData(response);
  return (data?.paginator?.data || data?.results || []).filter(
    (row) => String(row?.pricing_scope || 'ride').trim().toLowerCase() === 'ride',
  );
};

export const getVehicleTypes = (response) => {
  const data = unwrapData(response);
  return data?.results || data?.vehicle_types || (Array.isArray(data) ? data : []);
};

const ruleLocationId = (rule) =>
  id(
    rule?.service_location_id?._id ||
      rule?.service_location_id?.id ||
      rule?.service_location_id ||
      rule?.zone?.service_location?._id ||
      rule?.zone?.service_location_id ||
      rule?.zone_id?._id ||
      rule?.zone_id ||
      '',
  );

const isActiveRule = (rule) =>
  Number(rule?.active ?? 1) === 1 &&
  String(rule?.status || 'active').toLowerCase() !== 'inactive' &&
  String(rule?.pricing_scope || 'ride').trim().toLowerCase() === 'ride';

const matchesTransport = (rule, t) => {
  const rt = String(rule?.transport_type || 'taxi').trim().toLowerCase();
  return rt === t || rt === 'both';
};

const newestFirst = (rules) =>
  [...rules].sort(
    (a, b) =>
      new Date(b?.updatedAt || b?.createdAt || 0).getTime() - new Date(a?.updatedAt || a?.createdAt || 0).getTime(),
  );

export const findBestPricingRule = ({ rules, vehicleTypeId, serviceLocationId, transportType, vehicleName }) => {
  const vId = id(vehicleTypeId);
  const locId = id(serviceLocationId);
  const transport = String(transportType || 'taxi').trim().toLowerCase() || 'taxi';
  const name = String(vehicleName || '').trim().toLowerCase();
  const list = Array.isArray(rules) ? rules : [];

  const candidates = newestFirst(
    list.filter((rule) => {
      const rId = id(rule?.vehicle_type?._id || rule?.vehicle_type?.id || rule?.vehicle_type || rule?.type_id);
      const rName = String(rule?.vehicle_type?.name || rule?.vehicle_type?.vehicle_type || rule?.name || '')
        .trim()
        .toLowerCase();
      const same = (vId && rId === vId) || (name && rName && rName === name);
      return same && isActiveRule(rule) && matchesTransport(rule, transport);
    }),
  );

  if (!candidates.length) return newestFirst(list.filter(isActiveRule))[0] || null;

  const exact = candidates.find(
    (rule) =>
      locId &&
      ruleLocationId(rule) === locId &&
      String(rule?.transport_type || 'taxi').trim().toLowerCase() === transport,
  );
  return exact || candidates[0];
};

export const fallbackFare = (type) => {
  const v = String(type?.icon_types || type?.vehicleIconType || type?.name || '').toLowerCase();
  const label = String(type?.name || type?.vehicle_type || '').toLowerCase();
  if (v.includes('bike') || label.includes('bike')) return 22;
  if (v.includes('auto') || label.includes('auto')) return 40;
  if (v.includes('premium') || v.includes('lux') || label.includes('premium') || label.includes('lux')) return 130;
  if (v.includes('suv') || label.includes('suv')) return 150;
  return 106;
};

export const calculateEstimatedFare = ({ type, pricingRule, distanceMeters, durationMinutes, gstRate = 0 }) => {
  const withGst = (amount) => Math.round(amount + (amount * gstRate) / 100);
  const fallback = fallbackFare(type);

  if (!pricingRule) {
    const raw = Number(type?.price || type?.base_price || type?.base_fare || 0);
    return withGst(raw > 0 ? raw : fallback);
  }

  const km = Math.max(0, Number(distanceMeters || 0) / 1000);
  const basePrice = num(pricingRule.base_price);
  const baseDistance = Math.max(0, num(pricingRule.base_distance));
  const perKm = num(pricingRule.price_per_distance);
  const perMin = num(pricingRule.time_price);
  const within = baseDistance > 0 && km <= baseDistance;
  const subtotal = within
    ? basePrice
    : basePrice + Math.max(0, km - baseDistance) * perKm + Math.max(0, Number(durationMinutes || 0)) * perMin;

  const surge = pricingRule.zone_id?.ride_surge_enabled ? num(pricingRule.ride_surge_amount) : 0;
  const taxable = subtotal + surge;
  const total = taxable + (taxable * gstRate) / 100;
  return Math.max(withGst(basePrice > 0 ? basePrice : fallback), Math.round(total));
};

export const getGstRate = (settings, key = 'ride') => {
  const row = settings?.services?.[key];
  const rate = Number(row?.rate);
  return row?.enabled && Number.isFinite(rate) && rate > 0 ? rate : 0;
};
