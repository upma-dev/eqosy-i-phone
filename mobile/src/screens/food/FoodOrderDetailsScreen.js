import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Check, Phone, RotateCcw, Star } from 'lucide-react-native';
import { Text } from '../../components/Text';
import foodApi from '../../api/foodClient';
import { dataOf } from '../../api/foodServices';
import { useCart } from '../../store/cart';
import { subscribe } from '../../lib/socket';
import { normalizeImageUrl } from '../../lib/image';

// Port of web Food/pages/user/orders/UserOrderDetails.jsx + OrderTracking.jsx (status timeline, delivery partner,
// bill, cancel, rate, reorder). Live map, chat and invoice download are not ported yet.
const PRIMARY = '#EB590E';

const STEPS = [
  { key: 'placed', label: 'Order placed', match: ['created', 'pending', 'pending_payment', 'confirmed', 'placed'] },
  { key: 'preparing', label: 'Preparing your food', match: ['preparing', 'accepted'] },
  { key: 'ready', label: 'Ready for pickup', match: ['ready', 'ready_for_pickup'] },
  { key: 'pickedup', label: 'Out for delivery', match: ['picked_up', 'reached_drop', 'out_for_delivery'] },
  { key: 'delivered', label: 'Delivered', match: ['delivered'] },
];
const CANCEL_REASONS = ['Ordered by mistake', 'Taking too long', 'Want to change items', 'Found a better deal', 'Other'];
const CANCELLABLE = ['created', 'pending', 'pending_payment', 'confirmed', 'placed'];

const R = (n) => `₹${Math.round(Number(n) || 0)}`;
const idOf = (v) => String(v?._id || v?.id || v || '');

function Section({ title, children }) {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 8 }}>
      {title ? <Text style={{ fontWeight: '800', fontSize: 15, color: '#111827' }}>{title}</Text> : null}
      {children}
    </View>
  );
}

const Line = ({ label, value, bold, green }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <Text style={{ color: '#4B5563', fontWeight: bold ? '800' : '400' }}>{label}</Text>
    <Text style={{ color: green ? '#16A34A' : '#111827', fontWeight: bold ? '800' : '500' }}>{value}</Text>
  </View>
);

