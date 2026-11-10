import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, View } from 'react-native';
import { Text } from '../components/Text';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Button, ErrorText } from '../components/ui';
import { rideService } from '../api/services';
import { fetchActiveRideZones, resolveServiceLocationId } from '../lib/zones';
import {
  calculateEstimatedFare, findBestPricingRule, getGstRate, getSetPriceRows, getVehicleTypes, unwrapData,
} from '../lib/pricing';
import { toRegionPoint, formatDistance } from '../lib/geo';
import { resolveAssetUrl } from '../config';
import { colors, radius } from '../theme';

const PAYMENTS = [
  { id: 'cash', value: 'Cash', label: 'Cash', sub: 'Pay after ride', icon: 'cash-outline' },
  { id: 'online', value: 'Online Payment', label: 'Online', sub: 'UPI, cards or wallet', icon: 'card-outline' },
];

const normalizeType = (type, index) => ({
  id: String(type?._id || type?.id || type?.name || index),
  vehicleTypeId: type?._id || type?.id || '',
  transportType: String(type?.transport_type || 'taxi').trim().toLowerCase() || 'taxi',
  iconType: type?.icon_types || 'car',
  name: type?.name || type?.vehicle_type || type?.label || 'Vehicle',
  sublabel: type?.short_description || type?.description || 'Available ride',
  capacity: Number(type?.capacity || type?.max_seats || 4),
  image: resolveAssetUrl(type?.image || type?.icon || type?.map_icon || ''),
  raw: type,
});

