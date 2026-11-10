import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowDownUp, ArrowRight, ChevronDown, Clock, MapPin, Minus, Plus, ShoppingCart, Star, Timer, Wallet } from 'lucide-react-native';
import { Text } from '../../components/Text';
import foodApi from '../../api/foodClient';
import { dataOf, foodService } from '../../api/foodServices';
import { buildMenuSections } from '../../lib/menu';
import { distanceKm } from '../../lib/restaurants';
import { normalizeImageUrl } from '../../lib/image';
import { useLocationStore } from '../../store/location';
import { useZone } from '../../store/zone';
import { useCart } from '../../store/cart';

// Port of web Food/pages/user/Under250.jsx ("Switch 99": dishes priced around Rs 99, grouped by restaurant).
const PRIMARY = '#EB590E';
const PINK = '#FA0272';
const W = Dimensions.get('window').width;
const FALLBACK_BANNERS = [require('../../../assets/food/switch99_final_banner.png'), require('../../../assets/food/switch99_banner_2.jpg')];
const SORTS = [
  { id: null, label: 'Relevance' },
  { id: 'rating-high', label: 'Rating: High to Low' },
  { id: 'delivery-time-low', label: 'Estimated Time: Low to High' },
  { id: 'distance-low', label: 'Distance: Low to High' },
];

