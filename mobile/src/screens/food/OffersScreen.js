import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Clock, Star } from 'lucide-react-native';
import { Text } from '../../components/Text';
import foodApi from '../../api/foodClient';
import { dataOf } from '../../api/foodServices';
import { normalizeImageUrl } from '../../lib/image';

// Port of web Food/pages/user/Offers.jsx (banner, grouped dish offers, coupon cards).
const FALLBACK = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';

export default function OffersScreen() {
  const navigation = useNavigation();
  const [offers, setOffers] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    foodApi.get('/food/restaurant/offers')
      .then((res) => { const d = dataOf(res)?.data; if (alive && d) { setOffers(d.allOffers || []); setGrouped(d.groupedByOffer || {}); } })
      .catch((e) => { if (alive) setError(e?.message || 'Failed to load offers'); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [tick]);

  const groups = Object.entries(grouped);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={{ width: '100%', minHeight: 200, overflow: 'hidden' }}>
          <Image source={require('../../../assets/food/offerpagebanner.png')} style={{ width: '100%', height: 220 }} resizeMode="cover" />
          <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0 }}>
            <Pressable onPress={() => navigation.goBack()} style={{ margin: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(31,41,55,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={{ padding: 16, gap: 24 }}>
          {loading ? <View style={{ alignItems: 'center', paddingVertical: 48 }}><ActivityIndicator color="#EB590E" /></View> : null}
          {error && !loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 80 }}>
              <Text style={{ color: '#EF4444', textAlign: 'center' }}>{error}</Text>
              <Pressable onPress={() => setTick((t) => t + 1)} style={{ marginTop: 16, backgroundColor: '#111827', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}><Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text></Pressable>
            </View>
          ) : null}

          {!loading && !error ? (
            <>
              {groups.map(([text, dishes]) => (
                <View key={text}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#EF4444', textAlign: 'center', marginBottom: 16, letterSpacing: 0.5 }}>{text}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                    {dishes.slice(0, 8).map((d) => (
                      <Pressable key={d.id} onPress={() => navigation.navigate('RestaurantDetails', { slug: d.restaurantSlug })} style={{ width: '47%' }}>
                        <View style={{ height: 128, borderRadius: 12, overflow: 'hidden', marginBottom: 8, backgroundColor: '#F3F4F6' }}>
                          <Image source={{ uri: normalizeImageUrl(d.dishImage || d.restaurantImage || '') || FALLBACK }} style={{ width: '100%', height: '100%' }} />
                          <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#2563EB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>{d.offer}</Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#16A34A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{d.restaurantRating?.toFixed(1) || '0.0'}</Text><Star size={10} color="#fff" fill="#fff" />
                          </View>
                        </View>
                        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{d.restaurantName}</Text>
                        <Text numberOfLines={1} style={{ fontSize: 12, color: '#4B5563', marginBottom: 4 }}>{d.dishName} - ₹{d.discountedPrice}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Clock size={12} color="#6B7280" /><Text style={{ fontSize: 12, color: '#6B7280' }}>{d.deliveryTime}</Text></View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}

              {!groups.length && offers.length ? (
                <View style={{ gap: 16 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Available Coupons</Text>
                  {offers.map((o) => (
                    <View key={String(o.id || o.offerId)} style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, gap: 8, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <View><Text style={{ fontSize: 12, color: '#64748B' }}>Coupon</Text><Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: 1 }}>{o.couponCode || '-'}</Text></View>
                        <Text style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, fontWeight: '600', backgroundColor: '#2563EB', color: '#fff', overflow: 'hidden' }}>{o.title || 'Offer'}</Text>
                      </View>
                      <Text style={{ fontSize: 14, color: '#334155' }}><Text style={{ fontWeight: '600', fontSize: 14 }}>Restaurant:</Text> {o.restaurantName || 'All Restaurants'}</Text>
                      {o.endDate ? <Text style={{ fontSize: 12, color: '#64748B' }}>Valid till: {new Date(o.endDate).toLocaleDateString()}</Text> : null}
                    </View>
                  ))}
                </View>
              ) : null}

              {!offers.length && !groups.length ? <View style={{ alignItems: 'center', paddingVertical: 48 }}><Text style={{ color: '#6B7280' }}>No offers available at the moment</Text></View> : null}
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