export default function FoodOrderDetailsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const orderKey = String(params?.id || '');
  const [order, setOrder] = useState(params?.order || null);
  const [loading, setLoading] = useState(!params?.order);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [rRest, setRRest] = useState(0);
  const [rDel, setRDel] = useState(0);
  const [comment, setComment] = useState('');
  const loadRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const d = dataOf(await foodApi.get(`/food/orders/${encodeURIComponent(orderKey)}`));
      const o = d?.order || d?.data?.order || d?.data || d;
      if (o && (o._id || o.orderId)) setOrder(o);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderKey]);
  loadRef.current = load;

  useEffect(() => {
    load();
    const poll = setInterval(() => loadRef.current?.(), 10000);
    const off = subscribe({ order_status_update: () => loadRef.current?.(), order_assigned: () => loadRef.current?.() });
    return () => { clearInterval(poll); off(); };
  }, [load]);

  if (loading) return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={PRIMARY} /></SafeAreaView>;
  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontWeight: '700' }}>Order not found</Text>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 14 }}><Text style={{ color: PRIMARY, fontWeight: '700' }}>Go back</Text></Pressable>
      </SafeAreaView>
    );
  }

  const status = String(order.orderStatus || order.status || '').toLowerCase();
  const cancelled = status.startsWith('cancelled');
  const delivered = status === 'delivered';
  const stepIndex = Math.max(0, STEPS.findIndex((s) => s.match.includes(status)));
  const p = order.pricing || {};
  const restaurant = order.restaurantId && typeof order.restaurantId === 'object' ? order.restaurantId : {};
  const restaurantName = order.restaurantName || restaurant.restaurantName || restaurant.name || 'Restaurant';
  const partner = order.deliveryPartnerId && typeof order.deliveryPartnerId === 'object' ? order.deliveryPartnerId : order.deliveryPartner || null;
  const addr = order.deliveryAddress || {};
  const addrText = addr.formattedAddress || [addr.street, addr.additionalDetails, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ');
  const canCancel = CANCELLABLE.includes(status);
  const rated = order.ratings?.restaurant?.rating || order.restaurantRating;

  const reorder = () => {
    const cart = useCart.getState();
    cart.clear();
    const rest = { id: idOf(order.restaurantId), name: restaurantName };
    (order.items || []).forEach((it) => {
      cart.add(
        { id: String(it.itemId || it._id || it.id), name: it.name || 'Item', price: Number(it.price) || 0, image: it.image || '', isVeg: it.isVeg !== false },
        rest,
        it.variantId ? { id: it.variantId, name: it.variantName || '', price: Number(it.price) || 0 } : null,
        it.quantity || 1,
      );
    });
    navigation.navigate('FoodCart');
  };

  const cancel = async (reason) => {
    setBusy(true);
    try {
      await foodApi.patch(`/food/orders/${encodeURIComponent(idOf(order))}/cancel`, { cancellationReason: reason, reason });
      setCancelOpen(false);
      await load();
    } catch (e) {
      Alert.alert('Could not cancel', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitRating = async () => {
    if (!rRest) return Alert.alert('Rating needed', 'Please rate the restaurant.');
    setBusy(true);
    try {
      await foodApi.patch(`/food/orders/${encodeURIComponent(idOf(order))}/ratings`, {
        restaurantRating: rRest,
        deliveryPartnerRating: partner && rDel ? rDel : undefined,
        restaurantComment: comment || undefined,
      });
      setRateOpen(false);
      Alert.alert('Thank you!', 'Thanks for rating your order.');
      await load();
    } catch (e) {
      Alert.alert('Could not submit', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const Stars = ({ value, onChange }) => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Star size={32} color="#FACC15" fill={n <= value ? '#FACC15' : 'none'} />
        </Pressable>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}><ArrowLeft size={20} color="#000" /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827' }} numberOfLines={1}>{restaurantName}</Text>
          <Text style={{ fontSize: 12, color: '#6B7280' }}>Order #{String(order.orderId || order._id).slice(-10)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={PRIMARY} />}>
        <Section>
          {cancelled ? (
            <View>
              <Text style={{ fontWeight: '800', color: '#DC2626', fontSize: 16 }}>Order cancelled</Text>
              {order.cancellationReason ? <Text style={{ color: '#6B7280', marginTop: 4 }}>{order.cancellationReason}</Text> : null}
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {STEPS.map((s, i) => {
                const done = i <= stepIndex;
                return (
                  <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: done ? '#16A34A' : '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                      {done ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
                    </View>
                    <Text style={{ fontWeight: i === stepIndex ? '800' : '500', color: done ? '#111827' : '#9CA3AF' }}>{s.label}</Text>
                  </View>
                );
              })}
              {order.estimatedDeliveryTime && !delivered ? <Text style={{ color: PRIMARY, fontWeight: '700' }}>Arriving in about {order.estimatedDeliveryTime} mins</Text> : null}
            </View>
          )}
        </Section>

        {partner && !cancelled && !delivered ? (
          <Section title="Your delivery partner">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700', color: '#111827' }}>{partner.name || 'Delivery partner'}</Text>
              {partner.phone ? (
                <Pressable onPress={() => Linking.openURL(`tel:${partner.phone}`)} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={18} color="#059669" />
                </Pressable>
              ) : null}
            </View>
          </Section>
        ) : null}

        {order.deliveryOtp || order.dispatch?.deliveryOtp || order.deliveryVerification?.otp ? (
          !cancelled && !delivered ? (
            <Section title="Delivery OTP">
              <Text style={{ fontSize: 26, fontWeight: '900', letterSpacing: 6, color: PRIMARY }}>{order.deliveryOtp || order.dispatch?.deliveryOtp || order.deliveryVerification?.otp}</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Share this with the delivery partner when your food arrives.</Text>
            </Section>
          ) : null
        ) : null}

        <Section title="Items">
          {(order.items || []).map((it, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              {it.image ? <Image2 uri={it.image} /> : null}
              <Text style={{ flex: 1, color: '#111827' }}>{it.quantity || 1} x {it.name}{it.variantName ? ` (${it.variantName})` : ''}</Text>
              <Text style={{ fontWeight: '600' }}>{R((it.price || 0) * (it.quantity || 1))}</Text>
            </View>
          ))}
        </Section>

        <Section title="Bill details">
          <Line label="Item total" value={R(p.subtotal)} />
          <Line label="Delivery partner fee" value={Number(p.deliveryFee) === 0 ? 'FREE' : R(p.deliveryFee)} green={Number(p.deliveryFee) === 0} />
          <Line label="Platform fee" value={R(p.platformFee)} />
          {Number(p.tax) > 0 ? <Line label="GST and restaurant charges" value={R(p.tax)} /> : null}
          {Number(p.discount) > 0 ? <Line label="Discount" value={`-${R(p.discount)}`} green /> : null}
          <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 }} />
          <Line label="Total" value={R(p.total)} bold />
          <Text style={{ color: '#6B7280', fontSize: 12 }}>Paid by {String(order.payment?.method || 'cash').toUpperCase()} · {String(order.payment?.status || '').toLowerCase()}</Text>
        </Section>

        <Section title="Delivery address">
          <Text style={{ color: '#374151' }}>{addrText || 'Address not available'}</Text>
        </Section>

        {canCancel ? (
          <Pressable onPress={() => setCancelOpen(true)} style={{ borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff' }}>
            <Text style={{ color: '#DC2626', fontWeight: '800' }}>Cancel order</Text>
          </Pressable>
        ) : null}

        {delivered ? (
          <View style={{ gap: 10 }}>
            {!rated ? (
              <Pressable onPress={() => setRateOpen(true)} style={{ borderWidth: 1, borderColor: PRIMARY, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff' }}>
                <Text style={{ color: PRIMARY, fontWeight: '800' }}>Rate restaurant & delivery</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={reorder} style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 14 }}>
              <RotateCcw size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '800' }}>Reorder</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={cancelOpen} transparent animationType="slide" onRequestClose={() => setCancelOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={() => setCancelOpen(false)}>
          <Pressable style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 10 }}>
            <Text style={{ fontWeight: '800', fontSize: 16 }}>Why are you cancelling?</Text>
            {CANCEL_REASONS.map((r) => (
              <Pressable key={r} disabled={busy} onPress={() => cancel(r)} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
                <Text style={{ fontWeight: '600' }}>{r}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={rateOpen} transparent animationType="slide" onRequestClose={() => setRateOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={() => setRateOpen(false)}>
          <Pressable style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
            <Text style={{ fontWeight: '800', fontSize: 16 }}>Rate {restaurantName}</Text>
            <Stars value={rRest} onChange={setRRest} />
            {partner ? (<><Text style={{ fontWeight: '700' }}>Rate delivery partner</Text><Stars value={rDel} onChange={setRDel} /></>) : null}
            <TextInput value={comment} onChangeText={setComment} placeholder="Tell us more (optional)" multiline style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, minHeight: 70, textAlignVertical: 'top' }} />
            <Pressable disabled={busy} onPress={submitRating} style={{ backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: busy ? 0.7 : 1 }}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Submit</Text>}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// Small thumbnail used in the item list.
function Image2({ uri }) {
  return <Image source={{ uri: normalizeImageUrl(uri) }} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#F3F4F6' }} />;
}