function Dish({ item, restaurant, onOpen }) {
  const { add, setQuantity } = useCart();
  const cartItems = useCart((s) => s.items);
  const lines = useMemo(() => cartItems.filter((l) => l.itemId === item.id), [cartItems, item.id]);
  const qty = lines.reduce((n, l) => n + l.quantity, 0);
  const rest = { id: restaurant.id, name: restaurant.name };

  const guarded = () => {
    const other = useCart.getState().restaurantId();
    const go = () => { useCart.getState().clear(); add(item, rest); };
    if (other && String(other) !== String(rest.id)) {
      Alert.alert('Replace cart item?', 'Your cart has items from another restaurant. Start a fresh cart?', [{ text: 'No', style: 'cancel' }, { text: 'Yes, start fresh', onPress: go }]);
    } else add(item, rest);
  };

  return (
    <Pressable onPress={onOpen} style={{ width: 200, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
      <View style={{ height: 130, backgroundColor: '#F3F4F6' }}>
        {item.image ? <Image source={{ uri: normalizeImageUrl(item.image) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : null}
        <View style={{ position: 'absolute', top: 8, left: 8, width: 16, height: 16, borderWidth: 2, borderColor: item.isVeg ? '#059669' : '#BE123C', backgroundColor: '#fff', borderRadius: 2, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.isVeg ? '#059669' : '#BE123C' }} />
        </View>
      </View>
      <View style={{ padding: 10, paddingBottom: 22 }}>
        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: '#1F2937' }}>{item.name}</Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 }}>₹{Math.round(item.price)}</Text>
      </View>
      <View style={{ position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: PRIMARY, borderRadius: 8, paddingHorizontal: qty ? 10 : 14, paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 }}>
        {qty > 0 ? (
          <>
            <Pressable onPress={() => setQuantity(lines[0].lineItemId, lines[0].quantity - 1)} hitSlop={8}><Minus size={14} color={PRIMARY} /></Pressable>
            <Text style={{ marginHorizontal: 8, fontWeight: '700', color: PRIMARY }}>{qty}</Text>
            <Pressable onPress={guarded} hitSlop={8}><Plus size={14} color={PRIMARY} strokeWidth={3} /></Pressable>
          </>
        ) : (
          <Pressable onPress={guarded} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontWeight: '700', color: PRIMARY, fontSize: 13 }}>ADD</Text><Plus size={13} color={PRIMARY} strokeWidth={3} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export default function Switch99Screen() {
  const navigation = useNavigation();
  const { coords, title } = useLocationStore();
  const zoneId = useZone((z) => z.zoneId);
  const zoneStatus = useZone((z) => z.status);
  const cartCount = useCart((c) => c.items.reduce((n, l) => n + l.quantity, 0));

  const [banners, setBanners] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState(null);
  const [showSort, setShowSort] = useState(false);
  const [draftSort, setDraftSort] = useState(null);
  const [under30, setUnder30] = useState(false);

  useEffect(() => {
    foodApi.get('/food/hero-banners/under-250/public').then((res) => {
      const d = dataOf(res)?.data;
      const list = Array.isArray(d?.banners) ? d.banners : Array.isArray(d) ? d : [];
      setBanners(list.map((b) => (typeof b?.imageUrl === 'string' ? normalizeImageUrl(b.imageUrl.trim()) : '')).filter(Boolean));
    }).catch(() => {});
  }, []);

  const slides = banners.length ? banners.map((u) => ({ uri: u })) : FALLBACK_BANNERS;
  useEffect(() => {
    if (slides.length < 2) return undefined;
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    foodService.publicCategories(zoneId ? { zoneId } : {}).then((res) => {
      const list = dataOf(res)?.data?.categories || [];
      setCategories(list.map((c, i) => ({ id: String(c?.id || c?._id || i), name: String(c?.name || '').trim(), image: normalizeImageUrl(c?.image || c?.imageUrl) })).filter((c) => c.name));
    }).catch(() => {});
  }, [zoneId]);

  // Same approach as web: list zone restaurants, then keep dishes whose price contains "99".
  useEffect(() => {
    if (!zoneId) { setLoading(zoneStatus === 'loading'); return undefined; }
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const res = await foodService.restaurants({ zoneId, isRestaurant: 'true' });
        const raw = dataOf(res)?.data?.restaurants || [];
        const out = await Promise.all(
          raw.map(async (r, index) => {
            const id = r?.restaurantId || r?._id;
            if (!id) return null;
            try {
              const m = await foodApi.get(`/food/restaurant/restaurants/${encodeURIComponent(id)}/menu`);
              const sections = buildMenuSections((dataOf(m)?.menu || dataOf(m)?.data?.menu)?.sections || []);
              const dishes = sections
                .filter((s) => s.id !== 'recommended')
                .flatMap((s) => [...s.items, ...s.subsections.flatMap((x) => x.items)])
                .filter((it) => String(it.price || '').includes('99') && it.isAvailable !== false)
                .map((it) => ({ ...it, image: it.image || r?.coverImages?.[0]?.url || r?.coverImages?.[0] || r?.profileImage?.url || '' }));
              if (!dishes.length) return null;
              const lat = Number(r?.location?.latitude ?? (Array.isArray(r?.location?.coordinates) ? r.location.coordinates[1] : NaN));
              const lng = Number(r?.location?.longitude ?? (Array.isArray(r?.location?.coordinates) ? r.location.coordinates[0] : NaN));
              const km = coords && Number.isFinite(lat) && Number.isFinite(lng) ? distanceKm(coords.latitude, coords.longitude, lat, lng) : null;
              const mins = Number(r?.estimatedDeliveryTimeMinutes) || Number(r?.estimatedDeliveryTime) || null;
              return {
                id: String(id), slug: r?.slug || String(r?.restaurantName || r?.name || '').toLowerCase().replace(/\s+/g, '-'),
                name: r?.restaurantName || r?.name || 'Restaurant', rating: Number(r?.rating || 0), totalRatings: Number(r?.totalRatings || r?.ratingCount || 0),
                deliveryTime: r?.estimatedDeliveryTime || (mins ? `${mins} mins` : '30 mins'), mins: mins || 30, km, originalIndex: index, menuItems: dishes,
              };
            } catch { return null; }
          }),
        );
        if (alive) setRestaurants(out.filter(Boolean));
      } catch {
        if (alive) setRestaurants([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [zoneId, zoneStatus, coords]);

  const shown = useMemo(() => {
    let list = restaurants;
    if (under30) list = list.filter((r) => r.mins <= 30);
    if (sort === 'rating-high') list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === 'delivery-time-low') list = [...list].sort((a, b) => a.mins - b.mins);
    if (sort === 'distance-low') list = [...list].sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9));
    return list;
  }, [restaurants, sort, under30]);

  const circle = { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(243,244,246,0.8)', borderWidth: 1, borderColor: 'rgba(229,231,235,0.6)', alignItems: 'center', justifyContent: 'center' };
  const openRest = (r) => navigation.navigate('RestaurantDetails', { slug: r.slug });

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '70%' }}>
            <View style={{ backgroundColor: 'rgba(250,2,114,0.1)', padding: 8, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(250,2,114,0.2)' }}><MapPin size={18} color={PINK} /></View>
            <View style={{ flexShrink: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 1 }}>LOCATION</Text><ChevronDown size={12} color={PINK} />
              </View>
              <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{title || 'Select Location'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={() => navigation.navigate('FoodWallet')} style={circle}><Wallet size={15} color="#1F2937" /></Pressable>
            <Pressable onPress={() => navigation.navigate('FoodCart')} style={circle}>
              <ShoppingCart size={15} color="#1F2937" />
              {cartCount > 0 ? <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' }}><Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>{cartCount > 99 ? '99+' : cartCount}</Text></View> : null}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Banner (object-contain, h ~ 240) */}
        <View style={{ width: W, height: Math.max(240, Math.min(W * 0.55, 330)), backgroundColor: '#fff', overflow: 'hidden' }}>
          <Image source={slides[bannerIdx % slides.length]} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          {slides.length > 1 ? (
            <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              {slides.map((_, i) => <View key={i} style={{ height: 6, width: i === bannerIdx % slides.length ? 24 : 6, borderRadius: 3, backgroundColor: i === bannerIdx % slides.length ? PINK : 'rgba(0,0,0,0.2)' }} />)}
            </View>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {/* Categories rail */}
          {categories.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 8 }}>
              {categories.map((c) => (
                <View key={c.id} style={{ alignItems: 'center', gap: 6, width: 62 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 }}>
                    {c.image ? <Image source={{ uri: c.image }} style={{ width: '100%', height: '100%' }} /> : null}
                  </View>
                  <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '600', color: '#1F2937' }}>{c.name.length > 7 ? `${c.name.slice(0, 7)}...` : c.name}</Text>
                </View>
              ))}
            </ScrollView>
          ) : null}

          {/* Sort + Under 30 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
            <Pressable onPress={() => { setDraftSort(sort); setShowSort(true); }} style={{ height: 32, paddingHorizontal: 12, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' }}>
              <ArrowDownUp size={16} color="#374151" style={{ transform: [{ rotate: '90deg' }] }} />
              <Text style={{ fontSize: 14, fontWeight: '500' }}>{sort ? SORTS.find((s) => s.id === sort)?.label : 'Sort'}</Text>
              <ChevronDown size={12} color="#374151" />
            </Pressable>
            <Pressable onPress={() => setUnder30(!under30)} style={{ height: 32, paddingHorizontal: 12, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: under30 ? PRIMARY : '#fff', borderWidth: 1, borderColor: under30 ? PRIMARY : '#E5E7EB' }}>
              <Timer size={14} color={under30 ? '#fff' : '#4B5563'} />
              <Text style={{ fontSize: 12, fontWeight: '500', color: under30 ? '#fff' : '#4B5563' }}>Under 30 mins</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}><ActivityIndicator color={PRIMARY} /><Text style={{ color: '#6B7280', marginTop: 8 }}>Loading restaurants...</Text></View>
          ) : shown.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Text style={{ color: '#6B7280', textAlign: 'center' }}>{restaurants.length === 0 ? 'No restaurants with dishes under ₹99 found.' : 'No restaurants match the selected filters.'}</Text>
            </View>
          ) : shown.map((r) => (
            <View key={r.id} style={{ paddingTop: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 }}>{r.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} color="#6B7280" strokeWidth={1.5} /><Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>{r.deliveryTime}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#166534', padding: 4, paddingRight: 10, borderRadius: 99 }}>
                    <View style={{ backgroundColor: '#fff', padding: 4, borderRadius: 99 }}><Star size={14} color="#166534" fill="#166534" /></View>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{r.rating}</Text>
                  </View>
                  {r.totalRatings > 0 ? <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>By {r.totalRatings >= 1000 ? `${(r.totalRatings / 1000).toFixed(1)}K+` : `${r.totalRatings}+`}</Text> : null}
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
                {r.menuItems.map((it) => <Dish key={it.id} item={it} restaurant={r} onOpen={() => openRest(r)} />)}
              </ScrollView>
              <Pressable onPress={() => openRest(r)} style={{ alignSelf: 'center', marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>View full menu</Text><ArrowRight size={16} color="#374151" />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showSort} transparent animationType="slide" onRequestClose={() => setShowSort(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setShowSort(false)}>
          <Pressable onPress={() => {}} style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%' }}>
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}><View style={{ width: 48, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} /></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>Sort By</Text>
              <Pressable onPress={() => { setSort(null); setUnder30(false); setShowSort(false); }}><Text style={{ color: PRIMARY, fontWeight: '500' }}>Clear all</Text></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
              {SORTS.map((o) => (
                <Pressable key={String(o.id)} onPress={() => setDraftSort(o.id)} style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: draftSort === o.id ? PRIMARY : '#E5E7EB', backgroundColor: draftSort === o.id ? '#FFF2EB' : '#fff' }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: draftSort === o.id ? PRIMARY : '#374151' }}>{o.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => { setSort(draftSort); setShowSort(false); }} style={{ margin: 16, backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Apply</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
