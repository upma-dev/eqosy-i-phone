import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import RestaurantCard from '../../components/food/RestaurantCard';
import { transformRestaurant, sortForDisplay } from '../../lib/restaurants';
import { useNavigation } from '@react-navigation/native';
import { Check, ChevronDown, IndianRupee, MapPin, SlidersHorizontal, Star } from 'lucide-react-native';
import { Text } from '../../components/Text';
import VerticalHeader from '../../components/VerticalHeader';
import FoodSearchRow from '../../components/food/FoodSearchRow';
import HeroBannerSlider from '../../components/food/HeroBannerSlider';
import PromoRow from '../../components/food/PromoRow';
import PromotionBannerCarousel from '../../components/food/PromotionBannerCarousel';
import { CategoryRail, CategoryRailHeader } from '../../components/food/CategoryRail';
import { foodService, dataOf } from '../../api/foodServices';
import { normalizeImageUrl } from '../../lib/image';
import { useLocationStore } from '../../store/location';
import { useZone } from '../../store/zone';
import { useFood } from '../../store/food';
import { useCart } from '../../store/cart';

// Port of web Food/pages/user/Home.jsx, part 1: header, banners, promo row, categories, filters.
const PRIMARY = '#EB590E';
const FILTERS = [
  { id: 'rating-4-plus', label: 'Rating 4.0+', icon: Star },
  { id: 'rating-35-plus', label: 'Rating 3.5+', icon: Star },
  { id: 'pricing-no-packaging', label: 'No packaging charges' },
  { id: 'pricing-same-price', label: 'Same price as restaurant' },
  { id: 'price-under-200', label: 'Under 200', icon: IndianRupee },
  { id: 'distance-under-2km', label: 'Nearby (< 2 km)', icon: MapPin },
];

const soon = (what) => Alert.alert(what, 'Coming soon in the app.');

