import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { MapPin, Navigation } from 'lucide-react-native';
import { Text } from '../../components/Text';
import { driverApi, pick } from './api';
import { useDriver } from './store';
import { getSocket, subscribe, emit } from '../../lib/socket';

// Port of web Taxi/modules/driver/pages/DriverHome.jsx (duty toggle, live location, incoming ride request).
// Bidding, scheduled rides, bus/owner modes and the selfie check are not ported yet.
const BLUE = '#3B6BF0';
const DEFAULT_SECONDS = 15;

const fmtPoint = (p, fallback) => (Array.isArray(p?.coordinates) ? `${p.coordinates[1].toFixed(4)}, ${p.coordinates[0].toFixed(4)}` : fallback);

function RequestCard({ request, accepting, onAccept, onDecline }) {
  const [left, setLeft] = useState(request.seconds);
  useEffect(() => {
    setLeft(request.seconds);
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [request.rideId, request.seconds]);
  useEffect(() => { if (left <= 0) onDecline('timeout'); }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 2, borderColor: BLUE, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: '800', fontSize: 16, color: '#0F172A' }}>{request.title}</Text>
        <View style={{ backgroundColor: '#EEF2FF', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={{ color: BLUE, fontWeight: '800' }}>{Math.max(0, left)}s</Text>
        </View>
      </View>
      <Text style={{ fontSize: 28, fontWeight: '900', color: '#0F172A' }}>Rs {request.fare}</Text>
      <Text style={{ color: '#64748B', fontSize: 12 }}>{request.payment} · {request.distance}</Text>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}><MapPin size={16} color="#16A34A" /><Text style={{ flex: 1, color: '#0F172A' }}>{request.pickup}</Text></View>
        <View style={{ flexDirection: 'row', gap: 8 }}><Navigation size={16} color="#DC2626" /><Text style={{ flex: 1, color: '#0F172A' }}>{request.drop}</Text></View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable onPress={() => onDecline('rejected')} style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ fontWeight: '800', color: '#475569' }}>Decline</Text>
        </Pressable>
        <Pressable disabled={accepting} onPress={onAccept} style={{ flex: 2, backgroundColor: BLUE, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: accepting ? 0.7 : 1 }}>
          {accepting ? <ActivityIndicator color="#fff" /> : <Text style={{ fontWeight: '800', color: '#fff' }}>Accept</Text>}
        </Pressable>
      </View>
    </View>
  );
}

