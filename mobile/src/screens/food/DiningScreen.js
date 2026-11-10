import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Bookmark, ChevronDown, Clock, Mic, MapPin, Search, ShoppingCart, Star, UtensilsCrossed, Utensils, Wallet } from 'lucide-react-native';
import { Text } from '../../components/Text';
import foodApi from '../../api/foodClient';
import { dataOf } from '../../api/foodServices';
import { normalizeImageUrl } from '../../lib/image';
import { distanceKm } from '../../lib/restaurants';
import { useLocationStore } from '../../store/location';
import { useFood } from '../../store/food';
import { useCart } from '../../store/cart';

// Port of web Food/pages/user/Dining.jsx (mobile header, banner, categories grid, popular restaurants with pre-book cards).
const PRIMARY = '#EB590E';
const PINK = '#FA0272';
const W = Dimensions.get('window').width;
const soon = (t) => Alert.alert(t, 'Coming soon in the app.');
const slugify = (v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const FILTERS = [
  { id: 'rating-4-plus', label: 'Rating 4.0+', star: true },
  { id: 'distance-under-2km', label: 'Under 2km' },
  { id: 'delivery-under-45', label: 'Under 45 mins' },
  { id: 'has-offers', label: 'Offers' },
];

function Banner({ banners }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % banners.length), 4000);
    return () => clearInterval(t);
  }, [banners.length]);
  const h = Math.round(Dimensions.get('window').height * 0.3);
  return (
    <View style={{ paddingHorizontal: 12, paddingBottom: 16 }}>
      <View style={{ height: h, borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFF5E8', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 }}>
        {banners.length ? (
          <>
            <Image source={{ uri: banners[i].imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.25)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16 }}>
              <View style={{ maxWidth: '75%', borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.2)', padding: 12 }}>
                {banners[i].promoCode ? <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 3, color: 'rgba(255,255,255,0.85)' }}>{banners[i].promoCode.toUpperCase()}</Text> : null}
                {banners[i].tagline ? <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 8, lineHeight: 22 }}>{banners[i].tagline}</Text> : null}
              </View>
            </View>
            {banners.length > 1 ? (
              <View style={{ position: 'absolute', bottom: 8, right: 12, flexDirection: 'row', gap: 4 }}>
                {banners.map((_, k) => <View key={k} style={{ height: 6, width: k === i ? 18 : 6, borderRadius: 3, backgroundColor: k === i ? '#fff' : 'rgba(255,255,255,0.5)' }} />)}
              </View>
            ) : null}
          </>
        ) : (
          <LinearGradient colors={['#FFEDD5', '#FFF7ED']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <UtensilsCrossed size={40} color="#FB923C" />
            <Text style={{ marginTop: 8, fontWeight: '700', color: '#9A3412' }}>Dine out. Save more.</Text>
          </LinearGradient>
        )}
      </View>
    </View>
  );
}

