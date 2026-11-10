import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Navigation, Phone } from 'lucide-react-native';
import { Text } from '../../components/Text';
import { driverApi, pick } from './api';
import { subscribe } from '../../lib/socket';

// Port of web Taxi/modules/driver/pages/ActiveTrip.jsx, core flow only:
// accepted -> arrived -> (OTP) started -> completed. Map, QR payment, parcel proof and tips come later.
const BLUE = '#3B6BF0';

const statusOf = (r) => String(r?.liveStatus || r?.status || 'accepted').toLowerCase();
const point = (p) => (Array.isArray(p?.coordinates) ? { lat: p.coordinates[1], lng: p.coordinates[0] } : null);

export default function ActiveTripScreen({ route, navigation }) {
  const { rideId, snapshot } = route.params || {};
  const [ride, setRide] = useState(snapshot || null);
  const [loading, setLoading] = useState(!snapshot);
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState('');

  const load = useCallback(async () => {
    try {
      const r = pick(await driverApi.ride(rideId));
      setRide((cur) => ({ ...(cur || {}), ...(r?.ride || r) }));
    } catch {} finally {
      setLoading(false);
    }
  }, [rideId]);

  useEffect(() => { load(); }, [load]);

  const leave = useCallback(() => navigation.reset({ index: 0, routes: [{ name: 'DriverTabs' }] }), [navigation]);

  useEffect(() => subscribe({
    'ride:status:updated': (d) => { if (!d?.rideId || String(d.rideId) === String(rideId)) load(); },
    'ride:state': (d) => { if (!d?.rideId || String(d.rideId) === String(rideId)) setRide((cur) => ({ ...(cur || {}), ...d })); },
    rideCancelled: (d) => {
      if (d?.rideId && String(d.rideId) !== String(rideId)) return;
      Alert.alert('Ride cancelled', 'The rider cancelled this ride.', [{ text: 'OK', onPress: leave }]);
    },
  }), [rideId, load, leave]);

  const status = statusOf(ride);
  const pickup = point(ride?.pickupLocation);
  const drop = point(ride?.dropLocation);
  const customer = ride?.user || ride?.rider || {};
  const rideOtp = String(ride?.otp || '');

  const setStatus = async (body) => {
    setBusy(true);
    try {
      const r = pick(await driverApi.setRideStatus(rideId, body));
      setRide((cur) => ({ ...(cur || {}), ...(r?.ride || r) }));
      if (body.status === 'completed') {
        Alert.alert('Trip completed', `Collect Rs ${ride?.fare || 0} (${ride?.paymentMethod || 'Cash'}).`, [{ text: 'Done', onPress: leave }]);
      }
    } catch (e) {
      Alert.alert('Could not update ride', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const startTrip = () => {
    if (rideOtp && otp !== rideOtp) return Alert.alert('Wrong OTP', 'Ask the rider for the 4-digit OTP.');
    setStatus({ status: 'started' });
  };

  const navigateTo = (p) => {
    if (p) Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`);
  };

  if (loading) return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={BLUE} /></SafeAreaView>;

  const toPickup = ['accepted', 'arriving'].includes(status);
  const atPickup = status === 'arrived';
  const inTrip = ['started', 'ongoing', 'in_progress'].includes(status);
  const target = inTrip ? drop : pickup;

  let action = null;
  if (toPickup) action = { label: "I've arrived at pickup", onPress: () => setStatus({ status: 'arrived' }) };
  else if (atPickup) action = { label: 'Start trip', onPress: startTrip };
  else if (inTrip) action = { label: 'Complete trip', onPress: () => setStatus({ status: 'completed', paymentMethod: ride?.paymentMethod || undefined }) };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <Pressable onPress={leave} style={{ width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} color="#0F172A" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>{toPickup ? 'Go to pickup' : atPickup ? 'Verify OTP' : 'Trip in progress'}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontWeight: '800', fontSize: 16, color: '#0F172A' }}>{customer.name || 'Rider'}</Text>
              <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>{ride?.paymentMethod || 'Cash'} · Rs {ride?.fare || 0}</Text>
            </View>
            {customer.phone ? (
              <Pressable onPress={() => Linking.openURL(`tel:${customer.phone}`)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={18} color="#059669" />
              </Pressable>
            ) : null}
          </View>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}><MapPin size={16} color="#16A34A" /><Text style={{ flex: 1, color: '#0F172A' }}>{ride?.pickupAddress || 'Pickup'}</Text></View>
            <View style={{ flexDirection: 'row', gap: 8 }}><Navigation size={16} color="#DC2626" /><Text style={{ flex: 1, color: '#0F172A' }}>{ride?.dropAddress || 'Drop'}</Text></View>
          </View>
          {target ? (
            <Pressable onPress={() => navigateTo(target)} style={{ borderWidth: 1, borderColor: BLUE, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: BLUE, fontWeight: '800' }}>Open in Google Maps</Text>
            </Pressable>
          ) : null}
        </View>

        {atPickup && rideOtp ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 10 }}>
            <Text style={{ fontWeight: '700', color: '#0F172A' }}>Enter rider OTP</Text>
            <TextInput
              value={otp} onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" maxLength={4} placeholder="----" placeholderTextColor="#AEB5CE"
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingVertical: 12, fontSize: 24, letterSpacing: 14, textAlign: 'center', color: '#0F172A' }}
            />
          </View>
        ) : null}

        {action ? (
          <Pressable disabled={busy} onPress={action.onPress} style={{ backgroundColor: inTrip ? '#16A34A' : BLUE, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: busy ? 0.7 : 1 }}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{action.label}</Text>}
          </Pressable>
        ) : (
          <Pressable onPress={leave} style={{ backgroundColor: BLUE, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Back to home</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