export default function DriverHomeScreen() {
  const navigation = useNavigation();
  const { driver, isOnline, setOnline, refresh } = useDriver();
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [status, setStatus] = useState('');
  const [request, setRequest] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const requestRef = useRef(null);
  const acceptingRef = useRef('');

  useEffect(() => { requestRef.current = request; }, [request]);

  // Load profile, then resume an ongoing ride if there is one.
  useEffect(() => {
    let alive = true;
    (async () => {
      await refresh();
      try {
        const ride = pick(await driverApi.activeRide());
        const id = ride?.rideId || ride?.id || ride?._id;
        if (alive && id && !['completed', 'cancelled'].includes(String(ride.status || ride.liveStatus || '').toLowerCase())) {
          navigation.navigate('ActiveTrip', { rideId: String(id), snapshot: ride });
        }
      } catch {}
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [refresh, navigation]);

  // Socket: ride requests while online.
  useEffect(() => {
    if (!isOnline) return undefined;
    getSocket();
    return subscribe({
      rideRequest: (d) => {
        setRequest({
          rideId: d.rideId,
          title: d.bookingMode === 'parcel' || d.serviceType === 'parcel' ? 'Parcel request' : 'Ride request',
          fare: d.fare || 0,
          payment: d.paymentMethod || 'Cash',
          pickup: d.pickupAddress || fmtPoint(d.pickupLocation, 'Pickup location'),
          drop: d.dropAddress || fmtPoint(d.dropLocation, 'Drop location'),
          distance: d.distanceText || (d.distanceKm ? `${Number(d.distanceKm).toFixed(1)} km` : 'Distance n/a'),
          seconds: Number(d.acceptRejectDurationSeconds || d.expiresInSeconds) || DEFAULT_SECONDS,
          raw: d,
        });
      },
      rideRequestClosed: ({ rideId } = {}) => {
        if (acceptingRef.current && acceptingRef.current === rideId) return;
        if (!rideId || requestRef.current?.rideId === rideId) setRequest(null);
      },
      rideAccepted: (d) => {
        const id = d?.rideId || d?.id || d?._id || acceptingRef.current;
        acceptingRef.current = '';
        setAccepting(false);
        setRequest(null);
        if (id) navigation.navigate('ActiveTrip', { rideId: String(id), snapshot: d });
      },
      error: ({ message } = {}) => {
        if (String(message || '').toLowerCase().includes('no longer available')) setRequest(null);
        acceptingRef.current = '';
        setAccepting(false);
      },
    });
  }, [isOnline, navigation]);

  // Live location while online: socket when connected, REST fallback otherwise (web: syncLocationPayload).
  useEffect(() => {
    if (!isOnline) return undefined;
    let sub;
    let lastRest = 0;
    (async () => {
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 10 },
        ({ coords: c }) => {
          const payload = { coordinates: [c.longitude, c.latitude], lat: c.latitude, lng: c.longitude, heading: c.heading || 0, speed: c.speed || 0 };
          const s = getSocket();
          if (s?.connected) emit('locationUpdate', payload);
          else if (Date.now() - lastRest > 12000) {
            lastRest = Date.now();
            driverApi.pushLocation(payload.coordinates, c.latitude, c.longitude).catch(() => {});
          }
        },
      ).catch(() => null);
    })();
    return () => { sub?.remove?.(); };
  }, [isOnline]);

  const toggle = useCallback(async (next) => {
    if (toggling) return;
    setToggling(true);
    try {
      if (next) {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') throw new Error('Location permission is needed to go online.');
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setStatus('Going online...');
        const d = pick(await driverApi.goOnline([pos.coords.longitude, pos.coords.latitude]));
        setOnline(Boolean(d?.isOnline ?? true));
        setStatus('You are online. Waiting for requests.');
      } else {
        setStatus('Going offline...');
        await driverApi.goOffline();
        setOnline(false);
        setRequest(null);
        setStatus('You are offline.');
      }
    } catch (e) {
      Alert.alert(next ? 'Cannot go online' : 'Cannot go offline', e?.message || 'Please try again.');
      setStatus('');
    } finally {
      setToggling(false);
    }
  }, [toggling, setOnline]);

  const accept = () => {
    if (!request || accepting) return;
    acceptingRef.current = request.rideId;
    setAccepting(true);
    emit('acceptRide', { rideId: request.rideId });
  };
  const decline = (reason) => {
    if (request?.rideId) emit('rejectRide', { rideId: request.rideId, reason: reason === 'timeout' ? 'timeout' : 'rejected' });
    setRequest(null);
    setAccepting(false);
    acceptingRef.current = '';
  };

  if (loading) {
    return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={BLUE} /></SafeAreaView>;
  }

  const name = String(driver?.name || driver?.fullName || '').split(' ')[0] || 'Driver';
  const approved = !driver?.approvalStatus || ['approved', 'active'].includes(String(driver.approvalStatus).toLowerCase());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View>
          <Text style={{ color: '#64748B', fontSize: 13 }}>Welcome back</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>{name}</Text>
        </View>

        <View style={{ backgroundColor: isOnline ? '#1E3A8A' : '#fff', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: isOnline ? '#fff' : '#0F172A' }}>{isOnline ? 'You are online' : 'You are offline'}</Text>
            <Text style={{ marginTop: 2, color: isOnline ? '#BFDBFE' : '#64748B', fontSize: 12 }}>{status || (isOnline ? 'Waiting for ride requests' : 'Go online to receive requests')}</Text>
          </View>
          {toggling ? <ActivityIndicator color={isOnline ? '#fff' : BLUE} /> : <Switch value={isOnline} onValueChange={toggle} trackColor={{ true: '#60A5FA', false: '#CBD5E1' }} thumbColor="#fff" disabled={!approved} />}
        </View>

        {!approved ? (
          <View style={{ backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FDE68A' }}>
            <Text style={{ color: '#92400E', fontWeight: '700' }}>Account under review</Text>
            <Text style={{ color: '#92400E', marginTop: 4, fontSize: 12 }}>You can go online once the admin approves your documents.</Text>
          </View>
        ) : null}

        {request ? <RequestCard request={request} accepting={accepting} onAccept={accept} onDecline={decline} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