export default function SelectVehicleScreen({ route, navigation }) {
  const p = route.params;
  const [vehicles, setVehicles] = useState([]);
  const [rules, setRules] = useState([]);
  const [gst, setGst] = useState(null);
  const [serviceLocationId, setServiceLocationId] = useState(p.service_location_id || '');
  const [selectedId, setSelectedId] = useState('');
  const [payment, setPayment] = useState('cash');
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let locId = serviceLocationId;
        if (!locId) {
          const zones = await fetchActiveRideZones();
          locId = resolveServiceLocationId(p.pickupCoords, zones);
          if (!alive) return;
          if (!locId) {
            setError('Sorry, Eqosy is not available at this pickup location yet.');
            setLoading(false);
            return;
          }
          setServiceLocationId(locId);
        }
        const [types, prices, gstRes] = await Promise.allSettled([
          rideService.vehicleTypes(locId),
          rideService.setPrices(),
          rideService.gstSettings(),
        ]);
        if (!alive) return;
        if (types.status !== 'fulfilled') throw types.reason;
        const list = getVehicleTypes(types.value)
          .filter((t) => t.active !== false && Number(t.status ?? 1) !== 0)
          .filter((t) => String(t.transport_type || 'taxi').toLowerCase() !== 'delivery')
          .map(normalizeType);
        setVehicles(list);
        setSelectedId(list[0]?.id || '');
        setRules(prices.status === 'fulfilled' ? getSetPriceRows(prices.value) : []);
        const gstData = gstRes.status === 'fulfilled' ? gstRes.value : null;
        setGst(gstData?.data?.settings || gstData?.settings || null);
        if (!list.length) setError('No vehicles are available for this location right now.');
      } catch (e) {
        if (alive) setError(e?.message || 'Could not load vehicles.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const priced = useMemo(() => {
    const rate = getGstRate(gst, 'ride');
    return vehicles.map((v) => {
      const rule = findBestPricingRule({
        rules,
        vehicleTypeId: v.vehicleTypeId,
        serviceLocationId,
        transportType: v.transportType,
        vehicleName: v.name,
      });
      const fare = calculateEstimatedFare({
        type: v.raw,
        pricingRule: rule,
        distanceMeters: p.estimatedDistanceMeters,
        durationMinutes: p.estimatedDurationMinutes,
        gstRate: rate,
      });
      return { ...v, fare };
    });
  }, [vehicles, rules, gst, serviceLocationId, p.estimatedDistanceMeters, p.estimatedDurationMinutes]);

  // Nearby driver count per vehicle (shown as ETA hint).
  useEffect(() => {
    if (!serviceLocationId || !vehicles.length) return undefined;
    let alive = true;
    vehicles.forEach(async (v) => {
      try {
        const res = unwrapData(
          await rideService.availableDrivers({
            vehicleTypeId: v.vehicleTypeId,
            vehicleIconType: v.iconType,
            lng: p.pickupCoords[0],
            lat: p.pickupCoords[1],
            service_location_id: serviceLocationId,
            transport_type: v.transportType,
          }),
        );
        if (alive) setAvailability((cur) => ({ ...cur, [v.id]: res }));
      } catch {
        /* availability is optional */
      }
    });
    return () => { alive = false; };
  }, [serviceLocationId, vehicles, p.pickupCoords]);

  const selected = priced.find((v) => v.id === selectedId);
  const pickup = toRegionPoint(p.pickupCoords);
  const drop = toRegionPoint(p.dropCoords);

  const book = async () => {
    if (!selected) return;
    setError('');
    // Block if the rider has unpaid cancellation dues (same check as web).
    try {
      const dues = unwrapData(await rideService.pendingCancellationDues());
      if (Number(dues?.amount || dues?.total || 0) > 0 && dues?.blocking) {
        setError(`Please clear your pending cancellation fee of ₹${dues.amount || dues.total} first.`);
        return;
      }
    } catch {
      /* not blocking if the check itself fails */
    }
    navigation.navigate('SearchingDriver', {
      pickup: p.pickup,
      drop: p.drop,
      pickupCoords: p.pickupCoords,
      dropCoords: p.dropCoords,
      service_location_id: serviceLocationId,
      transport_type: selected.transportType,
      vehicleTypeId: selected.vehicleTypeId,
      vehicleIconType: selected.iconType,
      vehicleName: selected.name,
      paymentMethod: PAYMENTS.find((x) => x.id === payment).value,
      fare: selected.fare,
      baseFare: selected.fare,
      estimatedDistanceMeters: p.estimatedDistanceMeters,
      estimatedDurationMinutes: p.estimatedDurationMinutes,
      bookingMode: 'normal',
      serviceType: 'ride',
      nonce: `${Date.now()}`,
    });
  };

  if (loading) {
    return <Screen><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View></Screen>;
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title="Choose a ride" navigation={navigation} />
      <View style={{ height: 200 }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{ ...(pickup || { latitude: 22.7, longitude: 75.8 }), latitudeDelta: 0.06, longitudeDelta: 0.06 }}
          onMapReady={() => {}}
        >
          {pickup ? <Marker coordinate={pickup} pinColor="green" /> : null}
          {drop ? <Marker coordinate={drop} pinColor="red" /> : null}
          {p.routePath?.length ? <Polyline coordinates={p.routePath} strokeWidth={4} strokeColor={colors.ink} /> : null}
        </MapView>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>{p.pickup}</Text>
        <Text style={{ color: colors.text, fontWeight: '700' }} numberOfLines={1}>to {p.drop}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
          {formatDistance(p.estimatedDistanceMeters)} · {p.estimatedDurationMinutes} min
        </Text>
      </View>

      <FlatList
        data={priced}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={<ErrorText>{error}</ErrorText>}
        renderItem={({ item: v }) => {
          const on = v.id === selectedId;
          const near = availability[v.id];
          const eta = near?.closestDriverEtaMinutes;
          return (
            <Pressable
              onPress={() => setSelectedId(v.id)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.lg,
                borderWidth: 2, borderColor: on ? colors.ink : colors.border, backgroundColor: '#fff',
              }}
            >
              {v.image ? (
                <Image source={{ uri: v.image }} style={{ width: 56, height: 40 }} resizeMode="contain" />
              ) : (
                <Ionicons name="car-sport" size={32} color={colors.primary} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: colors.text }}>{v.name}</Text>
                <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12 }}>
                  {v.capacity} seats · {eta ? `${eta} min away` : v.sublabel}
                </Text>
              </View>
              <Text style={{ fontWeight: '800', fontSize: 17, color: colors.text }}>₹{v.fare}</Text>
            </Pressable>
          );
        }}
      />

      <View style={{ padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {PAYMENTS.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => setPayment(m.id)}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: radius.md,
                borderWidth: 1.5, borderColor: payment === m.id ? colors.ink : colors.border,
              }}
            >
              <Ionicons name={m.icon} size={20} color={colors.text} />
              <View>
                <Text style={{ fontWeight: '700', color: colors.text }}>{m.label}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>{m.sub}</Text>
              </View>
            </Pressable>
          ))}
        </View>
        <Button
          title={selected ? `Book ${selected.name} · ₹${selected.fare}` : 'Select a vehicle'}
          onPress={book}
          disabled={!selected}
          variant="primary"
        />
      </View>
    </Screen>
  );
}
