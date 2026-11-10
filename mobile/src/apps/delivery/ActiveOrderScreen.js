import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { ArrowLeft, MapPin, Phone, Store } from 'lucide-react-native';
import { Text } from '../../components/Text';
import { deliveryApi, body } from './api';
import { useDelivery, orderKey, orderLabel, tripPhase, restaurantPoint, customerPoint } from './store';
import { subscribe } from '../../lib/socket';

// Port of web DeliveryV2 active trip flow:
// PICKING_UP -> REACHED_PICKUP -> PICKED_UP (confirm order id) -> REACHED_DROP -> delivered (drop OTP).
// Bill photo, QR payment, customer-unreachable and map are not ported yet.
const GREEN = '#1F9D4B';

const TITLES = {
  PICKING_UP: 'Go to restaurant',
  REACHED_PICKUP: 'Collect the order',
  PICKED_UP: 'Deliver to customer',
  REACHED_DROP: 'Hand over the order',
  COMPLETED: 'Delivered',
};

export default function ActiveOrderScreen({ navigation }) {
  const order = useDelivery((s) => s.activeOrder);
  const setActiveOrder = useDelivery((s) => s.setActiveOrder);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');

  const id = orderKey(order);
  const phase = tripPhase(order);

  const leave = useCallback(() => {
    setActiveOrder(null);
    navigation.reset({ index: 0, routes: [{ name: 'DeliveryTabs' }] });
  }, [navigation, setActiveOrder]);

  // Order disappeared (e.g. cancelled by admin): bounce back.
  useEffect(() => { if (!order) leave(); }, [order, leave]);

  useEffect(() => subscribe({
    order_status_update: (o) => {
      if (orderKey(o) !== id) return;
      const st = String(o.orderStatus || o.status || '').toLowerCase();
      if (st === 'cancelled') Alert.alert('Order cancelled', 'This order was cancelled.', [{ text: 'OK', onPress: leave }]);
      else setActiveOrder({ ...useDelivery.getState().activeOrder, ...o, orderMongoId: id });
    },
  }), [id, leave, setActiveOrder]);

  const merge = (res) => {
    const d = body(res);
    const next = d.order || d;
    setActiveOrder({ ...useDelivery.getState().activeOrder, ...next, orderMongoId: id });
  };

  const run = async (fn, after) => {
    setBusy(true);
    try {
      const res = await fn();
      if (after) after(res);
      else merge(res);
      setInput('');
    } catch (e) {
      Alert.alert('Could not update order', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const open = (p) => p && Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`);

  if (!order) return null;

  const rest = restaurantPoint(order);
  const cust = customerPoint(order);
  const cod = String(order.paymentMethod || order.payment?.method || '').toLowerCase() === 'cash';
  const total = Number(order.total || order.pricing?.total || 0);
  const confirmId = orderLabel(order);

  let action = null;
  if (phase === 'PICKING_UP') action = { label: "I've reached the restaurant", onPress: () => run(() => deliveryApi.reachedPickup(id)) };
  else if (phase === 'REACHED_PICKUP') {
    action = {
      label: 'Confirm pickup',
      needsInput: 'Type the order ID shown on the bill',
      onPress: async () => {
        if (input.trim().toLowerCase() !== confirmId.toLowerCase() && input.trim().toLowerCase() !== String(order.orderId || '').toLowerCase()) {
          return Alert.alert('Order ID does not match', `Enter the order ID ${confirmId}.`);
        }
        let loc = {};
        try { const p = await Location.getCurrentPositionAsync({}); loc = { lat: p.coords.latitude, lng: p.coords.longitude }; } catch {}
        run(() => deliveryApi.confirmPickup(id, input.trim(), loc));
      },
    };
  } else if (phase === 'PICKED_UP') action = { label: "I've reached the customer", onPress: () => run(() => deliveryApi.reachedDrop(id)) };
  else if (phase === 'REACHED_DROP') {
    action = {
      label: 'Complete delivery',
      needsInput: "Enter the customer's OTP",
      onPress: () => {
        if (input.trim().length < 4) return Alert.alert('OTP needed', 'Ask the customer for the delivery OTP.');
        run(async () => {
          if (cod) await deliveryApi.collectCash(id).catch(() => {});
          return deliveryApi.verifyDropOtp(id, input.trim());
        }, () => Alert.alert('Order delivered', cod ? `Cash collected: Rs ${total.toFixed(0)}` : 'Great job!', [{ text: 'Done', onPress: leave }]));
      },
    };
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <Pressable onPress={() => navigation.reset({ index: 0, routes: [{ name: 'DeliveryTabs' }] })} style={{ width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} color="#0F172A" />
        </Pressable>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>{TITLES[phase]}</Text>
          <Text style={{ fontSize: 12, color: '#64748B' }}>Order #{confirmId}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
        {['PICKING_UP', 'REACHED_PICKUP'].includes(phase) ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Store size={18} color="#EA580C" /><Text style={{ fontWeight: '800', fontSize: 16, color: '#0F172A', flex: 1 }}>{order.restaurantName || 'Restaurant'}</Text></View>
            <Text style={{ color: '#475569' }}>{order.restaurantAddress || order.restaurantLocation?.address || ''}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {rest ? <Pressable onPress={() => open(rest)} style={{ flex: 1, borderWidth: 1, borderColor: GREEN, borderRadius: 12, paddingVertical: 11, alignItems: 'center' }}><Text style={{ color: GREEN, fontWeight: '800' }}>Navigate</Text></Pressable> : null}
              {order.restaurantPhone ? <Pressable onPress={() => Linking.openURL(`tel:${order.restaurantPhone}`)} style={{ width: 46, borderRadius: 12, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' }}><Phone size={18} color="#059669" /></Pressable> : null}
            </View>
          </View>
        ) : (
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><MapPin size={18} color="#DC2626" /><Text style={{ fontWeight: '800', fontSize: 16, color: '#0F172A', flex: 1 }}>{order.customerName || 'Customer'}</Text></View>
            <Text style={{ color: '#475569' }}>{order.customerAddress || ''}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {cust ? <Pressable onPress={() => open(cust)} style={{ flex: 1, borderWidth: 1, borderColor: GREEN, borderRadius: 12, paddingVertical: 11, alignItems: 'center' }}><Text style={{ color: GREEN, fontWeight: '800' }}>Navigate</Text></Pressable> : null}
              {order.customerPhone ? <Pressable onPress={() => Linking.openURL(`tel:${order.customerPhone}`)} style={{ width: 46, borderRadius: 12, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' }}><Phone size={18} color="#059669" /></Pressable> : null}
            </View>
          </View>
        )}

        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 6 }}>
          <Text style={{ fontWeight: '800', color: '#0F172A' }}>Items</Text>
          {(order.items || []).map((it, i) => (
            <Text key={i} style={{ color: '#475569' }}>{it.quantity || 1} x {it.name}</Text>
          ))}
          {cod ? <Text style={{ marginTop: 6, fontWeight: '800', color: '#B45309' }}>Collect cash: Rs {total.toFixed(0)}</Text> : <Text style={{ marginTop: 6, color: '#059669', fontWeight: '700' }}>Prepaid order</Text>}
        </View>

        {action?.needsInput ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 10 }}>
            <Text style={{ fontWeight: '700', color: '#0F172A' }}>{action.needsInput}</Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              autoCapitalize="characters"
              keyboardType={phase === 'REACHED_DROP' ? 'number-pad' : 'default'}
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, fontSize: 18, color: '#0F172A' }}
            />
          </View>
        ) : null}

        {action ? (
          <Pressable disabled={busy} onPress={action.onPress} style={{ backgroundColor: GREEN, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: busy ? 0.7 : 1 }}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{action.label}</Text>}
          </Pressable>
        ) : (
          <Pressable onPress={leave} style={{ backgroundColor: GREEN, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Back to home</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
