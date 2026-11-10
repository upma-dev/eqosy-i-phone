// Port of web Taxi/modules/user/components/activity/activityHelpers.js
export const PAGE_SIZE = 4;
// Rental is switched off in the web (RENTAL_ENABLED = false), pooling is on.
export const TABS = ['All', 'Rides', 'Parcels', 'Bus', 'Pooling', 'Outstation', 'Scheduled', 'Support'];

const IMG = {
  car: require('../../assets/vehicles/car.png'),
  bike: require('../../assets/vehicles/bike.png'),
  auto: require('../../assets/vehicles/auto.png'),
  luxury: require('../../assets/vehicles/Luxury.png'),
  premium: require('../../assets/vehicles/Premium.png'),
  suv: require('../../assets/vehicles/SUV.png'),
  parcel: require('../../assets/vehicles/Delivery.png'),
  bus: require('../../assets/services/bus.png'),
};

export const pickFirstString = (...values) => {
  for (const v of values) {
    const s = String(v || '').trim();
    if (s) return s;
  }
  return '';
};

export const buildAvatarFallback = (name = 'Captain') =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E2E8F0&color=0F172A&bold=true&format=png`;

const vehicleAsset = (iconType = '') => {
  const v = String(iconType || '').toLowerCase();
  if (v.includes('bike')) return IMG.bike;
  if (v.includes('auto')) return IMG.auto;
  if (v.includes('lux')) return IMG.luxury;
  if (v.includes('premium')) return IMG.premium;
  if (v.includes('suv')) return IMG.suv;
  return IMG.car;
};

export const getStatusTone = (status = '') => {
  const s = String(status || '').toLowerCase();
  if (s === 'completed' || s === 'confirmed') return 'success';
  if (s === 'cancelled' || s === 'failed' || s === 'expired') return 'danger';
  return 'warning';
};

const toDate = (v) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? d : null; };
export const formatRideDate = (v) => { const d = toDate(v); return d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '--'; };
export const formatRideTime = (v) => { const d = toDate(v); return d ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--'; };
export const toTimestamp = (v) => { const d = toDate(v); return d ? d.getTime() : 0; };
export const formatStatus = (s) => { const n = String(s || 'searching').toLowerCase(); return n.charAt(0).toUpperCase() + n.slice(1); };

const coordLabel = (loc, fallback) => {
  const [lng, lat] = loc?.coordinates || [];
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : fallback;
};

export const normalizeRide = (ride) => {
  const timeSource = ride.completedAt || ride.startedAt || ride.acceptedAt || ride.createdAt || ride.updatedAt;
  const driverName = pickFirstString(ride?.driver?.name, ride?.driver?.fullName, ride?.driverName, ride?.driver?.phone ? `Driver ${ride.driver.phone}` : '', 'Driver assigned');
  const status = formatStatus(ride.status || ride.liveStatus);
  const serviceType = String(ride.serviceType || ride.type || 'ride').toLowerCase();
  const type = serviceType === 'parcel' ? 'parcel' : 'ride';
  const pickup = ride.pickupAddress || coordLabel(ride.pickupLocation, 'Pickup');
  const drop = ride.dropAddress || coordLabel(ride.dropLocation, 'Drop');
  const scheduled = Boolean(ride?.scheduledAt);
  const outstation = serviceType === 'intercity' || Boolean(ride?.parcel?.isOutstation) || String(ride?.parcel?.deliveryScope || '').toLowerCase() === 'outstation';
  const title = type === 'parcel'
    ? (scheduled ? 'Scheduled parcel' : outstation ? 'Outstation parcel' : status === 'Searching' ? 'Parcel request' : 'Parcel delivery')
    : scheduled ? `Scheduled ride with ${driverName}` : outstation ? `Outstation trip with ${driverName}` : (status === 'Searching' ? 'Ride request' : `Ride with ${driverName}`);
  return {
    id: ride.rideId || ride._id || ride.id, type, title, address: `${pickup} to ${drop}`,
    date: formatRideDate(timeSource), time: formatRideTime(timeSource), status, statusTone: getStatusTone(status),
    price: Number(ride.fare || 0).toFixed(0), ride, driverName,
    eyebrow: scheduled ? 'Scheduled booking' : outstation ? 'Outstation trip' : type === 'parcel' ? 'Delivery booking' : 'Driver trip',
    driverImage: pickFirstString(ride?.driver?.profileImage, ride?.driver?.profile_image, ride?.driver?.image, ride?.driver?.avatar, buildAvatarFallback(driverName)),
    vehicleImage: type === 'parcel' ? IMG.parcel : vehicleAsset(ride?.vehicleIconType || ride?.driver?.vehicleIconType || ride?.driver?.vehicleType || ride?.serviceType),
    sortTimestamp: toTimestamp(timeSource),
  };
};

export const normalizeBusBooking = (b) => {
  const from = pickFirstString(b?.bus?.fromCity, 'From');
  const to = pickFirstString(b?.bus?.toCity, 'To');
  const operator = pickFirstString(b?.bus?.operator, b?.bus?.busName, 'Bus Service');
  const driverName = pickFirstString(b?.bus?.driverName, operator, 'Bus crew');
  const status = formatStatus(b?.status || 'confirmed');
  const travel = b?.travelDate ? `${b.travelDate}T00:00:00` : b?.createdAt;
  return {
    id: b.id, type: 'bus', title: `${from} to ${to}`,
    address: `${pickFirstString(b?.bus?.pickupLocation, from)} to ${pickFirstString(b?.bus?.dropLocation, to)}`,
    date: formatRideDate(travel), time: pickFirstString(b?.bus?.departure, formatRideTime(travel)), status, statusTone: getStatusTone(status),
    price: Number(b.amount || 0).toFixed(0), driverName, eyebrow: operator, driverImage: buildAvatarFallback(driverName),
    vehicleImage: IMG.bus, booking: b, sortTimestamp: toTimestamp(b?.createdAt || travel),
  };
};

export const normalizePoolingBooking = (b) => {
  const routeName = pickFirstString(b?.route?.routeName, b?.route?.originLabel && b?.route?.destinationLabel ? `${b.route.originLabel} to ${b.route.destinationLabel}` : '', 'Pooling trip');
  const driverName = pickFirstString(b?.vehicle?.name, 'Pooling vehicle');
  const status = formatStatus(b?.bookingStatus || 'confirmed');
  return {
    id: b?._id || b?.bookingId, type: 'pooling', title: routeName,
    address: `${pickFirstString(b?.pickupLabel, b?.route?.originLabel, 'Pickup')} to ${pickFirstString(b?.dropLabel, b?.route?.destinationLabel, 'Drop')}`,
    date: formatRideDate(b?.travelDate), time: pickFirstString(b?.scheduleId, formatRideTime(b?.travelDate)), status, statusTone: getStatusTone(status),
    price: Number(b?.fare || 0).toFixed(0), driverName, eyebrow: pickFirstString(b?.vehicle?.vehicleNumber, 'Pooling booking'),
    driverImage: buildAvatarFallback(driverName), vehicleImage: IMG.car, booking: b, sortTimestamp: toTimestamp(b?.createdAt || b?.travelDate),
  };
};

export const getHelperText = (tab) => ({
  Support: 'Tickets and help requests',
  Bus: 'Your bus tickets, travel timings, and operator details',
  Pooling: 'Shared pooling rides, seat reservations, and upcoming departures',
  Outstation: 'Long-distance trips and outstation deliveries',
  Scheduled: 'Bookings reserved for a later pickup time',
}[tab] || 'Rides, parcels, bus tickets and more in one place');
