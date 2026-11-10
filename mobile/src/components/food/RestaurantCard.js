import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, Clock, Star } from 'lucide-react-native';
import { Text } from '../Text';

// Port of the web Food Home restaurant card (Card rounded-[28px], image strip h-48, Open now pill,
// #259539 rating box, delivery time | distance, pure-veg tag, offer badge).
function ImageStrip({ restaurant }) {
  const items = restaurant.recommendedImages.length
    ? restaurant.recommendedImages.map((i) => ({ url: i.image, name: i.name, price: i.price }))
    : restaurant.images.map((url) => ({ url }));
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (items.length < 2) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 3000);
    return () => clearInterval(t);
  }, [items.length]);

  useEffect(() => {
    fade.setValue(0.3);
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [index, fade]);

  const cur = items[index % Math.max(items.length, 1)];
  const active = index % Math.max(items.length, 1);

  return (
    <View style={{ height: 192, backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
      {cur?.url ? <Animated.Image source={{ uri: cur.url }} style={{ width: '100%', height: '100%', opacity: fade }} resizeMode="cover" /> : null}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.10)', 'rgba(0,0,0,0.45)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64 }} pointerEvents="none" />

      {cur?.name ? (
        <View style={{ position: 'absolute', left: 14, bottom: 22 }} pointerEvents="none">
          <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{cur.name}</Text>
          {cur.price ? <Text style={{ color: '#FDBA74', fontWeight: '700', fontSize: 12 }}>₹{cur.price}</Text> : null}
        </View>
      ) : null}

      {items.length > 1 ? (
        <View style={{ position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 }} pointerEvents="none">
          {items.map((_, i) => (
            <View key={i} style={{ height: 4, width: i === active ? 16 : 4, borderRadius: 2, backgroundColor: i === active ? '#fff' : 'rgba(255,255,255,0.6)' }} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function RestaurantCard({ restaurant, isFavorite, onFavorite, onPress }) {
  const open = restaurant.isActive && restaurant.isAcceptingOrders;
  const rating = Number(restaurant.rating);
  const total = Number(restaurant.raw?.totalRatings || 0);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: '#fff', borderRadius: 28, overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
        transform: [{ scale: pressed ? 0.98 : 1 }], opacity: open ? 1 : 0.75,
      })}
    >
      <View>
        <ImageStrip restaurant={restaurant} />
        {restaurant.isSponsored ? (
          <LinearGradient colors={['#FBBF24', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
            <Star size={14} color="#fff" fill="#fff" />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>SPONSORED</Text>
          </LinearGradient>
        ) : null}
        <Pressable
          onPress={onFavorite}
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          style={{ position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: isFavorite ? '#EF4444' : 'rgba(255,255,255,0.9)', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
        >
          <Bookmark size={20} color={isFavorite ? '#fff' : '#1F2937'} fill={isFavorite ? '#fff' : 'none'} />
        </Pressable>
      </View>

      <View style={{ padding: 12, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: '500', color: '#030712', letterSpacing: -0.3, lineHeight: 22 }}>{restaurant.name}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: open ? '#10B981' : '#9CA3AF' }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '500', letterSpacing: 1.5 }}>{open ? 'OPEN NOW' : 'OFFLINE'}</Text>
              </View>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: rating > 0 ? '#259539' : '#9CA3AF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500', letterSpacing: -0.2 }}>{rating > 0 ? rating.toFixed(1) : 'NEW'}</Text>
              {rating > 0 ? <Star size={14} color="#fff" fill="#fff" strokeWidth={0} /> : null}
            </View>
            {rating > 0 && total > 0 ? (
              <Text style={{ fontSize: 10, color: '#6B7280', fontWeight: '500' }}>By {total >= 1000 ? `${(total / 1000).toFixed(1)}K+` : `${total}+`}</Text>
            ) : null}
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8, opacity: 0.8 }}>
          <Clock size={16} color="#6B7280" strokeWidth={1.5} />
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{restaurant.deliveryTime}</Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginHorizontal: 4 }}>|</Text>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{restaurant.distance}</Text>
        </View>

        <View style={{ paddingTop: 4, gap: 6 }}>
          {restaurant.pureVegRestaurant ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: 'rgba(167,243,208,0.8)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, borderWidth: 1, borderColor: '#059669', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#059669' }} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#047857' }}>100% PURE VEG</Text>
            </View>
          ) : null}
          {restaurant.offer ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', maxWidth: '100%', backgroundColor: '#F4F7FE', borderWidth: 1, borderColor: '#DCE4F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900', lineHeight: 12 }}>%</Text>
              </View>
              <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: '#2563EB', flexShrink: 1 }}>{restaurant.offer}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
