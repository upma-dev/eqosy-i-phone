import React, { useEffect, useRef } from 'react';
import { Alert, Animated, Image, Pressable, View } from 'react-native';
import { Text } from '../Text';

// 1:1 port of web Food home PromoRow.jsx (4 icon tiles).
const CARDS = [
  { id: 'offers', title: 'Hot Deals', value: 'Offers', icon: require('../../../assets/food/discount_promo.jpg') },
  { id: 'gourmet', title: 'Premium', value: 'Gourmet', icon: require('../../../assets/food/gourmet.png') },
  { id: 'under-250', title: 'Under ₹99', value: 'Switch 99', icon: require('../../../assets/food/price_promo.jpg') },
  { id: 'collections', title: 'Favorites', value: 'Collections', icon: require('../../../assets/food/collection.png') },
];

function Tile({ promo, index, onPress }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 400, delay: index * 50, useNativeDriver: true }).start();
  }, [v, index]);
  return (
    <Animated.View style={{ flex: 1, opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }}>
      <Pressable onPress={onPress} style={({ pressed }) => ({ alignItems: 'center', gap: 6, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
        <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center', padding: 2 }}>
          <Image source={promo.icon} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#111827', letterSpacing: -0.2, lineHeight: 15, marginBottom: 2 }}>{promo.value}</Text>
          <Text style={{ fontSize: 9, fontWeight: '700', color: '#6B7280' }}>{promo.title}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function PromoRow({ onPress }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20, width: '100%', maxWidth: 500, alignSelf: 'center' }}>
      {CARDS.map((p, i) => (
        <Tile key={p.id} promo={p} index={i} onPress={() => (onPress ? onPress(p.id) : Alert.alert(p.value, 'Coming soon in the app.'))} />
      ))}
    </View>
  );
}
