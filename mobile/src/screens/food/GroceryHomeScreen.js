import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Clock, ShoppingBasket, Star, Timer } from 'lucide-react-native';
import { Text } from '../../components/Text';
import VerticalHeader from '../../components/VerticalHeader';
import FoodSearchRow from '../../components/food/FoodSearchRow';
import foodApi from '../../api/foodClient';
import { dataOf, foodService } from '../../api/foodServices';
import { normalizeImageUrl } from '../../lib/image';
import { useZone } from '../../store/zone';
import { useLocationStore } from '../../store/location';

// Port of web Food/components/user/home/QuickSection.jsx (Grocery / Quick Mart home).
const GREEN = '#1A9E5C';
const W = Dimensions.get('window').width;
const GRADS = [['#DCFCE7', '#BBF7D0'], ['#CCFBF1', '#A5F3FC'], ['#ECFCCB', '#BBF7D0'], ['#D1FAE5', '#99F6E4']];

const getClosesIn = (r) => {
  try {
    const h = r?.openingHours;
    const s = h?.close || h?.closingTime || h?.closeTime;
    if (!s) return null;
    const [hh, mm] = String(s).split(':').map(Number);
    const close = new Date();
    close.setHours(hh, mm, 0, 0);
    const mins = Math.floor((close - new Date()) / 60000);
    if (mins <= 0) return null;
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  } catch { return null; }
};

const pickImage = (r) => {
  const c = [r?.coverImage?.url, r?.coverImage, ...(Array.isArray(r?.coverImages) ? r.coverImages.map((i) => i?.url || i) : []), ...(Array.isArray(r?.menuImages) ? r.menuImages.map((i) => i?.url || i) : []), r?.profileImage?.url, r?.profileImage];
  return normalizeImageUrl(c.find((v) => typeof v === 'string' && v.trim()) || '');
};

const transformStore = (r) => {
  const name = r?.name || r?.restaurantName || 'Store';
  const slug = r?.slug || String(name).toLowerCase().trim().replace(/\s+/g, '-');
  return {
    id: r?._id || r?.restaurantId || slug, slug, name,
    cuisine: r?.cuisine || r?.category || r?.type || '',
    rating: Number(r?.rating || 0) || 0,
    deliveryTime: r?.estimatedDeliveryTime || (r?.estimatedDeliveryTimeMinutes ? `${r.estimatedDeliveryTimeMinutes} mins` : '25-30 mins'),
    image: pickImage(r), closesIn: getClosesIn(r), raw: r,
  };
};

function BannerSlider() {
  const [images, setImages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => {
    foodApi.get('/food/hero-banners/grocery/public').then((res) => {
      const d = dataOf(res)?.data;
      const list = d?.banners || d || [];
      setImages(Array.isArray(list) ? list.map((b) => (typeof b?.imageUrl === 'string' ? normalizeImageUrl(b.imageUrl) : '')).filter(Boolean) : []);
    }).catch(() => {}).finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (images.length < 2) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % images.length), 3000);
    return () => clearInterval(t);
  }, [images.length]);
  const h = (W - 32) / 2;
  if (!loaded) return <View style={{ marginBottom: 20, width: '100%', height: h, borderRadius: 16, backgroundColor: '#F3F4F6' }} />;
  if (!images.length) return null;
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ height: h, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
        <Image source={{ uri: images[i] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        {images.length > 1 ? (
          <View style={{ position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 99 }}>
            {images.map((_, k) => <View key={k} style={{ height: 6, width: k === i ? 20 : 6, borderRadius: 3, backgroundColor: k === i ? '#fff' : 'rgba(255,255,255,0.4)' }} />)}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function StoreSlider({ store, index }) {
  const slides = useMemo(() => {
    const raw = store.raw || {};
    const out = [];
    (Array.isArray(raw.recommendedImages) ? raw.recommendedImages : []).forEach((it, k) => {
      const img = normalizeImageUrl(it?.image || it?.url || it?.src || (typeof it === 'string' ? it : ''));
      if (img) out.push({ id: it?.id || `rec-${k}`, image: img, name: it?.name || it?.itemName || store.name, price: Number(it?.price || it?.originalPrice || 0) });
    });
    [...(raw.coverImages || []), ...(raw.menuImages || []), ...(raw.images || [])].map((x) => x?.url || x).forEach((x, k) => {
      const img = normalizeImageUrl(typeof x === 'string' ? x : '');
      if (img && !out.find((s) => s.image === img)) out.push({ id: `extra-${k}`, image: img, name: store.name, price: 0 });
    });
    if (!out.length && store.image) out.push({ id: 'main', image: store.image, name: store.name, price: 0 });
    return out;
  }, [store]);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 3500);
    return () => clearInterval(t);
  }, [slides.length]);
  const cur = slides[i % Math.max(slides.length, 1)];

  if (!cur?.image) {
    return (
      <LinearGradient colors={GRADS[index % GRADS.length]} style={{ height: 208, alignItems: 'center', justifyContent: 'center' }}>
        <ShoppingBasket size={56} color="#86EFAC" />
      </LinearGradient>
    );
  }
  return (
    <View style={{ height: 208, backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
      <Image source={{ uri: cur.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64 }} pointerEvents="none" />
      {cur.name && cur.name !== store.name ? (
        <View style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 }}>
          <Text numberOfLines={1} style={{ color: '#fff', fontSize: 12, fontWeight: '700', maxWidth: 170 }}>{cur.name}</Text>
          {cur.price > 0 ? <><Text style={{ color: 'rgba(255,255,255,0.5)' }}>·</Text><Text style={{ color: '#FBBF24', fontSize: 12, fontWeight: '800' }}>₹{Math.round(cur.price)}</Text></> : null}
        </View>
      ) : null}
      <View style={{ position: 'absolute', bottom: 12, left: 12, backgroundColor: GREEN, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 }}>
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 }}>OPEN NOW</Text>
      </View>
      {slides.length > 1 ? (
        <View style={{ position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', gap: 4 }}>
          {slides.map((_, k) => <View key={k} style={{ height: 6, width: k === i % slides.length ? 16 : 6, borderRadius: 3, backgroundColor: k === i % slides.length ? '#fff' : 'rgba(255,255,255,0.6)' }} />)}
        </View>
      ) : null}
    </View>
  );
}

function StoreCard({ store, index, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ marginBottom: 16, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 4, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      <StoreSlider store={store} index={index} />
      <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 19, fontWeight: '900', color: '#111827' }}>{store.name}</Text>
          {store.rating > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E8F8F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 }}>
              <Star size={14} color={GREEN} fill={GREEN} /><Text style={{ color: GREEN, fontSize: 14, fontWeight: '700' }}>{store.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        {store.cuisine ? <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 10 }}>{store.cuisine}</Text> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Clock size={16} color="#9CA3AF" /><Text style={{ fontSize: 14, color: '#4B5563' }}>{store.deliveryTime}</Text>
        </View>
        {store.closesIn ? (
          <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#FED7AA', backgroundColor: 'rgba(255,247,237,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 }}>
            <Timer size={14} color="#EA580C" /><Text style={{ color: '#EA580C', fontSize: 13, fontWeight: '600' }}>Closes in {store.closesIn}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const Empty = ({ title, text }) => (
  <View style={{ alignItems: 'center', paddingVertical: 80 }}>
    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><ShoppingBasket size={32} color="#4ADE80" /></View>
    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 }}>{title}</Text>
    <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', maxWidth: 240, lineHeight: 20 }}>{text}</Text>
  </View>
);

