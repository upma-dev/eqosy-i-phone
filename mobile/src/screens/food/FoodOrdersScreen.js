import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AlertCircle, ArrowLeft, ChevronRight, Clock, RotateCcw, Star } from 'lucide-react-native';
import { Text } from '../../components/Text';
import foodApi from '../../api/foodClient';
import { dataOf } from '../../api/foodServices';
import { normalizeImageUrl } from '../../lib/image';

// Port of web Food/pages/user/orders/Orders.jsx (order history cards, same fields and wording).
const PRIMARY = '#EB590E';
const money = (n) => `₹${Number(n || 0).toFixed(2)}`;
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=100&q=80';

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
};

function normalize(o) {
  const status = String(o.orderStatus || o.status || '');
  const cancelled = /^cancelled/.test(status);
  const by = String(o.cancelledBy || '').toLowerCase();
  const reason = String(o.cancellationReason || '');
  const admin = cancelled && (by === 'admin' || status === 'cancelled_by_admin');
  const restaurantCancelled = cancelled && !admin && (by === 'restaurant' || status === 'cancelled_by_restaurant' || /rejected by restaurant|restaurant (rejected|cancelled)|restaurant is too busy|item not available|outside delivery area|kitchen closing/i.test(reason));
  const user = cancelled && !admin && !restaurantCancelled && by === 'user';
  const p = o.pricing || {};
  return {
    ...o,
    id: o._id?.toString() || o.orderId,
    orderId: o.orderId || o._id?.toString(),
    status,
    delivered: status === 'delivered',
    cancelled,
    admin,
    restaurantCancelled,
    user,
    paymentFailed: o.payment?.status === 'failed',
    items: (o.items || []).map((it) => ({
      id: it.itemId || it._id || it.id,
      name: it.name || it.foodName || 'Item',
      variantName: it.variantName || '',
      quantity: it.quantity || 1,
      price: it.price || 0,
      image: it.image ? normalizeImageUrl(it.image) : null,
      isVeg: it.isVeg ?? !/non/i.test(String(it.foodType || it.type || '')),
    })),
    subtotal: p.subtotal || 0,
    deliveryFee: p.deliveryFee || 0,
    platformFee: p.platformFee || o.platformFee || 0,
    tax: p.tax || 0,
    surgeAmount: p.surgeAmount || 0,
    surgeTitle: o.surgeTitle || p.surgeTitle || 'Surge Charge',
    discount: p.discount || 0,
    couponCode: p.couponCode || null,
    total: p.total || o.total || 0,
    restaurant: o.restaurantId?.restaurantName || o.restaurantId?.name || o.restaurantName || 'Restaurant',
    restaurantImage: o.restaurantImage ? normalizeImageUrl(o.restaurantImage) : null,
    location: o.restaurantLocation?.formattedAddress || (typeof o.restaurantLocation === 'string' ? o.restaurantLocation : '') || [o.address?.city, o.address?.state].filter(Boolean).join(', ') || 'Location not available',
    restaurantRating: o.ratings?.restaurant?.rating || null,
    deliveryRating: o.ratings?.deliveryPartner?.rating || null,
  };
}

const Line = ({ label, value, green, free }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
    <Text style={{ fontSize: 12, color: green ? '#16A34A' : '#4B5563' }}>{label}</Text>
    <Text style={{ fontSize: 12, fontWeight: '500', color: free ? PRIMARY : green ? '#16A34A' : '#1F2937' }}>{value}</Text>
  </View>
);

