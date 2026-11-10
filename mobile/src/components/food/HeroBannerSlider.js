import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getVerticalTheme } from '../../theme';
import { normalizeImageUrl } from '../../lib/image';

// Web HomeHeader "Container 3": full-width auto-sliding banners, rounded bottom, dots (h-[182px]).
const W = Dimensions.get('window').width;
const FALLBACK = [
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=900&h=500&fit=crop',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&h=500&fit=crop',
];

// object-cover + object-top: fill the 182px box, anchored to the top edge (RN cover centers).
function TopCoverImage({ uri }) {
  const [h, setH] = useState(182);
  useEffect(() => {
    Image.getSize(uri, (w, ih) => setH(Math.max(182, Math.round((W * ih) / w))), () => {});
  }, [uri]);
  return <Image source={{ uri }} style={{ position: 'absolute', top: 0, left: 0, width: W, height: h }} resizeMode="cover" />;
}

export default function HeroBannerSlider({ banners = [], vertical = 'food' }) {
  const navigation = useNavigation();
  const theme = getVerticalTheme(vertical);
  const slides = (banners.length ? banners : FALLBACK.map((u, i) => ({ id: i, imageUrl: u }))).map((b, i) => ({
    id: b?._id || b?.id || i,
    image: normalizeImageUrl(typeof b === 'string' ? b : b?.imageUrl || b?.image) || FALLBACK[i % FALLBACK.length],
    restaurant: b?.linkedRestaurants?.[0],
  }));

  const [current, setCurrent] = useState(0);
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    Animated.timing(x, { toValue: -current * W, duration: 700, useNativeDriver: true }).start();
  }, [current, x]);

  return (
    <View style={{ backgroundColor: theme.theme, paddingTop: 8, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 }}>
      <View style={{ width: W, height: 182, overflow: 'hidden' }}>
        <Animated.View style={{ flexDirection: 'row', width: W * slides.length, height: '100%', transform: [{ translateX: x }] }}>
          {slides.map((s) => (
            <Pressable
              key={String(s.id)}
              style={{ width: W, height: '100%' }}
              onPress={() => {
                const slug = s.restaurant?.slug || s.restaurant?.restaurantId || s.restaurant?._id;
                if (slug) navigation.navigate('RestaurantDetails', { slug });
              }}
            >
              <TopCoverImage uri={s.image} />
            </Pressable>
          ))}
        </Animated.View>
        <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          {slides.map((_, i) => (
            <View key={i} style={{ height: 6, width: i === current ? 20 : 6, borderRadius: 3, backgroundColor: i === current ? '#fff' : 'rgba(255,255,255,0.45)' }} />
          ))}
        </View>
      </View>
    </View>
  );
}
