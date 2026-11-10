import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Check, ChevronDown, ChevronUp, Clock, Info, Leaf, MapPin, Minus, MoreVertical, Plus, Search, Star, Tag, Utensils, X } from 'lucide-react-native';
import { Text } from '../../components/Text';
import foodApi from '../../api/foodClient';
import { dataOf } from '../../api/foodServices';
import { buildMenuSections, getFoodPriceLabel, getFoodVariants, hasFoodVariants } from '../../lib/menu';
import { transformRestaurant } from '../../lib/restaurants';
import { useCart } from '../../store/cart';
import { useFood } from '../../store/food';
import { useLocationStore } from '../../store/location';
import { normalizeImageUrl } from '../../lib/image';

// Port of web Food/pages/user/restaurants/RestaurantDetails.jsx (header, info card, filters, menu sections, item sheet).
const PRIMARY = '#EB590E';

function VegIcon({ item }) {
  const type = String(item.foodType || item.type || '').toLowerCase();
  const egg = type === 'egg' || String(item.name || '').toLowerCase().includes('egg');
  const c = item.isVeg ? '#059669' : egg ? '#D97706' : '#BE123C';
  const bg = item.isVeg ? '#ECFDF5' : egg ? '#FFFBEB' : '#FFF1F2';
  return (
    <View style={{ width: 16, height: 16, borderWidth: 2, borderColor: c, backgroundColor: bg, borderRadius: 2, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
    </View>
  );
}

function Qty({ qty, onAdd, onMinus, onPlus, disabled }) {
  const border = disabled ? '#D1D5DB' : PRIMARY;
  const color = disabled ? '#9CA3AF' : PRIMARY;
  return (
    <View
      style={{
        position: 'absolute', bottom: -8, left: '50%', marginLeft: qty > 0 ? -45 : -37, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderWidth: 1, borderColor: border, borderRadius: 8, paddingHorizontal: qty > 0 ? 16 : 24, paddingVertical: 6, opacity: disabled ? 0.5 : 1,
        shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
      }}
    >
      {qty > 0 ? (
        <>
          <Pressable disabled={disabled} onPress={onMinus} hitSlop={8}><Minus size={14} color={color} /></Pressable>
          <Text style={{ marginHorizontal: 8, fontSize: 14, fontWeight: '700', color }}>{qty}</Text>
          <Pressable disabled={disabled} onPress={onPlus} hitSlop={8}><Plus size={14} color={color} strokeWidth={3} /></Pressable>
        </>
      ) : (
        <Pressable disabled={disabled} onPress={onAdd} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color }}>ADD</Text>
          <Plus size={14} color={color} strokeWidth={3} />
        </Pressable>
      )}
    </View>
  );
}

