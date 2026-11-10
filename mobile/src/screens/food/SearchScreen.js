import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, History, Mic, Search, Star, X } from 'lucide-react-native';
import { Text } from '../../components/Text';
import foodApi from '../../api/foodClient';
import { dataOf } from '../../api/foodServices';
import { normalizeImageUrl } from '../../lib/image';
import { transformRestaurant } from '../../lib/restaurants';
import RestaurantCard from '../../components/food/RestaurantCard';
import { useLocationStore } from '../../store/location';
import { useZone } from '../../store/zone';
import { useFood } from '../../store/food';

// Port of web Food/pages/user/search/ProfessionalSearch.jsx (unified search: categories, history, dishes, restaurants).
const PRIMARY = '#EB590E';
const ROSE = '#F43F5E';
const HISTORY_KEY = 'eqosy_food_search_history';
const DEFAULT_DISH = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80';

const sortByName = (a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), undefined, { sensitivity: 'base' });

export default function SearchScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const grocery = params?.vertical === 'grocery';
  const isRestaurant = grocery ? 'false' : 'true';
  const coords = useLocationStore((s) => s.coords);
  const zoneId = useZone((z) => z.zoneId);
  const { favorites, toggleFavorite } = useFood();

  const [query, setQuery] = useState(params?.q || '');
  const [debounced, setDebounced] = useState(params?.q || '');
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [results, setResults] = useState({ restaurants: [], dishes: [] });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => { AsyncStorage.getItem(HISTORY_KEY).then((v) => v && setHistory(JSON.parse(v))).catch(() => {}); }, []);
  useEffect(() => { const t = setTimeout(() => setDebounced(query.trim()), 400); return () => clearTimeout(t); }, [query]);

  useEffect(() => {
    (async () => {
      try {
        const p = { isRestaurant, ...(zoneId ? { zoneId } : {}) };
        let list = dataOf(await foodApi.get('/food/search/categories/admin', { params: p }))?.data?.categories || [];
        if (!list.length) list = dataOf(await foodApi.get('/food/search/categories/admin', { params: { isRestaurant } }))?.data?.categories || [];
        setCategories(Array.isArray(list) ? list : []);
      } catch {}
    })();
  }, [zoneId, isRestaurant]);

  const addHistory = (term) => {
    if (!term) return;
    const next = [term, ...history.filter((h) => h !== term)].slice(0, 5);
    setHistory(next);
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next)).catch(() => {});
  };
  const clearHistory = () => { setHistory([]); AsyncStorage.removeItem(HISTORY_KEY).catch(() => {}); };

  const search = useCallback(async (q, cat) => {
    if (!q && !cat) { setResults({ restaurants: [], dishes: [] }); return; }
    setLoading(true);
    try {
      const res = await foodApi.get('/food/search/unified', { params: { q, categoryId: cat, lat: coords?.latitude, lng: coords?.longitude, zoneId, isRestaurant } });
      const all = dataOf(res)?.data?.restaurants || dataOf(res)?.restaurants || [];
      setResults({ restaurants: all.filter((r) => r.matchType === 'restaurant' || !r.matchType), dishes: all.filter((r) => r.matchType === 'food') });
    } catch {
      setResults({ restaurants: [], dishes: [] });
    } finally { setLoading(false); }
  }, [coords, zoneId, isRestaurant]);

  useEffect(() => { search(debounced, selectedCat); }, [debounced, selectedCat, search]);

  const clear = () => { setQuery(''); setSelectedCat(null); setResults({ restaurants: [], dishes: [] }); };
  const open = (r, dishId) => navigation.navigate('RestaurantDetails', { slug: r.slug || r._id, dish: dishId });
  const visibleCats = useMemo(() => [...(grocery ? categories.filter((c) => normalizeImageUrl(typeof c.image === 'string' ? c.image : c.image?.url || '')) : categories)].sort(sortByName), [categories, grocery]);
  const restaurants = useMemo(() => results.restaurants.map((r) => transformRestaurant(r, coords)), [results.restaurants, coords]);
  const catName = categories.find((c) => c._id === selectedCat)?.name || query;
  const hasQuery = !!(query || selectedCat);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
          <Pressable onPress={() => navigation.goBack()} style={{ padding: 8 }}><ArrowLeft size={20} color="#0F172A" /></Pressable>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, zIndex: 1 }} />
            <TextInput
              autoFocus value={query} onChangeText={setQuery}
              placeholder={grocery ? 'Search for stores or products...' : 'Search for restaurants or dishes...'} placeholderTextColor="#94A3B8"
              style={{ height: 44, backgroundColor: '#F1F5F9', borderRadius: 12, paddingLeft: 40, paddingRight: 64, fontSize: 14, color: '#0F172A' }}
            />
            {query ? <Pressable onPress={clear} style={{ position: 'absolute', right: 40 }}><X size={16} color="#94A3B8" /></Pressable> : null}
            <Pressable style={{ position: 'absolute', right: 12 }}><Mic size={20} color="#94A3B8" /></Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 64 }}>
        {!query && selectedCat ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
            {visibleCats.map((c) => (
              <Pressable key={c._id} onPress={() => setSelectedCat(selectedCat === c._id ? null : c._id)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, backgroundColor: selectedCat === c._id ? ROSE : '#fff', borderColor: selectedCat === c._id ? ROSE : '#E2E8F0' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: selectedCat === c._id ? '#fff' : '#475569' }}>{c.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {!query && !selectedCat && !loading ? (
          <View style={{ marginBottom: 32 }}>
            <Text style={{ marginBottom: 16, paddingHorizontal: 4, fontSize: 14, fontWeight: '600', letterSpacing: 1.2, color: '#64748B' }}>TOP CATEGORIES</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 }}>
              {visibleCats.map((c) => {
                const img = normalizeImageUrl(typeof c.image === 'string' ? c.image : c.image?.url || '');
                return (
                  <Pressable key={c._id} onPress={() => setSelectedCat(c._id)} style={{ width: '25%', alignItems: 'center' }}>
                    <View style={{ width: 56, height: 56, borderRadius: 16, marginBottom: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', backgroundColor: '#FFF1F2', alignItems: 'center', justifyContent: 'center' }}>
                      {img ? <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} /> : <Text style={{ fontSize: 12, fontWeight: '900', color: ROSE }}>{(c.name || 'FC').slice(0, 2).toUpperCase()}</Text>}
                    </View>
                    <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '500', color: '#475569', textAlign: 'center' }}>{c.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {loading ? <View style={{ alignItems: 'center', paddingVertical: 80 }}><ActivityIndicator color={ROSE} size="large" /><Text style={{ marginTop: 12, fontSize: 14, color: '#94A3B8' }}>Finding the best for you...</Text></View> : null}

        {!query && !selectedCat && !loading && history.length ? (
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', letterSpacing: 1.2, color: '#64748B' }}>RECENTLY SEARCHED</Text>
              <Pressable onPress={clearHistory}><Text style={{ fontSize: 12, fontWeight: '600', letterSpacing: 1.2, color: ROSE }}>CLEAR</Text></Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {history.map((t, i) => (
                <Pressable key={i} onPress={() => setQuery(t)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 99 }}>
                  <History size={12} color="#64748B" /><Text style={{ fontSize: 14, color: '#475569' }}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {!loading && hasQuery ? (
          <View style={{ gap: 32 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: results.dishes.length ? '#059669' : '#64748B' }}>
              {results.dishes.length
                ? `${results.dishes.length} ${results.dishes.length === 1 ? 'item' : 'items'} available${restaurants.length ? ` from ${restaurants.length} ${restaurants.length === 1 ? 'restaurant' : 'restaurants'}` : ''}`
                : restaurants.length ? `${restaurants.length} ${restaurants.length === 1 ? 'restaurant' : 'restaurants'} found` : `No items available for "${catName}" right now`}
            </Text>

            {results.dishes.length ? (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}><View style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: '#F97316' }} /><Text style={{ fontSize: 18, fontWeight: '700' }}>{grocery ? 'Products from stores' : 'Dishes from restaurants'}</Text></View>
                <View style={{ gap: 16 }}>
                  {results.dishes.map((r) => {
                    const img = normalizeImageUrl(r.matchedDishImage || r.coverImages?.[0]?.url || r.coverImages?.[0] || '') || DEFAULT_DISH;
                    const veg = r.matchedDishFoodType === 'Veg' || (r.matchedDishFoodType !== 'Non-Veg' && r.pureVegRestaurant);
                    const price = r.matchedDishPrice || r.featuredPrice || 149;
                    return (
                      <Pressable key={`${r._id}-${r.matchedDishId || 'dish'}`} onPress={() => { addHistory(query); open(r, r.matchedDishId); }} style={{ flexDirection: 'row', gap: 16, padding: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }}>
                        <View style={{ width: 96, height: 96, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                          <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} />
                          <View style={{ position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: veg ? '#10B981' : '#F43F5E', backgroundColor: veg ? 'rgba(2,44,34,0.9)' : 'rgba(76,5,25,0.9)' }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: veg ? '#34D399' : '#FB7185' }} />
                            <Text style={{ fontSize: 9, fontWeight: '900', color: veg ? '#34D399' : '#FB7185' }}>{veg ? 'VEG' : 'NON-VEG'}</Text>
                          </View>
                        </View>
                        <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: PRIMARY }}>₹{Math.round(price)}</Text>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#047857', backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' }}>AVAILABLE</Text>
                          </View>
                          <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>{r.matchedDish || r.restaurantName}</Text>
                          <Text numberOfLines={1} style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>by {r.restaurantName}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Star size={12} color="#F97316" fill="#F97316" /><Text style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>{r.rating || 'New'}</Text></View>
                            <Text style={{ fontSize: 12, color: '#64748B' }}>• {r.estimatedDeliveryTimeMinutes ? `${r.estimatedDeliveryTimeMinutes} mins` : '30-40 mins'}</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {restaurants.length ? (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}><View style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: ROSE }} /><Text style={{ fontSize: 18, fontWeight: '700' }}>{grocery ? 'Stores' : 'Restaurants'}</Text></View>
                <View style={{ gap: 20 }}>
                  {restaurants.map((r) => (
                    <RestaurantCard key={String(r.id)} restaurant={r} isFavorite={favorites.includes(r.slug || r.id)} onFavorite={() => toggleFavorite(r.slug || r.id)} onPress={() => { addHistory(query); open(r); }} />
                  ))}
                </View>
              </View>
            ) : null}

            {!results.restaurants.length && !results.dishes.length ? (
              <View style={{ alignItems: 'center', paddingVertical: 80 }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><Search size={32} color="#CBD5E1" /></View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 8 }}>We couldn't find any results</Text>
                <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', maxWidth: 260 }}>Maybe try searching for something else or check your spelling</Text>
                <Pressable onPress={clear} style={{ marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: ROSE }}><Text style={{ color: ROSE, fontWeight: '600' }}>Clear all filters</Text></Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
