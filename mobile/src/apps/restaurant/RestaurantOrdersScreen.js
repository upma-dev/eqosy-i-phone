import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/Text';
import { restaurantApi, body, uiStatus, orderId, orderLabel, orderTotal } from './api';
import { useRestaurant } from './store';
import { emit, getSocket, subscribe } from '../../lib/socket';

// Port of web Food/pages/restaurant/OrdersMain.jsx (core flow): new -> accept with prep time / reject -> preparing -> mark ready.
// Order detail sheet, printing, rush hour, inventory and sound alerts are not ported yet.
const PINK = '#EC4899';
const TABS = [
  { id: 'new', label: 'New', match: ['confirmed', 'pending', 'created'] },
  { id: 'preparing', label: 'Preparing', match: ['preparing', 'accepted'] },
  { id: 'ready', label: 'Ready', match: ['ready'] },
  { id: 'past', label: 'Past', match: ['out_for_delivery', 'delivered', 'completed', 'cancelled'] },
];
const PREP = [10, 15, 20, 30, 45];
const REASONS = ['Item not available', 'Outside delivery area', 'Kitchen closing soon', 'Technical issue'];

function OrderCard({ order, tab, busy, onAccept, onReject, onReady }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const addr = order.address || order.deliveryAddress || {};
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '800', color: '#0F172A' }}>#{orderLabel(order)}</Text>
        <Text style={{ fontWeight: '800', color: '#0F172A' }}>Rs {orderTotal(order).toFixed(0)}</Text>
      </View>
      <Text style={{ color: '#64748B', fontSize: 12 }}>
        {order.paymentMethod || 'Online'} · {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : ''} · {uiStatus(order).replace(/_/g, ' ')}
      </Text>
      <View style={{ gap: 2 }}>
        {items.map((it, i) => <Text key={i} style={{ color: '#334155' }}>{it.quantity || 1} x {it.name}</Text>)}
      </View>
      {order.note ? <Text style={{ color: '#B45309', fontSize: 12 }}>Note: {order.note}</Text> : null}
      {tab === 'new' ? (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <Pressable disabled={busy} onPress={() => onReject(order)} style={{ flex: 1, borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ color: '#DC2626', fontWeight: '800' }}>Reject</Text>
          </Pressable>
          <Pressable disabled={busy} onPress={() => onAccept(order)} style={{ flex: 2, backgroundColor: PINK, borderRadius: 12, paddingVertical: 12, alignItems: 'center', opacity: busy ? 0.7 : 1 }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Accept</Text>
          </Pressable>
        </View>
      ) : null}
      {tab === 'preparing' ? (
        <Pressable disabled={busy} onPress={() => onReady(order)} style={{ backgroundColor: '#16A34A', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4, opacity: busy ? 0.7 : 1 }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Mark ready</Text>
        </Pressable>
      ) : null}
      {addr?.street || addr?.city ? <Text style={{ color: '#94A3B8', fontSize: 11 }}>{[addr.street, addr.city].filter(Boolean).join(', ')}</Text> : null}
    </View>
  );
}

export default function RestaurantOrdersScreen() {
  const { restaurant, accepting, setAccepting, refresh } = useRestaurant();
  const [tab, setTab] = useState('new');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [pick, setPick] = useState(null); // { order, mode: 'accept' | 'reject' }
  const loadRef = useRef(null);

  const restaurantId = String(restaurant?._id || restaurant?.id || '');

  const load = useCallback(async () => {
    try {
      const d = body(await restaurantApi.orders());
      setOrders(Array.isArray(d.data) ? d.data : Array.isArray(d.orders) ? d.orders : Array.isArray(d) ? d : []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  loadRef.current = load;

  useEffect(() => { refresh(); load(); }, [refresh, load]);

  // Join the restaurant room; reload when an order arrives or changes.
  useEffect(() => {
    if (!restaurantId) return undefined;
    const s = getSocket();
    const join = () => emit('join-restaurant', restaurantId);
    join();
    s?.on('connect', join);
    const off = subscribe({
      new_order: () => { setTab('new'); loadRef.current?.(); },
      order_status_update: () => loadRef.current?.(),
    });
    const poll = setInterval(() => loadRef.current?.(), 20000);
    return () => { s?.off('connect', join); off(); clearInterval(poll); };
  }, [restaurantId]);

  const act = async (id, fn) => {
    setBusyId(id);
    try {
      await fn();
      await load();
    } catch (e) {
      Alert.alert('Could not update order', e?.message || 'Please try again.');
    } finally {
      setBusyId('');
      setPick(null);
    }
  };

  const toggleAccepting = async (next) => {
    const prev = accepting;
    setAccepting(next);
    try {
      await restaurantApi.setAccepting(next);
    } catch (e) {
      setAccepting(prev);
      Alert.alert('Could not change status', e?.message || 'Please try again.');
    }
  };

  if (loading) return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={PINK} /></SafeAreaView>;

  const current = TABS.find((t) => t.id === tab);
  const list = orders.filter((o) => current.match.includes(uiStatus(o)));
  const counts = Object.fromEntries(TABS.map((t) => [t.id, orders.filter((o) => t.match.includes(uiStatus(o))).length]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }} edges={['top']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>{restaurant?.restaurantName || restaurant?.name || 'Orders'}</Text>
            <Text style={{ color: accepting ? '#16A34A' : '#DC2626', fontSize: 12, fontWeight: '700' }}>{accepting ? 'Accepting orders' : 'Not accepting orders'}</Text>
          </View>
          <Switch value={accepting} onValueChange={toggleAccepting} trackColor={{ true: '#F9A8D4', false: '#CBD5E1' }} thumbColor={accepting ? PINK : '#fff'} />
        </View>

        <View style={{ flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 14, padding: 4 }}>
          {TABS.map((t) => (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: tab === t.id ? '#fff' : 'transparent' }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: tab === t.id ? PINK : '#64748B' }}>{t.label}{counts[t.id] ? ` (${counts[t.id]})` : ''}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={PINK} />}>
        {list.length === 0 ? <Text style={{ color: '#94A3B8', textAlign: 'center', marginTop: 40 }}>No orders here.</Text> : null}
        {list.map((o) => (
          <OrderCard
            key={orderId(o)}
            order={o}
            tab={tab}
            busy={busyId === orderId(o)}
            onAccept={(order) => setPick({ order, mode: 'accept' })}
            onReject={(order) => setPick({ order, mode: 'reject' })}
            onReady={(order) => act(orderId(order), () => restaurantApi.markReady(orderId(order)))}
          />
        ))}
      </ScrollView>

      <Modal visible={!!pick} transparent animationType="slide" onRequestClose={() => setPick(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={() => setPick(null)}>
          <Pressable style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 10 }}>
            <Text style={{ fontWeight: '800', fontSize: 16, color: '#0F172A' }}>{pick?.mode === 'accept' ? 'Preparation time' : 'Reason for rejecting'}</Text>
            {pick?.mode === 'accept'
              ? PREP.map((m) => (
                <Pressable key={m} onPress={() => act(orderId(pick.order), () => restaurantApi.accept(orderId(pick.order), m))} style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
                  <Text style={{ fontWeight: '700', color: '#0F172A' }}>{m} minutes</Text>
                </Pressable>
              ))
              : REASONS.map((r) => (
                <Pressable key={r} onPress={() => act(orderId(pick.order), () => restaurantApi.reject(orderId(pick.order), r))} style={{ borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
                  <Text style={{ fontWeight: '700', color: '#DC2626' }}>{r}</Text>
                </Pressable>
              ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