function OrderCard({ order, onDetails, navigation }) {
  const paymentMethod = order.payment?.method;
  const methodLabel = paymentMethod === 'cash' || paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'wallet' ? 'Wallet' : paymentMethod === 'razorpay' ? 'Online' : paymentMethod || 'N/A';
  const pst = order.payment?.status;
  const paid = pst === 'completed' || (pst === 'cod_pending' && order.delivered);
  const statusLabel = { preparing: 'Preparing', outForDelivery: 'Out for delivery', confirmed: 'Order confirmed', placed: 'Order placed' }[order.status] || 'In progress';

  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
      {/* Header: restaurant */}
      <View style={{ flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 8 }}>
        <View style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
          <Image source={{ uri: order.items[0]?.image || order.restaurantImage || FALLBACK_IMG }} style={{ width: '100%', height: '100%' }} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937', lineHeight: 22 }}>{order.restaurant}</Text>
          <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Order ID: <Text style={{ fontWeight: '600', color: '#374151', fontSize: 11 }}>{order.orderId}</Text></Text>
          <Text numberOfLines={1} style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{order.location}</Text>
          {order.deliveryPartnerName ? (
            <Text style={{ fontSize: 12, color: '#4B5563', marginTop: 4 }}>
              <Text style={{ fontWeight: '500', fontSize: 12 }}>Delivery:</Text> {order.deliveryPartnerName}{order.deliveryPartnerPhone ? ` | ${order.deliveryPartnerPhone}` : ''}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB', borderStyle: 'dashed', marginHorizontal: 16, marginVertical: 4 }} />

      {/* Items */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
        {order.items.length ? order.items.map((it, i) => (
          <View key={String(it.id || i)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            {it.image ? <Image source={{ uri: it.image }} style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#F3F4F6' }} /> : null}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ width: 16, height: 16, borderWidth: 1, borderColor: it.isVeg ? '#16A34A' : '#DC2626', alignItems: 'center', justifyContent: 'center', padding: 2, marginTop: 2 }}>
                <View style={{ width: '100%', height: '100%', borderRadius: 99, backgroundColor: it.isVeg ? '#16A34A' : '#DC2626' }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#1F2937' }}>{it.quantity} x {it.name}</Text>
                {it.variantName ? <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{it.variantName}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>{money(it.quantity * it.price)}</Text>
                {it.quantity > 1 ? <Text style={{ fontSize: 12, color: '#6B7280' }}>{money(it.price)} each</Text> : null}
              </View>
            </View>
          </View>
        )) : <Text style={{ fontSize: 14, color: '#6B7280' }}>No items found</Text>}
      </View>

      {/* Bill summary */}
      <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, marginHorizontal: 16, marginBottom: 8, padding: 12 }}>
        {order.subtotal > 0 ? <Line label="Subtotal" value={money(order.subtotal)} /> : null}
        <Line label="Delivery partner fee" value={Number(order.deliveryFee) === 0 ? 'FREE' : money(order.deliveryFee)} free={Number(order.deliveryFee) === 0} />
        {order.platformFee > 0 ? <Line label="Platform Fee" value={money(order.platformFee)} /> : null}
        {order.tax > 0 ? <Line label="Tax" value={money(order.tax)} /> : null}
        {order.surgeAmount > 0 ? <Line label={order.surgeTitle} value={money(order.surgeAmount)} /> : null}
        {order.discount > 0 ? <Line label="Discount" value={`-${money(order.discount)}`} green /> : null}
        {order.couponCode ? <Line label="Coupon Applied" value={order.couponCode} /> : null}
        <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 8, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>Total</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{money(order.total)}</Text>
        </View>
      </View>

      {/* Date + payment */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Order placed on {fmtDate(order.createdAt)}</Text>
          {order.deliveredAt ? <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Delivered on {fmtDate(order.deliveredAt)}</Text> : null}
          {order.payment?.method ? (
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
              Payment: <Text style={{ fontSize: 12, fontWeight: '500' }}>{methodLabel}</Text>
              {pst ? `  ${order.paymentFailed ? 'failed' : paid ? 'paid' : pst === 'pending' || pst === 'cod_pending' ? 'pending' : pst}` : ''}
            </Text>
          ) : null}
          {order.delivered && !order.paymentFailed ? <Text style={{ fontSize: 12, fontWeight: '500', color: '#16A34A', marginTop: 4 }}>Delivered</Text> : null}
          {order.restaurantCancelled ? <Text style={{ fontSize: 12, fontWeight: '500', color: '#EF4444', marginTop: 4 }}>Restaurant Cancelled</Text> : null}
          {order.user ? <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginTop: 4 }}>Cancelled by you</Text> : null}
          {order.admin ? <Text style={{ fontSize: 12, fontWeight: '500', color: '#EF4444', marginTop: 4 }}>Cancelled by Admin</Text> : null}
          {order.cancelled && !order.restaurantCancelled && !order.user && !order.admin ? <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginTop: 4 }}>Cancelled</Text> : null}
        </View>
        <Pressable onPress={onDetails} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '500', color: PRIMARY }}>View Details</Text>
          <ChevronRight size={16} color={PRIMARY} />
        </Pressable>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6', marginHorizontal: 16 }} />

      {/* Footer */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {order.restaurantCancelled ? (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ backgroundColor: '#FEE2E2', padding: 4, borderRadius: 99 }}><AlertCircle size={16} color="#EF4444" /></View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444' }}>Restaurant Cancelled</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#4B5563', marginLeft: 28, marginTop: 4 }}>Refund will be processed in 24-48 hours</Text>
          </View>
        ) : order.paymentFailed ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: '#FEE2E2', padding: 4, borderRadius: 99 }}><AlertCircle size={16} color="#EF4444" /></View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444' }}>Payment failed</Text>
          </View>
        ) : order.delivered && order.restaurantRating ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 14, color: '#1F2937' }}>You rated</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#FACC15', paddingHorizontal: 4, borderRadius: 4, height: 16 }}>
              <Text style={{ color: '#fff', fontSize: 10 }}>R {order.restaurantRating}</Text><Star size={8} color="#fff" fill="#fff" />
            </View>
          </View>
        ) : order.delivered ? (
          <View>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>Order delivered</Text>
            <Pressable onPress={() => navigation.navigate('FoodOrderDetails', { id: order.id, order })}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: PRIMARY, marginTop: 2 }}>Rate restaurant & delivery &gt;</Text>
            </Pressable>
          </View>
        ) : order.cancelled ? <View /> : (
          <View>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>{statusLabel}</Text>
            {order.estimatedDeliveryTime ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Clock size={12} color={PRIMARY} />
                <Text style={{ fontSize: 12, fontWeight: '500', color: PRIMARY }}>{order.estimatedDeliveryTime} mins remaining</Text>
              </View>
            ) : null}
          </View>
        )}

        {order.delivered && !order.paymentFailed ? (
          <Pressable onPress={() => navigation.navigate('FoodOrderDetails', { id: order.id, order })} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
            <RotateCcw size={14} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>Reorder</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function FoodOrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await foodApi.get('/food/orders', { params: { limit: 100, page: 1 } });
      const d = dataOf(res);
      const list = d?.data?.orders || d?.orders || (Array.isArray(d?.data) ? d.data : []);
      setOrders(list.map(normalize).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <Pressable onPress={() => navigation.goBack()}><ArrowLeft size={20} color="#000" /></Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Your orders</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={PRIMARY} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={PRIMARY} />}
        >
          {orders.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 64 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151' }}>No orders yet</Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Your food orders will show up here.</Text>
            </View>
          ) : orders.map((o) => <OrderCard key={o.id} order={o} navigation={navigation} onDetails={() => navigation.navigate('FoodOrderDetails', { id: o.id, order: o })} />)}
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Text style={{ fontSize: 36, fontWeight: '900', color: '#E5E7EB', fontStyle: 'italic', letterSpacing: -1 }}>Eqosy</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