export default function GroceryHomeScreen() {
  const navigation = useNavigation();
  const coords = useLocationStore((s) => s.coords);
  const { zoneId, status, detect, load } = useZone();
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (coords) detect(coords.latitude, coords.longitude); }, [coords, detect]);

  const fetchAll = useCallback(async () => {
    if (status === 'OUT_OF_SERVICE') { setStores([]); setLoading(false); return; }
    if (!zoneId && status === 'loading') return;
    const [s, c] = await Promise.allSettled([
      foodService.restaurants({ isRestaurant: 'false', ...(zoneId ? { zoneId } : {}) }),
      foodService.publicCategories({ isRestaurant: 'false', ...(zoneId ? { zoneId } : {}) }),
    ]);
    if (s.status === 'fulfilled') {
      const d = dataOf(s.value);
      const list = d?.data?.restaurants || d?.restaurants || [];
      setStores(list.map(transformStore));
    } else setStores([]);
    if (c.status === 'fulfilled') {
      const list = dataOf(c.value)?.data?.categories || [];
      setCategories((Array.isArray(list) ? list : []).sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''))));
    }
    setLoading(false);
  }, [zoneId, status]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const visibleCategories = categories.filter((c) => normalizeImageUrl(typeof c.image === 'string' ? c.image : c.image?.url || ''));

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); }} tintColor={GREEN} />} contentContainerStyle={{ paddingBottom: 24 }}>
        <VerticalHeader />
        <FoodSearchRow vertical="grocery" showVeg={false} onSearch={() => navigation.navigate('FoodSearch', { vertical: 'grocery' })} />

        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 }}>
          <BannerSlider />

          {visibleCategories.length ? (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: '800', color: '#111827' }}>Shop by category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 4 }}>
                {visibleCategories.map((c) => (
                  <Pressable key={c._id || c.slug || c.name} onPress={() => Alert.alert(c.name, 'Coming soon in the app.')} style={{ width: 72, alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 64, height: 64, borderRadius: 32, overflow: 'hidden', backgroundColor: '#E8F8F0', alignItems: 'center', justifyContent: 'center' }}>
                      <Image source={{ uri: normalizeImageUrl(typeof c.image === 'string' ? c.image : c.image?.url || '') }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>
                    <Text numberOfLines={2} style={{ fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center', lineHeight: 14 }}>{c.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 1.8, marginBottom: 4 }}>GROCERY STORES</Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#111827', lineHeight: 30 }}>Grocery near you</Text>
            </View>
            {!loading && stores.length ? (
              <View style={{ marginTop: 4, backgroundColor: '#E8F8F0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99 }}>
                <Text style={{ color: GREEN, fontSize: 14, fontWeight: '700' }}>{stores.length} stores</Text>
              </View>
            ) : null}
          </View>

          {loading ? (
            [0, 1, 2].map((k) => (
              <View key={k} style={{ marginBottom: 16, borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff' }}>
                <View style={{ height: 208, backgroundColor: '#F3F4F6' }} />
                <View style={{ padding: 16, gap: 10 }}>
                  <View style={{ height: 20, width: '40%', borderRadius: 10, backgroundColor: '#F3F4F6' }} />
                  <View style={{ height: 14, width: '33%', borderRadius: 7, backgroundColor: '#F3F4F6' }} />
                </View>
              </View>
            ))
          ) : status === 'OUT_OF_SERVICE' ? (
            <Empty title="Not available in your area yet" text="We do not deliver grocery to this location yet. Try another address." />
          ) : stores.length === 0 ? (
            <Empty title="No stores yet" text="No grocery stores available in your area right now. Check back soon!" />
          ) : stores.map((s, i) => (
            <StoreCard key={String(s.id)} store={s} index={i} onPress={() => navigation.navigate('RestaurantDetails', { slug: s.slug })} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
