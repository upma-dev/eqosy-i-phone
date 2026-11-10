import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, View } from 'react-native';
import { Text } from '../components/Text';
import { Screen, Button, Card, ErrorText } from '../components/ui';
import { rideService } from '../api/services';
import { emit, subscribe } from '../lib/socket';
import { unwrapData } from '../lib/pricing';
import { colors } from '../theme';

export default function SearchingDriverScreen({ route, navigation }) {
  const p = route.params;
  const [rideId, setRideId] = useState(p.resumeRideId || '');
  const [status, setStatus] = useState('Finding a driver near you...');
  const [error, setError] = useState('');
  const [bids, setBids] = useState([]);
  const rideIdRef = useRef('');
  const startedRef = useRef(false);

  const goTracking = (ride) => {
    navigation.replace('RideTracking', {
      rideId: String(ride?.rideId || rideIdRef.current),
      snapshot: ride || null,
      pickup: p.pickup,
      drop: p.drop,
    });
  };

  // Create the booking once.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        if (p.resumeRideId) {
          rideIdRef.current = String(p.resumeRideId);
          return;
        }
        const response = await rideService.create({
          pickup: p.pickupCoords,
          drop: p.dropCoords,
          pickupAddress: p.pickup || '',
          dropAddress: p.drop || '',
          fare: p.baseFare || p.fare,
          estimatedDistanceMeters: p.estimatedDistanceMeters || 0,
          estimatedDurationMinutes: p.estimatedDurationMinutes || 0,
          vehicleTypeId: p.vehicleTypeId,
          vehicleTypeIds: p.vehicleTypeId ? [p.vehicleTypeId] : [],
          vehicleIconType: p.vehicleIconType,
          vehicleIconUrl: '',
          paymentMethod: p.paymentMethod || 'Cash',
          serviceType: p.serviceType || 'ride',
          promo_code: '',
          service_location_id: p.service_location_id || '',
          transport_type: p.transport_type || 'taxi',
          bookingMode: p.bookingMode || 'normal',
          userMaxBidFare: p.fare,
          bidStepAmount: 10,
          scheduledAt: null,
        });
        const payload = response?.data || response;
        const ride = payload?.data?.ride || payload?.ride || payload;
        const id = String(ride?._id || ride?.id || payload?.realtime?.rideId || '');
        if (!id) throw new Error('Could not create the ride. Please try again.');
        rideIdRef.current = id;
        setRideId(id);
        emit('joinRide', { rideId: id });
        emit('ride:join', { rideId: id });
        if (String(ride?.pricingNegotiationMode || 'none') === 'driver_bid') loadBids(id);
      } catch (e) {
        setError(e?.message || 'Could not request a ride.');
        setStatus('');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBids = async (id) => {
    try {
      const data = unwrapData(await rideService.getBids(id));
      setBids(Array.isArray(data?.bids) ? data.bids : Array.isArray(data) ? data : []);
    } catch {
      /* bids are optional */
    }
  };

  // Realtime: driver accepted / cancelled / bids.
  useEffect(() => {
    const mine = (payload) => payload && String(payload.rideId || '') === String(rideIdRef.current);
    const accepted = (payload) => {
      if (!mine(payload)) return;
      const s = String(payload.liveStatus || payload.status || '').toLowerCase();
      if (s === 'accepted' || payload.driver) goTracking(payload);
    };
    const off = subscribe({
      rideAccepted: accepted,
      'ride:state': accepted,
      'ride:status:updated': async (payload) => {
        if (!mine(payload)) return;
        const s = String(payload.liveStatus || payload.status || '').toLowerCase();
        if (s === 'accepted') {
          try {
            goTracking(unwrapData(await rideService.active()));
          } catch {
            goTracking(payload);
          }
        }
      },
      rideBidUpdated: (payload) => mine(payload) && loadBids(rideIdRef.current),
      rideSearchUpdate: (payload) => mine(payload) && payload?.message && setStatus(payload.message),
      rideCancelled: (payload) => {
        if (!mine(payload)) return;
        setStatus(payload?.reason || 'No drivers accepted the ride request.');
      },
      errorMessage: (payload) => setError(payload?.message || 'Could not request ride.'),
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancel = () =>
    Alert.alert('Cancel ride', 'Do you want to cancel this request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            if (rideIdRef.current) await rideService.cancel(rideIdRef.current);
            navigation.popToTop();
          } catch (e) {
            setError(e?.message || 'Could not cancel the ride.');
          }
        },
      },
    ]);

  const acceptBid = async (bid) => {
    try {
      await rideService.acceptBid(rideId, bid._id || bid.id);
    } catch (e) {
      setError(e?.message || 'Could not accept this offer.');
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24 }}>
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          {!error ? <ActivityIndicator size="large" color={colors.primary} /> : null}
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 20, textAlign: 'center' }}>
            {error ? 'Something went wrong' : status}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6, textAlign: 'center' }} numberOfLines={2}>
            {p.pickup} to {p.drop}
          </Text>
          <Text style={{ fontWeight: '800', color: colors.text, marginTop: 10 }}>₹{p.fare}</Text>
        </View>

        <ErrorText>{error}</ErrorText>

        {bids.length ? (
          <FlatList
            style={{ marginTop: 20 }}
            data={bids}
            keyExtractor={(b, i) => String(b._id || b.id || i)}
            renderItem={({ item: b }) => (
              <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <View>
                  <Text style={{ fontWeight: '800', color: colors.text }}>{b.driver?.name || 'Driver'}</Text>
                  <Text style={{ color: colors.muted }}>₹{b.fare || b.amount}</Text>
                </View>
                <Button title="Accept" onPress={() => acceptBid(b)} style={{ height: 40, paddingHorizontal: 16 }} />
              </Card>
            )}
          />
        ) : null}

        <View style={{ marginTop: 'auto' }}>
          <Button title="Cancel request" onPress={cancel} variant="light" />
        </View>
      </View>
    </Screen>
  );
}