function ItemRow({ item, disabled, onOpen, onAdd }) {
  const { setQuantity } = useCart();
  const cartItems = useCart((s) => s.items);
  const lines = useMemo(() => cartItems.filter((l) => l.itemId === item.id), [cartItems, item.id]);
  const qty = lines.reduce((n, l) => n + l.quantity, 0);
  const variants = hasFoodVariants(item);

  const plus = () => (variants ? onOpen(item) : onAdd(item, null, 1));
  const minus = () => (variants ? onOpen(item) : setQuantity(lines[0].lineItemId, lines[0].quantity - 1));

  return (
    <Pressable onPress={() => onOpen(item)} style={{ flexDirection: 'row', gap: 16, padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <VegIcon item={item} />
          {item.isSpicy ? <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444' }}>Spicy</Text> : null}
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', lineHeight: 22 }}>{item.name}</Text>
        {item.isRecommended ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <View style={{ height: 6, width: 64, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}><View style={{ height: '100%', width: '75%', backgroundColor: PRIMARY }} /></View>
            <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>Highly reordered</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
          <Text style={{ fontWeight: '600', color: '#111827' }}>{getFoodPriceLabel(item)}</Text>
          {item.preparationTime && String(item.preparationTime).trim() ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
              <Clock size={12} color="#6B7280" /><Text style={{ fontSize: 12, fontWeight: '500', color: '#4B5563' }}>{String(item.preparationTime).trim()}</Text>
            </View>
          ) : null}
          {item.isAvailable === false ? (
            <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#DC2626' }}>Unavailable Right Now</Text>
            </View>
          ) : null}
        </View>
        {item.description ? <Text numberOfLines={2} style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>{item.description}</Text> : null}
      </View>

      <View style={{ width: 128, height: 128 }}>
        {item.image ? (
          <Image source={{ uri: normalizeImageUrl(item.image) }} style={{ width: '100%', height: '100%', borderRadius: 16 }} resizeMode="cover" />
        ) : (
          <View style={{ width: '100%', height: '100%', borderRadius: 16, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 12, color: '#9CA3AF' }}>No image</Text></View>
        )}
        <Qty qty={qty} disabled={disabled || item.isAvailable === false} onAdd={plus} onPlus={plus} onMinus={minus} />
      </View>
    </Pressable>
  );
}

export default function RestaurantDetailsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const insets = useSafeAreaInsets();
  const coords = useLocationStore((s) => s.coords);
  const vegMode = useFood((s) => s.vegMode);
  const { add, setQuantity, items, restaurantId: cartRestaurantId } = useCart();
  const cartCount = useCart((s) => s.items.reduce((n, l) => n + l.quantity, 0));
  const cartTotal = useCart((s) => s.items.reduce((n, l) => n + l.price * l.quantity, 0));

  const [restaurant, setRestaurant] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [veg, setVeg] = useState(vegMode ? 'veg' : null);
  const [category, setCategory] = useState('all');
  const [collapsed, setCollapsed] = useState(new Set());
  const [sheet, setSheet] = useState(null); // item for the detail/variant sheet
  const [variantId, setVariantId] = useState('');
  const [sheetQty, setSheetQty] = useState(1);

  useEffect(() => {
    let alive = true;
    const slug = encodeURIComponent(String(params?.slug || params?.id || ''));
    (async () => {
      try {
        const r = await foodApi.get(`/food/restaurant/restaurants/${slug}`);
        const d = dataOf(r);
        const raw = d?.restaurant || d?.data?.restaurant || (d?._id || d?.restaurantId ? d : null);
        if (!raw) throw new Error('Restaurant not found');
        const t = transformRestaurant(raw, coords);
        if (alive) setRestaurant({ ...t, topCategory: raw.topCategory, reviews: Number(raw.totalRatings || raw.reviews || 0), isRestaurant: raw.isRestaurant !== false });
        try {
          const m = await foodApi.get(`/food/restaurant/restaurants/${encodeURIComponent(raw._id || raw.restaurantId || slug)}/menu`);
          const md = dataOf(m);
          const menu = md?.menu || md?.data?.menu;
          if (alive) setSections(buildMenuSections(menu?.sections || []));
        } catch {}
      } catch (e) {
        if (alive) setError(e?.message || 'Unable to load this restaurant.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [params?.slug, params?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const offline = restaurant ? !(restaurant.isActive && restaurant.isAcceptingOrders) : false;
  const cartRest = { id: restaurant?.mongoId || restaurant?.id, name: restaurant?.name };

  const filterItem = (it) => {
    if (veg === 'veg' && !it.isVeg) return false;
    if (veg === 'non-veg' && it.isVeg) return false;
    if (query.trim() && !`${it.name} ${it.description}`.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  };

  const visibleSections = useMemo(
    () =>
      sections
        .map((s, i) => ({
          ...s, index: i,
          items: s.items.filter(filterItem),
          subsections: s.subsections.map((sub) => ({ ...sub, items: sub.items.filter(filterItem) })).filter((sub) => sub.items.length),
        }))
        .filter((s) => (category === 'all' || s.id === category) && (s.items.length || s.subsections.length)),
    [sections, veg, query, category], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Adding from another restaurant replaces the cart (same rule as web).
  const guardedAdd = (item, variant, qty = 1) => {
    const other = cartRestaurantId();
    const go = () => { useCart.getState().clear(); add(item, cartRest, variant, qty); };
    if (other && String(other) !== String(cartRest.id)) {
      Alert.alert('Replace cart item?', 'Your cart has items from another restaurant. Start a fresh cart?', [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, start fresh', onPress: go },
      ]);
    } else add(item, cartRest, variant, qty);
  };

  // Row buttons use the store directly, so route the first add through the guard.
  const open = (item) => { setSheet(item); setVariantId(getFoodVariants(item)[0]?.id || ''); setSheetQty(1); };

  if (loading) return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={PRIMARY} /></SafeAreaView>;
  if (error || !restaurant) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '700' }}>{error || 'Restaurant not found'}</Text>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}><Text style={{ color: PRIMARY, fontWeight: '600' }}>Go back</Text></Pressable>
      </SafeAreaView>
    );
  }

  const sheetVariants = sheet ? getFoodVariants(sheet) : [];
  const sheetVariant = sheetVariants.find((v) => v.id === variantId) || null;
  const sheetPrice = sheet ? (sheetVariant ? sheetVariant.price : sheet.price) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', opacity: offline ? 0.9 : 1 }}>
      {/* Header: back, search, options */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 }}>
          <Pressable onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={16} color="#111827" />
          </Pressable>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, zIndex: 1 }} />
            <TextInput
              value={query} onChangeText={setQuery} placeholder={`Search in ${restaurant.name}...`} placeholderTextColor="#9CA3AF"
              style={{ height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', paddingLeft: 36, paddingRight: 32, fontSize: 13, fontWeight: '500', color: '#111827' }}
            />
            {query ? <Pressable onPress={() => setQuery('')} style={{ position: 'absolute', right: 12 }}><X size={14} color="#9CA3AF" /></Pressable> : null}
          </View>
          <Pressable style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
            <MoreVertical size={16} color="#111827" />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: cartCount ? 96 : 48 }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}>
          {!query.trim() ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {restaurant.isSponsored ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 99 }}>
                    <Star size={12} color="#fff" fill="#fff" /><Text style={{ color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>SPONSORED</Text>
                  </View>
                ) : null}
                {restaurant.pureVegRestaurant ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 99 }}>
                    <Leaf size={14} color="#059669" fill="#059669" /><Text style={{ color: '#059669', fontSize: 12, fontWeight: '600' }}>Pure Veg</Text>
                  </View>
                ) : null}
                {vegMode && !restaurant.pureVegRestaurant ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#6EE7B7', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 99 }}>
                    <Leaf size={14} color="#059669" fill="#059669" /><Text style={{ color: '#047857', fontSize: 11, fontWeight: '700' }}>Veg Mode Active</Text>
                  </View>
                ) : null}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827', flexShrink: 1 }}>{restaurant.name}</Text>
                  <Info size={20} color="#9CA3AF" />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 4 }}>
                    <Star size={12} color="#fff" fill="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{restaurant.rating ? restaurant.rating.toFixed(1) : 'NEW'}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#6B7280', textDecorationLine: 'underline' }}>{restaurant.reviews > 0 ? `${restaurant.reviews.toLocaleString()} Ratings` : 'Rating Info'}</Text>
                </View>
              </View>

              {restaurant.isRestaurant ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Utensils size={16} color="#374151" /><Text style={{ fontSize: 14, color: '#374151' }}>{restaurant.topCategory || restaurant.cuisine}</Text>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MapPin size={16} color="#374151" />
                <Text numberOfLines={1} style={{ fontSize: 14, color: '#374151', flex: 1 }}>{restaurant.distance} • {restaurant.raw?.location?.formattedAddress || restaurant.raw?.location?.area || 'Location'}</Text>
                <ChevronDown size={16} color="#6B7280" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} color="#374151" /><Text style={{ fontSize: 14, color: '#374151' }}>{restaurant.deliveryTime}</Text>
                </View>
                <View style={{ backgroundColor: offline ? '#E11D48' : '#059669', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{offline ? 'Offline' : 'Open now'}</Text>
                </View>
              </View>

              {restaurant.isRestaurant && (restaurant.raw?.pricingAttributes || []).length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {restaurant.raw.pricingAttributes.includes('no_packaging') ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' }}>
                      <Check size={14} color="#10B981" /><Text style={{ fontSize: 11, fontWeight: '600', color: '#374151' }}>No packaging charges</Text>
                    </View>
                  ) : null}
                  {restaurant.raw.pricingAttributes.includes('same_price') ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' }}>
                      <Check size={14} color="#10B981" /><Text style={{ fontSize: 11, fontWeight: '600', color: '#374151' }}>Same price as restaurant</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {offline ? (
                <View style={{ borderRadius: 8, borderWidth: 1, borderColor: '#FECDD3', backgroundColor: '#FFF1F2', paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Text style={{ fontSize: 14, color: '#BE123C' }}>This restaurant is currently offline. Orders are unavailable right now.</Text>
                </View>
              ) : null}

              {restaurant.offer ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Tag size={16} color={PRIMARY} /><Text numberOfLines={1} style={{ fontSize: 14, flex: 1 }}>{restaurant.offer}</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </View>

        {/* Filters + category chips */}
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E7EB', paddingVertical: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {[{ id: 'veg', label: 'Veg', c: '#22C55E', on: '#F0FDF4', b: '#16A34A' }, { id: 'non-veg', label: 'Non-veg', c: '#DC2626', on: '#FEF2F2', b: '#DC2626' }].map((f) => (
              <Pressable key={f.id} onPress={() => setVeg(veg === f.id ? null : f.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: veg === f.id ? f.b : '#D1D5DB', backgroundColor: veg === f.id ? f.on : '#fff' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: f.c }} />
                <Text style={{ fontSize: 13, fontWeight: '500' }}>{f.label}</Text>
                {veg === f.id ? <X size={12} color="#4B5563" /> : null}
              </Pressable>
            ))}
          </ScrollView>
          {sections.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginTop: 8 }}>
              {[{ id: 'all', name: 'All' }, ...sections].map((c) => (
                <Pressable key={c.id} onPress={() => setCategory(c.id)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: category === c.id ? PRIMARY : '#D1D5DB', backgroundColor: category === c.id ? '#FFF1E8' : '#fff' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: category === c.id ? PRIMARY : '#374151' }}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* Menu */}
        <View style={{ paddingVertical: 16 }}>
          {query.trim() ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700' }}>Search results for "{query.trim()}"</Text>
              <Pressable onPress={() => setQuery('')}><Text style={{ fontSize: 12, fontWeight: '600', color: PRIMARY }}>Clear Search</Text></Pressable>
            </View>
          ) : null}

          {visibleSections.length === 0 ? (
            <View style={{ margin: 16, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D1D5DB', padding: 32, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>{sections.length ? 'No dishes match the current filters.' : 'The menu is not available right now.'}</Text>
            </View>
          ) : visibleSections.map((s) => {
            const isOpen = !collapsed.has(s.id);
            const count = s.items.length + s.subsections.reduce((n, x) => n + x.items.length, 0);
            return (
              <View key={s.id} style={{ marginBottom: 8 }}>
                <Pressable
                  onPress={() => setCollapsed((c) => { const n = new Set(c); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}
                >
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>{s.name} ({count})</Text>
                  {isOpen ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
                </Pressable>
                {isOpen ? (
                  <>
                    {s.items.map((it) => <ItemRow key={it.id} item={it} disabled={offline} onOpen={open} onAdd={guardedAdd} />)}
                    {s.subsections.map((sub) => (
                      <View key={sub.id}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#374151', paddingHorizontal: 16, paddingTop: 8 }}>{sub.name}</Text>
                        {sub.items.map((it) => <ItemRow key={it.id} item={it} disabled={offline} onOpen={open} onAdd={guardedAdd} />)}
                      </View>
                    ))}
                  </>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky cart bar */}
      {cartCount > 0 ? (
        <View style={{ position: 'absolute', left: 12, right: 12, bottom: Math.max(12, insets.bottom), backgroundColor: PRIMARY, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
          <View>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{cartCount} item{cartCount > 1 ? 's' : ''} | ₹{cartTotal.toFixed(0)}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>From {items[0]?.restaurant}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('FoodCart')}><Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>View Cart  ›</Text></Pressable>
        </View>
      ) : null}

      {/* Item detail / variant sheet */}
      <Modal visible={!!sheet} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setSheet(null)}>
          {sheet ? (
            <Pressable onPress={() => {}} style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: Math.max(16, insets.bottom) }}>
              {sheet.image ? <Image source={{ uri: normalizeImageUrl(sheet.image) }} style={{ width: '100%', height: 200, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} resizeMode="cover" /> : null}
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <VegIcon item={sheet} />
                  <Text style={{ fontSize: 20, fontWeight: '700', flex: 1 }}>{sheet.name}</Text>
                </View>
                {sheet.description ? <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>{sheet.description}</Text> : null}
                {sheetVariants.length ? (
                  <View style={{ marginTop: 16, gap: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700' }}>Choose one</Text>
                    {sheetVariants.map((v) => (
                      <Pressable key={v.id} onPress={() => setVariantId(v.id)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: variantId === v.id ? PRIMARY : '#E5E7EB', backgroundColor: variantId === v.id ? '#FFF7ED' : '#fff' }}>
                        <Text style={{ fontSize: 14, fontWeight: '500' }}>{v.name}</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600' }}>₹{Math.round(v.price)}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </ScrollView>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
                  <Pressable onPress={() => setSheetQty(Math.max(1, sheetQty - 1))}><Minus size={16} color="#374151" /></Pressable>
                  <Text style={{ fontWeight: '700', minWidth: 16, textAlign: 'center' }}>{sheetQty}</Text>
                  <Pressable onPress={() => setSheetQty(sheetQty + 1)}><Plus size={16} color="#374151" /></Pressable>
                </View>
                <Pressable
                  disabled={offline || sheet.isAvailable === false}
                  onPress={() => { guardedAdd(sheet, sheetVariant, sheetQty); setSheet(null); }}
                  style={{ flex: 1, backgroundColor: offline || sheet.isAvailable === false ? '#D1D5DB' : PRIMARY, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Add item  ₹{Math.round(sheetPrice * sheetQty)}</Text>
                </Pressable>
              </View>
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}