export default function FoodHomeScreen() {
  const navigation = useNavigation();
  const coords = useLocationStore((s) => s.coords);
  const { detect, load } = useZone();
  const zoneId = useZone((z) => z.zoneId);
  const zoneStatus = useZone((z) => z.status);
  const { vegMode, setVegMode, favorites, toggleFavorite, loadFavorites } = useFood();
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRest, setLoadingRest] = useState(true);

  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [active, setActive] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const [b, c] = await Promise.allSettled([
      foodService.heroBanners('food'),
      foodService.publicCategories({ section: 'food', isRestaurant: 'true' }),
    ]);
    if (b.status === 'fulfilled') {
      const d = dataOf(b.value)?.data;
      setBanners(Array.isArray(d?.banners) ? d.banners : Array.isArray(d) ? d : []);
    }
    if (c.status === 'fulfilled') {
      const d = dataOf(c.value);
      const list = d?.data?.categories || d?.categories || [];
      setCategories(
        Array.isArray(list)
          ? list.map((cat, i) => ({
              id: String(cat?.id || cat?._id || cat?.slug || i),
              name: cat?.name || '',
              slug: cat?.slug || String(cat?.name || '').toLowerCase().replace(/\s+/g, '-'),
              image: normalizeImageUrl(cat?.image || cat?.imageUrl),
            }))
          : [],
      );
    }
    setLoadingCats(false);
  }, []);

  useEffect(() => { useCart.getState().load(); load(); loadFavorites(); fetchAll(); }, [load, loadFavorites, fetchAll]);

  // Same query the web Home sends (zone-only listing + active filters).
  const fetchRestaurants = useCallback(async () => {
    if (!zoneId) { setLoadingRest(zoneStatus === 'loading'); setRestaurants([]); return; }
    setLoadingRest(true);
    try {
      const params = { zoneId, isRestaurant: 'true' };
      if (coords) { params.lat = coords.latitude; params.lng = coords.longitude; }
      if (active.has('rating-4-plus')) params.minRating = 4.0;
      else if (active.has('rating-35-plus')) params.minRating = 3.5;
      if (active.has('distance-under-2km')) params.radiusKm = 2.0;
      if (active.has('price-under-200')) params.maxPrice = 200;
      const attrs = [];
      if (active.has('pricing-same-price')) attrs.push('same_price');
      if (active.has('pricing-no-packaging')) attrs.push('no_packaging');
      if (attrs.length) params.pricingAttributes = attrs.join(',');
      const res = await foodService.restaurants(params);
      const list = dataOf(res)?.data?.restaurants || dataOf(res)?.restaurants || [];
      setRestaurants(sortForDisplay(list.map((r) => transformRestaurant(r, coords))));
    } catch {
      setRestaurants([]);
    } finally {
      setLoadingRest(false);
    }
  }, [zoneId, zoneStatus, coords, active]);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);
  useEffect(() => { if (coords) detect(coords.latitude, coords.longitude); }, [coords, detect]);

  const onRefresh = async () => { setRefreshing(true); await Promise.all([fetchAll(), fetchRestaurants()]); setRefreshing(false); };
  const toggle = (id) => setActive((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        stickyHeaderIndices={[]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Same header as Taxi (location + wallet/bell/cart + EqosyFood/Taxi/Grocery tabs) */}
        <VerticalHeader />
        <FoodSearchRow vertical="food" onSearch={() => navigation.navigate('FoodSearch')} vegMode={vegMode} onVegChange={setVegMode} />
        <HeroBannerSlider banners={banners} vertical="food" />

        <PromoRow onPress={(id) => (id === 'under-250' ? navigation.navigate('FoodUnder250') : id === 'offers' ? navigation.navigate('FoodOffers') : id === 'gourmet' ? navigation.navigate('FoodGourmet') : id === 'collections' ? navigation.navigate('FoodFavorites') : soon(id))} />
        <PromotionBannerCarousel section="food" />

        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <CategoryRailHeader onViewAll={() => navigation.navigate('FoodSearch', { cat: true })} />
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <CategoryRail categories={categories} loading={loadingCats} onPress={() => navigation.navigate('FoodSearch', { cat: true })} onSeeAll={() => navigation.navigate('FoodSearch', { cat: true })} />
        </View>

        {/* Horizontal filters */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
            <Pressable
              onPress={() => soon('Filters')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB' }}
            >
              <SlidersHorizontal size={14} color="#374151" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>Filters</Text>
              <ChevronDown size={12} color="#9CA3AF" />
            </Pressable>
            {FILTERS.map((f) => {
              const on = active.has(f.id);
              const Icon = f.icon;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => toggle(f.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1,
                    backgroundColor: on ? PRIMARY : '#fff', borderColor: on ? PRIMARY : '#D1D5DB',
                  }}
                >
                  {Icon ? (
                    <Icon size={14} color={on ? '#fff' : f.id.startsWith('rating') ? '#EAB308' : '#9CA3AF'} fill={!on && f.id.startsWith('rating') ? '#EAB308' : 'none'} />
                  ) : null}
                  <Text style={{ fontSize: 12, fontWeight: '600', color: on ? '#fff' : '#374151' }}>{f.label}</Text>
                  {on ? <Check size={12} color="#fff" /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Recommended for you: top rated, 2 per row */}
        {restaurants.length > 0 ? (
          <View style={{ paddingTop: 12 }}>
            <Text style={{ paddingHorizontal: 16, fontSize: 11, fontWeight: '600', letterSpacing: 2, color: '#9CA3AF' }}>RECOMMENDED FOR YOU</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingTop: 12 }}>
              {[...restaurants].sort((a, b) => b.rating - a.rating).slice(0, 4).map((r) => (
                <Pressable
                  key={`rec-${r.id}`}
                  onPress={() => navigation.navigate('RestaurantDetails', { slug: r.slug || r.id })}
                  style={{ width: '47.5%', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
                >
                  <View style={{ height: 112, backgroundColor: '#F9FAFB' }}>
                    {r.image ? <Image source={{ uri: r.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : null}
                    <View style={{ position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#059669', borderWidth: 1, borderColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{r.rating ? r.rating.toFixed(1) : 'NEW'}</Text>
                      <Star size={10} color="#fff" fill="#fff" />
                    </View>
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{r.name}</Text>
                    <Text numberOfLines={1} style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{r.cuisine}</Text>
                    <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>{r.deliveryTime}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* ALL RESTAURANTS */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', letterSpacing: 2, color: '#9CA3AF', textTransform: 'uppercase' }}>
            {restaurants.length} RESTAURANTS DELIVERING TO YOU
          </Text>
          <Text style={{ fontSize: 18, color: '#6B7280', marginBottom: 12 }}>Featured</Text>
          {loadingRest ? (
            <View style={{ gap: 20 }}>
              {[0, 1].map((i) => (
                <View key={i} style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6' }}>
                  <View style={{ height: 180, backgroundColor: '#F3F4F6' }} />
                  <View style={{ padding: 12, gap: 8 }}>
                    <View style={{ height: 14, width: '55%', borderRadius: 7, backgroundColor: '#F3F4F6' }} />
                    <View style={{ height: 10, width: '35%', borderRadius: 5, backgroundColor: '#F3F4F6' }} />
                  </View>
                </View>
              ))}
            </View>
          ) : zoneStatus === 'OUT_OF_SERVICE' ? (
            <View style={{ alignItems: 'center', padding: 32 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>We do not deliver here yet</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 6 }}>Change your location to see restaurants near you.</Text>
            </View>
          ) : restaurants.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 32 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>No restaurants found</Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 6 }}>Try removing some filters.</Text>
            </View>
          ) : (
            <View style={{ gap: 20 }}>
              {restaurants.map((r) => (
                <RestaurantCard
                  key={String(r.id)}
                  restaurant={r}
                  isFavorite={favorites.includes(r.slug || r.id)}
                  onFavorite={() => toggleFavorite(r.slug || r.id)}
                  onPress={() => navigation.navigate('RestaurantDetails', { slug: r.slug || r.id })}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
