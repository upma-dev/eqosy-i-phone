import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Linking, Pressable, View } from 'react-native';
import { foodService, dataOf } from '../../api/foodServices';
import { useZone } from '../../store/zone';
import { normalizeImageUrl } from '../../lib/image';

// Port of web PromotionBannerCarousel.jsx: rounded 21:9 banners, auto-slide every 5s, dots.
export default function PromotionBannerCarousel({ section = 'food', width }) {
  const zoneId = useZone((s) => s.zoneId);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!zoneId) { setLoading(false); return undefined; }
    let alive = true;
    setLoading(true);
    foodService.promotionBanners(zoneId, section)
      .then((res) => {
        const list = dataOf(res)?.data?.banners || dataOf(res)?.banners;
        if (alive && Array.isArray(list)) setBanners(list);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [zoneId, section]);

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [index, fade]);

  if (loading) {
    return <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}><View style={{ height: 128, borderRadius: 24, backgroundColor: '#F3F4F6' }} /></View>;
  }
  if (!banners.length) return null;

  const b = banners[index] || banners[0];
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
      <View style={{ borderRadius: 24, overflow: 'hidden', aspectRatio: 21 / 9, backgroundColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 }}>
        <Animated.View style={{ flex: 1, opacity: fade }}>
          <Pressable style={{ flex: 1 }} onPress={() => /^https?:/i.test(b.ctaLink || '') && Linking.openURL(b.ctaLink)}>
            <Image source={{ uri: normalizeImageUrl(b.imageUrl) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </Pressable>
        </Animated.View>
        {banners.length > 1 ? (
          <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {banners.map((_, i) => (
              <View key={i} style={{ height: 6, width: i === index ? 24 : 6, borderRadius: 3, backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.5)' }} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
