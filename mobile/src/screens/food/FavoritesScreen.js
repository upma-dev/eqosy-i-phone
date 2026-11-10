import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Clock, Heart, Star } from 'lucide-react-native';
import { Text } from '../../components/Text';
import foodApi from '../../api/foodClient';
import { dataOf } from '../../api/foodServices';
import { transformRestaurant } from '../../lib/restaurants';
import { useFood } from '../../store/food';

// Port of web Food/pages/user/profile/Favorites.jsx (My Favorites: restaurants tab, empty state, remove).
const PRIMARY = '#EB590E';
const FALLBACK = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=80';

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const { favorites, toggleFavorite, loadFavorites } = useFood();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('restaurants');

  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      await loadFavorites();
      const slugs = useFood.getState().favorites;
      const out = await Promise.all(slugs.map(async (s) => {
        try {
          const d = dataOf(await foodApi.get(`/food/restaurant/restaurants/${encodeURIComponent(s)}`));
          const raw = d?.restaurant || d?.data?.restaurant || (d?._id ? d : null);
          return raw ? { ...transformRestaurant(raw), favKey: s } : null;
        } catch { return null; }
      }));
      if (alive) { setItems(out.filter(Boolean)); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [loadFavorites]));

  const remove = (r) => Alert.alert('Remove', 'Remove this restaurant from favorites?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: () => { toggleFavorite(r.favKey); setItems((l) => l.filter((x) => x.favKey !== r.favKey)); } },
  ]);

  const count = favorites.length;
  const Header = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <Pressable onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} color="#000" /></Pressable>
      <View>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>My Favorites</Text>
        {count ? <Text style={{ marginTop: 2, fontSize: 14, fontWeight: '600', color: '#374151' }}>0 dishes • {count} {count === 1 ? 'restaurant' : 'restaurants'}</Text> : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FFFBEB' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Header />
        {loading ? <ActivityIndicator color={PRIMARY} style={{ marginTop: 48 }} /> : count === 0 ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 12, paddingVertical: 48, alignItems: 'center' }}>
            <Heart size={64} color="#9CA3AF" />
            <Text style={{ fontSize: 18, color: '#6B7280', marginVertical: 16 }}>You haven't added any favorites yet</Text>
            <Pressable onPress={() => navigation.navigate('FoodTabs')} style={{ backgroundColor: PRIMARY, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}><Text style={{ color: '#fff', fontWeight: '600' }}>Explore Restaurants</Text></Pressable>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
              {[['restaurants', `Restaurants (${count})`], ['dishes', 'Dishes (0)']].map(([id, label]) => (
                <Pressable key={id} onPress={() => setTab(id)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: tab === id ? PRIMARY : 'transparent' }}>
                  <Text style={{ fontWeight: '500', color: tab === id ? PRIMARY : '#6B7280' }}>{label}</Text>
                </Pressable>
              ))}
            </View>
            {tab === 'restaurants' ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                {items.map((r) => (
                  <Pressable key={r.favKey} onPress={() => navigation.navigate('RestaurantDetails', { slug: r.slug || r.id })} style={{ width: '47.5%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
                    <View style={{ height: 128 }}>
                      <Image source={{ uri: r.image || FALLBACK }} style={{ width: '100%', height: '100%' }} />
                      <Pressable onPress={() => remove(r)} style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}><Heart size={16} color="#EF4444" fill="#EF4444" /></Pressable>
                    </View>
                    <View style={{ padding: 12 }}>
                      <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700' }}>{r.name}</Text>
                      <Text numberOfLines={1} style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{r.cuisine}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}><Star size={12} color="#EAB308" fill="#EAB308" /><Text style={{ fontSize: 12 }}>{r.rating ? r.rating.toFixed(1) : 'New'}</Text></View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}><Clock size={12} color="#6B7280" /><Text style={{ fontSize: 12, color: '#6B7280' }}>{r.deliveryTime}</Text></View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}><Heart size={64} color="#9CA3AF" /><Text style={{ fontSize: 18, color: '#6B7280', marginTop: 16 }}>No dishes saved yet</Text></View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
