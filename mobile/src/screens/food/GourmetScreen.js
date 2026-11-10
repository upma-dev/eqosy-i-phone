import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { Text } from '../../components/Text';
import foodApi from '../../api/foodClient';
import { dataOf } from '../../api/foodServices';
import { transformRestaurant } from '../../lib/restaurants';
import RestaurantCard from '../../components/food/RestaurantCard';
import { useLocationStore } from '../../store/location';
import { useZone } from '../../store/zone';
import { useFood } from '../../store/food';

// Port of web Food/pages/user/Gourmet.jsx (banner, "Premium Gourmet Restaurants", restaurant cards).
export default function GourmetScreen() {
  const navigation = useNavigation();
  const coords = useLocationStore((s) => s.coords);
  const zoneId = useZone((z) => z.zoneId);
  const { favorites, toggleFavorite } = useFood();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    const params = { ...(zoneId ? { zoneId } : {}), ...(coords ? { lat: coords.latitude, lng: coords.longitude } : {}) };
    foodApi.get('/food/hero-banners/gourmet/public', { params })
      .then((res) => {
        const d = dataOf(res)?.data;
        const arr = d?.restaurants ?? (Array.isArray(d) ? d : []);
        if (alive) setList(arr.map((item) => transformRestaurant(item.restaurant || item, coords)));
      })
      .catch((e) => { if (alive) { setError(e?.message || 'Failed to load Gourmet restaurants'); setList([]); } })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [zoneId, coords, tick]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={{ width: '100%', minHeight: 200, overflow: 'hidden' }}>
          <Image source={require('../../../assets/food/gourmetpagebanner.png')} style={{ width: '100%', height: 220 }} resizeMode="cover" />
          <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0 }}>
            <Pressable onPress={() => navigation.goBack()} style={{ margin: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(31,41,55,0.6)', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} color="#fff" /></Pressable>
          </SafeAreaView>
        </View>

        <View style={{ padding: 16, gap: 16 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Premium Gourmet Restaurants</Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>Exquisite dining experiences delivered to your doorstep</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '600', letterSpacing: 2, color: '#9CA3AF' }}>{loading ? '...' : list.length} GOURMET RESTAURANTS</Text>

          {loading ? <View style={{ alignItems: 'center', paddingVertical: 48 }}><ActivityIndicator color="#EB590E" /></View> : null}
          {error && !loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 64 }}>
              <Text style={{ color: '#EF4444', textAlign: 'center' }}>{error}</Text>
              <Pressable onPress={() => setTick((t) => t + 1)} style={{ marginTop: 16, backgroundColor: '#111827', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}><Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text></Pressable>
            </View>
          ) : null}
          {!loading && !error ? (
            list.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}><Text style={{ color: '#6B7280' }}>No Gourmet restaurants available at the moment</Text></View>
            ) : (
              <View style={{ gap: 20 }}>
                {list.map((r) => (
                  <RestaurantCard key={String(r.id)} restaurant={r} isFavorite={favorites.includes(r.slug || r.id)} onFavorite={() => toggleFavorite(r.slug || r.id)} onPress={() => navigation.navigate('RestaurantDetails', { slug: r.slug || r.id })} />
                ))}
              </View>
            )
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
