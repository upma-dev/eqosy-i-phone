import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, View } from 'react-native';
import { Text } from '../components/Text';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Card } from '../components/ui';
import { rideService } from '../api/services';
import { emit, subscribe } from '../lib/socket';
import { unwrapData } from '../lib/pricing';
import { toRegionPoint } from '../lib/geo';
import { colors } from '../theme';

const DONE = new Set(['arrived_destination', 'completed', 'delivered']);
// Web redirects to the complete screen on these statuses.
const POST_RIDE = new Set(['arrived', 'completed', 'delivered']);

const STATUS_TEXT = {
  accepted: 'Driver is on the way',
  arriving: 'Driver is arriving',
  started: 'Trip started',
  ongoing: 'Trip in progress',
  arrived: 'You have arrived',
  completed: 'Trip completed',
};

export default function RideTrackingScreen({ route, navigation }) {
  const { rideId, snapshot } = route.params;
  const [ride, setRide] = useState(snapshot || null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(!snapshot);
  const mapRef = useRef(null);
  const leftRef = useRef(false);

  const status = String(ride?.liveStatus || ride?.status || 'accepted').toLowerCase();

  const goComplete = () => {
    if (leftRef.current) return;
    leftRef.current = true;
    navigation.replace('RideComplete', { rideId });
  };

  // Initial load.
  useEffect(() => {
    (async () => {
      try {
        const data = unwrapData(await rideService.get(rideId));
        setRide((cur) => ({ ...(cur || {}), ...data }));
        const loc = data?.lastDriverLocation?.coordinates;
        if (loc) setDriverLocation(loc);
        if (POST_RIDE.has(String(data?.liveStatus || data?.status || '').toLowerCase())) goComplete();
      } catch {
        /* snapshot still shown */
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId]);

  // Realtime updates.
  useEffect(() => {
    const mine = (payload) => payload && String(payload.rideId || '') === String(rideId);
    const join = () => emit('ride:join', { rideId });
    join();
    const off = subscribe({
      connect: join,
      'ride:state': (payload) => {
        if (!mine(payload)) return;
        setRide((cur) => ({ ...(cur || {}), ...payload }));
        if (payload.lastDriverLocation?.coordinates) setDriverLocation(payload.lastDriverLocation.coordinates);
        const s = String(payload.liveStatus || payload.status || '').toLowerCase();
        if (POST_RIDE.has(s)) goComplete();
        if (s === 'cancelled') navigation.popToTop();
      },
      'ride:driver-location:updated': (payload) => {
        if (mine(payload) && payload.coordinates) setDriverLocation(payload.coordinates);
      },
      'ride:status:updated': (payload) => {
        if (!mine(payload)) return;
        setRide((cur) => ({ ...(cur || {}), ...payload }));
        const s = String(payload.liveStatus || payload.status || '').toLowerCase();
        if (POST_RIDE.has(s)) goComplete();
        if (s === 'cancelled') navigation.popToTop();
      },
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId]);

  const pickup = toRegionPoint(ride?.pickupLocation?.coordinates);
  const drop = toRegionPoint(ride?.dropLocation?.coordinates);
  const driverPoint = toRegionPoint(driverLocation);
  const started = ['started', 'ongoing'].includes(status);

  useEffect(() => {
    const pts = [driverPoint, started ? drop : pickup].filter(Boolean);
    if (pts.length > 1) {
      mapRef.current?.fitToCoordinates(pts, { edgePadding: { top: 80, right: 60, bottom: 280, left: 60 }, animated: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverLocation, started]);

  const driver = ride?.driver || {};
  const otp = ride?.otp;
  const canCancel = !DONE.has(status) && !started;

  const cancel = () =>
    Alert.alert('Cancel ride', 'A cancellation fee may apply. Cancel this ride?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = unwrapData(await rideService.cancel(rideId));
            if (Number(res?.cancellationCharge) > 0) {
              Alert.alert('Ride cancelled', `A cancellation fee of ₹${res.cancellationCharge} has been applied.`);
            }
            navigation.popToTop();
          } catch (e) {
            Alert.alert('Could not cancel', e?.message || 'Please try again.');
          }
        },
      },
    ]);

  const initial = useMemo(() => pickup || drop || { latitude: 22.7196, longitude: 75.8577 }, [pickup, drop]);

  if (loading) {
    return <Screen><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View></Screen>;
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={{ ...initial, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
        {pickup ? <Marker coordinate={pickup} pinColor="green" title="Pickup" /> : null}
        {drop ? <Marker coordinate={drop} pinColor="red" title="Drop" /> : null}
        {driverPoint ? (
          <Marker coordinate={driverPoint} title={driver.name || 'Driver'}>
            <View style={{ backgroundColor: colors.ink, padding: 6, borderRadius: 16 }}>
              <Ionicons name="car" size={18} color="#fff" />
            </View>
          </Marker>
        ) : null}
      </MapView>

      <Screen edges={['bottom']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flex: 0, backgroundColor: 'transparent' }}>
        <Card style={{ margin: 12, gap: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{STATUS_TEXT[status] || 'Your ride'}</Text>

          {otp && !started ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ color: colors.muted, fontWeight: '600' }}>Share OTP with driver</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', letterSpacing: 4, color: colors.text }}>{String(otp)}</Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{String(driver.name || 'D').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: colors.text }}>{driver.name || 'Your driver'}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {[driver.vehicleNumber || driver.vehicle_number, driver.vehicleType || driver.vehicle].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>₹{ride?.fare ?? ''}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              title="Chat"
              variant="light"
              style={{ flex: 1, height: 46 }}
              onPress={() => navigation.navigate('Chat', { rideId, peerName: driver.name || 'Driver' })}
            />
            {driver.phone ? (
              <Button title="Call" variant="light" style={{ flex: 1, height: 46 }} onPress={() => Linking.openURL(`tel:${driver.phone}`)} />
            ) : null}
            {canCancel ? <Button title="Cancel" variant="light" style={{ flex: 1, height: 46 }} onPress={cancel} /> : null}
          </View>
        </Card>
      </Screen>
    </View>
  );
}
