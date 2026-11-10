import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Banknote, ChevronRight, FileText, MapPin, Minus, Plus, ShoppingBag, Wallet } from 'lucide-react-native';
import { Text } from '../../components/Text';
import foodApi from '../../api/foodClient';
import { dataOf } from '../../api/foodServices';
import { useCart } from '../../store/cart';
import { useZone } from '../../store/zone';
import { useAuth } from '../../store/auth';
import { useLocationStore } from '../../store/location';
import { normalizeImageUrl } from '../../lib/image';

// Port of web Food/pages/user/cart/Cart.jsx: items, note + cutlery, delivery address, bill details, payment, Place Order.
const PRIMARY = '#EB590E';
const R = (n) => `₹${Number(n || 0).toFixed(2)}`;

export default function FoodCartScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { items, setQuantity, clear } = useCart();
  const zoneId = useZone((z) => z.zoneId);
  const user = useAuth((s) => s.user);
  const { coords, title: locTitle, subtitle: locSub } = useLocationStore();

  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [cutlery, setCutlery] = useState(true);
  const [showBill, setShowBill] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [address, setAddress] = useState(null);
  const [pickAddress, setPickAddress] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [pricingError, setPricingError] = useState('');
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [wallet, setWallet] = useState(0);
  const [method, setMethod] = useState('cash');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(null);

  const restaurantId = items[0]?.restaurantId;
  const restaurantName = items[0]?.restaurant;
  const subtotal = items.reduce((n, l) => n + l.price * l.quantity, 0);

  // Saved addresses; fall back to the current GPS location when the user has none.
  useEffect(() => {
    (async () => {
      try {
        const res = await foodApi.get('/food/user/addresses');
        const d = dataOf(res);
        const list = d?.data?.addresses || d?.addresses || (Array.isArray(d?.data) ? d.data : []);
        setAddresses(Array.isArray(list) ? list : []);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setAddress(def);
      } catch {}
      try {
        const w = dataOf(await foodApi.get('/food/user/wallet'));
        setWallet(Number(w?.data?.wallet?.balance ?? w?.data?.balance ?? w?.wallet?.balance ?? 0));
      } catch {}
    })();
  }, []);

  const currentAddress = useMemo(
    () => (coords ? { label: 'Other', formattedAddress: [locTitle, locSub].filter(Boolean).join(', '), latitude: coords.latitude, longitude: coords.longitude, location: { latitude: coords.latitude, longitude: coords.longitude } } : null),
    [coords, locTitle, locSub],
  );
  // Backend only accepts Home | Office | Other for deliveryAddress.label.
  const deliverTo = useMemo(() => {
    const a = address || currentAddress;
    if (!a) return null;
    const raw = String(a.label || a.type || '').trim().toLowerCase();
    const label = raw === 'home' ? 'Home' : raw === 'office' || raw === 'work' ? 'Office' : 'Other';
    return { ...a, label };
  }, [address, currentAddress]);

  const orderItems = useMemo(
    () =>
      items.map((l) => ({
        itemId: l.itemId, name: l.name, price: l.price, variantId: l.variantId || undefined, variantName: l.variantName || undefined,
        variantPrice: l.price, quantity: l.quantity, image: l.image, isVeg: l.isVeg !== false, isAddon: false,
      })),
    [items],
  );

  // Pricing always comes from the backend (same /food/orders/calculate call as web).
  useEffect(() => {
    if (!items.length || !restaurantId || !deliverTo) { setPricing(null); return undefined; }
    let alive = true;
    setLoadingPricing(true);
    foodApi
      .post('/food/orders/calculate', { items: orderItems, restaurantId, deliveryAddress: deliverTo, zoneId: zoneId || undefined })
      .then((res) => {
        if (!alive) return;
        const pd = dataOf(res);
        const p = pd?.pricing || pd?.data?.pricing;
        if (p) { setPricing(p); setPricingError(''); }
      })
      .catch((e) => { if (alive) { setPricing(null); setPricingError(e?.message || 'Delivery unavailable for the selected address.'); } })
      .finally(() => alive && setLoadingPricing(false));
    return () => { alive = false; };
  }, [orderItems, restaurantId, deliverTo, zoneId, items.length]);

  const total = pricing?.total ?? subtotal;
  const savings = Number(pricing?.discount || 0);
  const canPlace = items.length > 0 && !!pricing && !placing && !pricingError;

  const place = useCallback(async () => {
    if (!canPlace) return;
    if (method === 'wallet' && wallet < total) {
      return Alert.alert('Insufficient wallet balance', `Required ₹${Math.round(total)}, available ₹${Math.round(wallet)}.`);
    }
    if (method === 'razorpay') return Alert.alert('Online payment', 'Online payment needs the Razorpay build. Please use Cash on Delivery or Wallet for now.');
    setPlacing(true);
    try {
      const name = user?.name || '';
      const phone = user?.phone || deliverTo?.phone || '';
      const res = await foodApi.post('/food/orders', {
        items: orderItems,
        address: { ...deliverTo, phone, name, fullName: name },
        customerName: name,
        customerPhone: phone,
        restaurantId,
        restaurantName: restaurantName || undefined,
        pricing,
        note: note || '',
        sendCutlery: cutlery !== false,
        paymentMethod: method,
        zoneId: zoneId || undefined,
      });
      const rd = dataOf(res);
      const order = rd?.order || rd?.data?.order || rd?.data || rd || {};
      clear();
      setPlaced(String(order?.orderId || order?._id || ''));
    } catch (e) {
      Alert.alert('Could not place order', e?.message || 'Please try again.');
    } finally {
      setPlacing(false);
    }
  }, [canPlace, method, wallet, total, user, deliverTo, orderItems, restaurantId, restaurantName, pricing, note, cutlery, zoneId, clear]);

  if (placed !== null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 48, color: '#16A34A' }}>✓</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827' }}>Order placed!</Text>
        {placed ? <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>Order ID: {placed}</Text> : null}
        <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' }}>The restaurant will confirm your order shortly.</Text>
        <Pressable onPress={() => navigation.replace('FoodOrders')} style={{ marginTop: 28, backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>View my orders</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('FoodTabs')} style={{ marginTop: 14 }}><Text style={{ color: '#6B7280', fontWeight: '600' }}>Back to home</Text></Pressable>
      </SafeAreaView>
    );
  }

  if (!items.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 16 }}><ArrowLeft size={22} color="#000" /></Pressable>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <ShoppingBag size={64} color="#D1D5DB" />
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 16 }}>Your cart is empty</Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 6 }}>Add something delicious to get started.</Text>
          <Pressable onPress={() => navigation.navigate('FoodTabs')} style={{ marginTop: 24, backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Browse restaurants</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const Card = ({ children, style }) => (
    <View style={[{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }, style]}>{children}</View>
  );
  const Row = ({ label, value, free }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ fontSize: 14, color: '#4B5563' }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '500', color: free ? PRIMARY : '#1F2937' }}>{value}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
          <Pressable onPress={() => navigation.goBack()}><ArrowLeft size={22} color="#000" /></Pressable>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{restaurantName}</Text>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>{items.length} item{items.length > 1 ? 's' : ''} in cart</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 220 }}>
        {/* Items */}
        <Card>
          {items.map((l, idx) => (
            <View key={l.lineItemId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: idx ? 1 : 0, borderTopColor: '#F3F4F6' }}>
              {l.image ? <Image source={{ uri: normalizeImageUrl(l.image) }} style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#F3F4F6' }} /> : null}
              <View style={{ width: 14, height: 14, borderWidth: 1.5, borderColor: l.isVeg ? '#16A34A' : '#DC2626', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: l.isVeg ? '#16A34A' : '#DC2626' }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>{l.name}</Text>
                {l.variantName ? <Text style={{ fontSize: 12, color: '#6B7280' }}>{l.variantName}</Text> : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: PRIMARY, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Pressable onPress={() => setQuantity(l.lineItemId, l.quantity - 1)} hitSlop={8}><Minus size={14} color={PRIMARY} /></Pressable>
                <Text style={{ fontSize: 14, fontWeight: '700', color: PRIMARY }}>{l.quantity}</Text>
                <Pressable onPress={() => setQuantity(l.lineItemId, l.quantity + 1)} hitSlop={8}><Plus size={14} color={PRIMARY} strokeWidth={3} /></Pressable>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', minWidth: 52, textAlign: 'right' }}>₹{Math.round(l.price * l.quantity)}</Text>
            </View>
          ))}
          <Pressable onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
            <Plus size={16} color={PRIMARY} /><Text style={{ fontSize: 14, fontWeight: '500', color: PRIMARY }}>Add more items</Text>
          </Pressable>
        </Card>

        {/* Note + cutlery */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={() => setShowNote(!showNote)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' }}>
            <FileText size={16} color="#6B7280" />
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: '#4B5563' }}>{note || 'Add a note for the delivery partner'}</Text>
          </Pressable>
          <Pressable onPress={() => setCutlery(!cutlery)} style={{ paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: cutlery ? '#BBF7D0' : '#E5E7EB', backgroundColor: cutlery ? '#F0FDF4' : '#fff', justifyContent: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: cutlery ? '#15803D' : '#4B5563' }}>{cutlery ? 'Send cutlery' : "Don't send cutlery"}</Text>
          </Pressable>
        </View>
        {showNote ? (
          <TextInput value={note} onChangeText={setNote} placeholder="e.g. Please ring the bell" placeholderTextColor="#9CA3AF" multiline style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 12, minHeight: 64, fontSize: 14 }} />
        ) : null}

        {/* Delivery address */}
        <Pressable onPress={() => addresses.length && setPickAddress(true)}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <MapPin size={20} color={PRIMARY} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Delivery at {deliverTo?.label || deliverTo?.type || 'Home'}</Text>
              <Text numberOfLines={2} style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{deliverTo?.formattedAddress || [deliverTo?.street, deliverTo?.city].filter(Boolean).join(', ') || 'Set your location'}</Text>
            </View>
            {addresses.length ? <Text style={{ fontSize: 12, fontWeight: '700', color: PRIMARY }}>Change</Text> : null}
          </Card>
        </Pressable>

        {/* Bill */}
        <Card>
          <Pressable onPress={() => setShowBill(!showBill)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <FileText size={20} color="#6B7280" />
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>Total Bill</Text>
                  {loadingPricing ? <ActivityIndicator size="small" color={PRIMARY} /> : <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>₹{Math.round(total)}</Text>}
                  {savings > 0 ? <Text style={{ fontSize: 11, backgroundColor: '#DBEAFE', color: '#1D4ED8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' }}>You saved ₹{Math.round(savings)}</Text> : null}
                </View>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Incl. taxes and charges</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" style={{ transform: [{ rotate: showBill ? '90deg' : '0deg' }] }} />
          </Pressable>
          {showBill ? (
            <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', borderStyle: 'dashed' }}>
              <Row label="Item Total" value={R(pricing?.subtotal ?? subtotal)} />
              <Row label="Delivery partner fee" value={pricing ? (Number(pricing.deliveryFee) === 0 ? 'FREE' : R(pricing.deliveryFee)) : '-'} free={pricing && Number(pricing.deliveryFee) === 0} />
              <Row label="Platform Fee" value={pricing ? R(pricing.platformFee) : '-'} />
              {Number(pricing?.surgeAmount) > 0 ? <Row label={pricing.surgeTitle || 'Surge Charge'} value={R(pricing.surgeAmount)} /> : null}
              {Number(pricing?.tax) > 0 ? <Row label="GST and Restaurant Charges" value={R(pricing.tax)} /> : null}
              {savings > 0 ? <Row label="Discount" value={`-${R(savings)}`} free /> : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 8, paddingTop: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '700' }}>To Pay</Text>
                <Text style={{ fontSize: 16, fontWeight: '700' }}>{R(total)}</Text>
              </View>
            </View>
          ) : null}
          {pricingError ? <Text style={{ fontSize: 12, color: '#DC2626', marginTop: 10 }}>{pricingError}</Text> : null}
        </Card>
      </ScrollView>

      {/* Sticky: pay using + Place Order */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(12, insets.bottom), gap: 10, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 1 }}>PAY USING</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { id: 'cash', label: 'Cash on Delivery', icon: Banknote },
            { id: 'wallet', label: `Wallet ₹${Math.round(wallet)}`, icon: Wallet },
          ].map((m) => (
            <Pressable key={m.id} onPress={() => setMethod(m.id)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: method === m.id ? PRIMARY : '#E5E7EB', backgroundColor: method === m.id ? '#FFF7ED' : '#fff' }}>
              <m.icon size={18} color={method === m.id ? PRIMARY : '#6B7280'} />
              <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '600', color: method === m.id ? PRIMARY : '#374151', flexShrink: 1 }}>{m.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={place} disabled={!canPlace} style={{ backgroundColor: canPlace ? PRIMARY : '#D1D5DB', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
          {placing ? <ActivityIndicator color="#fff" /> : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Place Order  •  ₹{Math.round(total)}</Text>
          )}
        </Pressable>
      </View>

      {/* Address picker */}
      <Modal visible={pickAddress} transparent animationType="slide" onRequestClose={() => setPickAddress(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setPickAddress(false)}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Math.max(20, insets.bottom), maxHeight: '70%' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Select delivery address</Text>
            <ScrollView>
              {addresses.map((a, i) => (
                <Pressable key={String(a._id || a.id || i)} onPress={() => { setAddress(a); setPickAddress(false); }} style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: address === a ? PRIMARY : '#E5E7EB', marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700' }}>{a.label || a.type || 'Address'}</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{a.formattedAddress || [a.street, a.city, a.pincode].filter(Boolean).join(', ')}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
