import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { MapPin, Store } from 'lucide-react-native';
import { Text } from '../../components/Text';
import { deliveryApi, body } from './api';
import { useDelivery, orderKey, orderLabel } from './store';
import { useAuth } from '../../store/auth';
import { emit, getSocket, subscribe } from '../../lib/socket';

// Port of web DeliveryV2/pages/DeliveryHomeV2.jsx: duty toggle, live location, new-order offer, resume active order.
// Cash-limit popups, emergency offline, earnings addons, selfie check and map are not ported yet.
const GREEN = '#1F9D4B';
const OFFER_SECONDS = 30;

function OfferCard({ order, busy, onAccept, onPass }) {
  const [left, setLeft] = useState(OFFER_SECONDS);
  useEffect(() => {
    setLeft(OFFER_SECONDS);
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [orderKey(order)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (left <= 0) onPass(true); }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  const earn = Number(order.riderEarning || order.earnings || order.deliveryFee || 0);
  const cod = String(order.paymentMethod || order.payment?.method || '').toLowerCase() === 'cash';
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 2, borderColor: GREEN, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: '800', fontSize: 16, color: '#0F172A' }}>New order #{orderLabel(order)}</Text>
        <View style={{ backgroundColor: '#E9F8EC', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={{ color: GREEN, fontWeight: '800' }}>{Math.max(0, left)}s</Text>
        </View>
      </View>
      <Text style={{ fontSize: 28, fontWeight: '900', color: '#0F172A' }}>Rs {earn.toFixed(0)}</Text>
      <Text style={{ color: '#64748B', fontSize: 12 }}>
        {cod ? `Collect cash Rs ${Number(order.total || order.pricing?.total || 0).toFixed(0)} · ` : 'Prepaid · '}
        {order.pickupDistanceKm != null ? `${order.pickupDistanceKm} km to restaurant` : 'Pickup nearby'}
      </Text>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}><Store size={16} color="#EA580C" /><Text style={{ flex: 1, color: '#0F172A' }}>{order.restaurantName || 'Restaurant'}{order.restaurantAddress ? `, ${order.restaurantAddress}` : ''}</Text></View>
        <View style={{ flexDirection: 'row', gap: 8 }}><MapPin size={16} color="#DC2626" /><Text style={{ flex: 1, color: '#0F172A' }}>{order.customerAddress || 'Customer address'}</Text></View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable onPress={() => onPass(false)} style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ fontWeight: '800', color: '#475569' }}>Pass</Text>
        </Pressable>
        <Pressable disabled={busy} onPress={onAccept} style={{ flex: 2, backgroundColor: GREEN, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: busy ? 0.7 : 1 }}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ fontWeight: '800', color: '#fff' }}>Accept order</Text>}
        </Pressable>
      </View>
    </View>
  );
}

export default function DeliveryHomeScreen() {
  const navigation = useNavigation();
  const { partner, isOnline, setOnline, refresh, setActiveOrder } = useDelivery();
  const authUser = useAuth((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [offer, setOffer] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const offerRef = useRef(null);
  useEffect(() => { offerRef.current = offer; }, [offer]);

  const partnerId = String(partner?._id || partner?.id || authUser?._id || authUser?.id || '');

  const openOrder = useCallback((o) => {
    setActiveOrder(o);
    navigation.navigate('ActiveOrder');
  }, [navigation, setActiveOrder]);

  // Profile, then resume the current order if there is one.
  useEffect(() => {
    let alive = true;
    (async () => {
      await refresh();
      try {
        const d = body(await deliveryApi.currentOrder());
        const o = d.order || d.currentOrder || (d._id || d.orderId ? d : null);
        if (alive && o && orderKey(o)) openOrder(o);
      } catch {}
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [refresh, openOrder]);

  // Socket: join own room, listen for new orders while online.
  useEffect(() => {
    if (!isOnline || !partnerId) return undefined;
    const s = getSocket();
    const join = () => emit('join-delivery', partnerId);
    join();
    s?.on('connect', join);
    const off = subscribe({
      new_order: (o) => setOffer(o),
      new_order_available: (o) => setOffer((cur) => cur || o),
      order_status_update: (o) => {
        const cur = offerRef.current;
        if (cur && orderKey(o) === orderKey(cur) && ['cancelled', 'rejected'].includes(String(o.orderStatus || o.status).toLowerCase())) setOffer(null);
      },
    });
    return () => { s?.off('connect', join); off(); };
  }, [isOnline, partnerId]);

  // Live location while online.
  useEffect(() => {
    if (!isOnline) return undefined;
    let sub;
    let last = 0;
    Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 6000, distanceInterval: 15 }, ({ coords: c }) => {
      if (Date.now() - last < 6000) return;
      last = Date.now();
      deliveryApi.updateLocation(c.latitude, c.longitude, true).catch(() => {});
    }).then((x) => { sub = x; }).catch(() => {});
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
        await deliveryApi.setAvailability(true, { latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setOnline(true);
      } else {
        await deliveryApi.setAvailability(false);
        setOnline(false);
        setOffer(null);
      }
    } catch (e) {
      Alert.alert(next ? 'Cannot go online' : 'Cannot go offline', e?.message || 'Please try again.');
    } finally {
      setToggling(false);
    }
  }, [toggling, setOnline]);

  const accept = async () => {
    if (!offer || accepting) return;
    setAccepting(true);
    try {
      const d = body(await deliveryApi.acceptOrder(orderKey(offer)));
      const full = d.order || d;
      setOffer(null);
      openOrder({ ...offer, ...full, orderMongoId: orderKey(offer) });
    } catch (e) {
      Alert.alert('Could not accept', e?.message || 'This order may have been taken by another partner.');
      setOffer(null);
    } finally {
      setAccepting(false);
    }
  };

  const pass = async (timedOut) => {
    const o = offerRef.current;
    setOffer(null);
    if (o) deliveryApi.rejectOrder(orderKey(o), timedOut ? { reason: 'timeout' } : {}).catch(() => {});
  };

  if (loading) return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={GREEN} /></SafeAreaView>;

  const name = String(partner?.name || authUser?.name || '').split(' ')[0] || 'Partner';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View>
          <Text style={{ color: '#64748B', fontSize: 13 }}>Welcome back</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>{name}</Text>
        </View>

        <View style={{ backgroundColor: isOnline ? '#157A38' : '#fff', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: isOnline ? '#fff' : '#0F172A' }}>{isOnline ? 'You are online' : 'You are offline'}</Text>
            <Text style={{ marginTop: 2, color: isOnline ? '#BBF7D0' : '#64748B', fontSize: 12 }}>{isOnline ? 'Waiting for new orders' : 'Go online to receive orders'}</Text>
          </View>
          {toggling ? <ActivityIndicator color={isOnline ? '#fff' : GREEN} /> : <Switch value={isOnline} onValueChange={toggle} trackColor={{ true: '#4ADE80', false: '#CBD5E1' }} thumbColor="#fff" />}
        </View>

        {offer ? <OfferCard order={offer} busy={accepting} onAccept={accept} onPass={pass} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