function DiningCard({ r, favorite, onFavorite, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <View style={{ height: 192, backgroundColor: '#FFF5E8' }}>
        {r.image ? <Image source={{ uri: r.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : (
          <LinearGradient colors={['#FFF5E8', '#FFFAF4', '#FFE5D0']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><UtensilsCrossed size={32} color="#FB923C" /></LinearGradient>
        )}
        <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(31,41,55,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
          <Text numberOfLines={1} style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>{r.featuredDish}{r.featuredPrice ? ` • ₹${r.featuredPrice}` : ''}</Text>
        </View>
        <Pressable onPress={onFavorite} style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
          <Bookmark size={20} color={favorite ? '#1F2937' : '#4B5563'} fill={favorite ? '#1F2937' : 'none'} />
        </Pressable>
        <LinearGradient colors={[PRIMARY, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%', justifyContent: 'flex-end', paddingLeft: 16, paddingBottom: 16 }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500', letterSpacing: 1 }}>PRE-BOOK TABLE</Text>
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.3)', width: 96, marginVertical: 6 }} />
          {r.offer ? <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{r.offer}</Text> : null}
        </LinearGradient>
      </View>

      <View style={{ padding: 12, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 18, fontWeight: '700', color: '#111827' }}>{r.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#16A34A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{r.rating > 0 ? r.rating.toFixed(1) : 'New'}{r.reviewCount > 0 ? ` (${r.reviewCount})` : ''}</Text>
            <Star size={12} color="#fff" fill="#fff" />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          <Clock size={16} color="#6B7280" strokeWidth={1.5} />
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>{r.deliveryTime}</Text>
          <Text style={{ marginHorizontal: 4, color: '#6B7280' }}>|</Text>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>{r.distance}</Text>
        </View>
        {r.offer ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: '#86EFAC', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6 }}>
            <View style={{ backgroundColor: '#16A34A', paddingHorizontal: 6, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>% OFF</Text>
            </View>
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#166534' }}>{r.offer}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function DiningScreen() {
  const navigation = useNavigation();
  const { coords, title, subtitle } = useLocationStore();
  const { favorites, toggleFavorite, loadFavorites } = useFood();
  const cartCount = useCart((c) => c.items.reduce((n, l) => n + l.quantity, 0));

  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(new Set());

  const load = useCallback(async () => {
    const [b, c, r] = await Promise.allSettled([
      foodApi.get('/food/hero-banners/dining/public'),
      foodApi.get('/food/dining/categories/public'),
      foodApi.get('/food/dining/restaurants/public'),
    ]);
    if (b.status === 'fulfilled') {
      const arr = dataOf(b.value)?.data?.banners;
      setBanners(Array.isArray(arr) ? arr.map((x, i) => ({ id: String(x?._id || i), imageUrl: normalizeImageUrl(String(x?.imageUrl || '')), tagline: String(x?.title || x?.tagline || '').trim(), promoCode: String(x?.ctaText || x?.promoCode || '').trim() })).filter((x) => x.imageUrl) : []);
    }
    if (c.status === 'fulfilled') {
      const d = dataOf(c.value)?.data;
      setCategories((Array.isArray(d) ? d : []).filter((x) => String(x?.name || '').trim()).map((x) => ({ ...x, name: String(x.name).trim(), slug: slugify(x.slug || x.name), imageUrl: normalizeImageUrl(String(x.imageUrl || '')) })));
    }
    if (r.status === 'fulfilled') {
      const d = dataOf(r.value)?.data;
      setList(Array.isArray(d) ? d : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadFavorites(); load(); }, [load, loadFavorites]);

  const restaurants = useMemo(
    () =>
      list
        .filter((x) => String(x?.restaurantName || x?.name || '').trim())
        .map((x, i) => {
          const name = String(x.restaurantName || x.name).trim();
          const loc = x.location;
          const lat = loc?.latitude ?? (Array.isArray(loc?.coordinates) ? loc.coordinates[1] : null);
          const lng = loc?.longitude ?? (Array.isArray(loc?.coordinates) ? loc.coordinates[0] : null);
          const km = coords && lat && lng ? distanceKm(coords.latitude, coords.longitude, Number(lat), Number(lng)) : NaN;
          const img = x.coverImages?.[0]?.url || x.coverImages?.[0] || x.coverImage || x.menuImages?.[0]?.url || x.menuImages?.[0] || x.profileImage?.url || x.profileImage || '';
          return {
            id: x._id || x.id || `r-${i}`,
            name,
            slug: String(x.restaurantNameNormalized || '').trim() || slugify(name),
            image: normalizeImageUrl(String(img)),
            offer: String(x.offer || '').trim(),
            featuredDish: String(x.featuredDish || "Chef's special").trim(),
            featuredPrice: Number(x.featuredPrice || 0),
            rating: Number(x.diningRating ?? x.rating ?? 0),
            reviewCount: Number(x.diningReviewCount || 0),
            deliveryTime: String(x.estimatedDeliveryTime || x.deliveryTime || (x.estimatedDeliveryTimeMinutes ? `${x.estimatedDeliveryTimeMinutes} mins` : '30-40 mins')).trim(),
            km,
            distance: Number.isFinite(km) ? `${km.toFixed(1)} km` : 'Distance unavailable',
            diningType: x.diningSettings?.diningType || x.categories?.[0]?.slug || 'dining',
            raw: x,
          };
        }),
    [list, coords],
  );

  const filtered = useMemo(
    () =>
      restaurants.filter((r) => {
        if (search.trim() && !r.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
        if (active.has('rating-4-plus') && r.rating < 4) return false;
        if (active.has('distance-under-2km') && !(r.km <= 2)) return false;
        if (active.has('has-offers') && !r.offer) return false;
        return true;
      }),
    [restaurants, search, active],
  );

  const toggle = (id) => setActive((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const circle = { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(243,244,246,0.8)', borderWidth: 1, borderColor: 'rgba(229,231,235,0.6)', alignItems: 'center', justifyContent: 'center' };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '62%' }}>
            <View style={{ backgroundColor: 'rgba(250,2,114,0.1)', padding: 8, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(250,2,114,0.2)' }}>
              <MapPin size={18} color={PINK} />
            </View>
            <View style={{ flexShrink: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 1 }}>DINING LOCATION</Text>
                <ChevronDown size={12} color={PINK} />
              </View>
              <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{subtitle ? `${title}` : title || 'Select Location'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={() => soon('My bookings')} style={[circle, { backgroundColor: '#FFF2EB', borderColor: 'rgba(235,89,14,0.3)' }]}><Utensils size={15} color={PRIMARY} /></Pressable>
            <Pressable onPress={() => navigation.navigate('FoodWallet')} style={circle}><Wallet size={15} color="#1F2937" /></Pressable>
            <Pressable onPress={() => navigation.navigate('FoodCart')} style={circle}>
              <ShoppingCart size={15} color="#1F2937" />
              {cartCount > 0 ? <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' }}><Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>{cartCount > 99 ? '99+' : cartCount}</Text></View> : null}
            </Pressable>
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(229,231,235,0.6)', paddingLeft: 12 }}>
            <Search size={18} color={PINK} strokeWidth={2.5} />
            <TextInput value={search} onChangeText={setSearch} placeholder="Search for dining..." placeholderTextColor="#9CA3AF" style={{ flex: 1, height: 40, paddingHorizontal: 8, fontSize: 14, fontWeight: '700', color: '#1F2937' }} />
            <View style={{ borderLeftWidth: 2, borderLeftColor: '#E5E7EB', paddingHorizontal: 8 }}>
              <View style={{ padding: 8, backgroundColor: '#fff', borderRadius: 99, elevation: 1 }}><Mic size={16} color={PINK} strokeWidth={2.5} /></View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={PRIMARY} />} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
        <Banner banners={banners} />

        {categories.length ? (
          <View style={{ paddingHorizontal: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {categories.map((c) => (
              <Pressable key={c.slug} onPress={() => soon(c.name)} style={{ width: (W - 24 - 12) / 2, height: 150, borderRadius: 18, borderWidth: 1, borderColor: '#E9E1D8', backgroundColor: '#fff', overflow: 'hidden', shadowColor: '#23180C', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
                <View style={{ height: '72%', backgroundColor: '#F1F5F9' }}>
                  {c.imageUrl ? <Image source={{ uri: c.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : (
                    <LinearGradient colors={['#FFEDD5', '#FFFBEB']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><UtensilsCrossed size={32} color="#FB923C" /></LinearGradient>
                  )}
                </View>
                <View style={{ height: '28%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                  <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: '#2D2722' }}>{c.name}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={{ marginTop: 32, marginBottom: 24, paddingHorizontal: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', flex: 1, paddingRight: 8 }}>Popular Restaurants Within 10km</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280' }}>{filtered.length} nearby places</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
            {FILTERS.map((f) => {
              const on = active.has(f.id);
              return (
                <Pressable key={f.id} onPress={() => toggle(f.id)} style={{ height: 32, paddingHorizontal: 12, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: on ? PRIMARY : '#fff', borderWidth: 1, borderColor: on ? PRIMARY : '#E5E7EB' }}>
                  {f.star ? <Star size={12} color={on ? '#fff' : '#6B7280'} fill={on ? '#fff' : 'none'} /> : null}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: on ? '#fff' : '#111827' }}>{f.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {loading ? (
            <View style={{ gap: 16 }}>{[0, 1].map((k) => <View key={k} style={{ height: 300, borderRadius: 16, backgroundColor: '#F3F4F6' }} />)}</View>
          ) : filtered.length === 0 ? (
            <View style={{ borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#EADFCE', backgroundColor: '#FFFAF4', paddingHorizontal: 24, paddingVertical: 48 }}>
              <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: '500', color: '#6B7280' }}>No dining restaurants found.</Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {filtered.map((r) => (
                <DiningCard key={String(r.id)} r={r} favorite={favorites.includes(r.slug)} onFavorite={() => toggleFavorite(r.slug)} onPress={() => navigation.navigate('RestaurantDetails', { slug: r.slug })} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
