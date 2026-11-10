import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { Text } from '../Text';

// 1:1 port of web Taxi ExplorerSection.jsx: "Explore India" auto-scrolling marquee.
const CITIES = [
  { title: 'Taj Mahal', image: require('../../../assets/explore/taj.jpeg'), label: 'Agra', code: 'AGR', drop: 'Taj Mahal, Agra' },
  { title: 'Hawa Mahal', image: { uri: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=400&q=80' }, label: 'Jaipur', code: 'JAI', drop: 'Hawa Mahal, Jaipur' },
  { title: 'India Gate', image: require('../../../assets/explore/india_gate_real.webp'), label: 'New Delhi', code: 'DEL', drop: 'India Gate, New Delhi' },
  { title: 'Charminar', image: { uri: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80' }, label: 'Hyderabad', code: 'HYD', drop: 'Charminar, Hyderabad' },
  { title: 'Gateway of India', image: { uri: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=400&q=80' }, label: 'Mumbai', code: 'BOM', drop: 'Gateway of India, Mumbai' },
  { title: 'Howrah Bridge', image: { uri: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=400&q=80' }, label: 'Kolkata', code: 'CCU', drop: 'Howrah Bridge, Kolkata' },
];
const CARD_W = 190;
const GAP = 16;
const SET_W = CITIES.length * (CARD_W + GAP);

export default function ExplorerSection() {
  const navigation = useNavigation();
  const x = useRef(new Animated.Value(0)).current;

  // marquee: translateX 0 -> -50% over 30s, linear, infinite
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(x, { toValue: -SET_W, duration: 30000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [x]);

  const doubled = [...CITIES, ...CITIES];

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
      <View style={{ marginBottom: 16, marginLeft: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Sparkles size={11} color="#4F46E5" />
          <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 1.6, color: '#4F46E5' }}>DISCOVER INCREDIBLE INDIA</Text>
        </View>
        <View style={{ alignSelf: 'flex-start', marginTop: 2 }}>
          <Text style={{ fontSize: 19, fontWeight: '900', color: '#1E293B', letterSpacing: -0.4 }}>Explore India</Text>
          <LinearGradient colors={['rgba(99,102,241,0.4)', 'rgba(99,102,241,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', bottom: -3, left: 0, right: 0, height: 2.5 }} />
        </View>
        <Text style={{ marginTop: 4, fontSize: 11, fontWeight: '700', color: '#64748B' }}>Top tourist destinations across the country</Text>
      </View>

      <View style={{ overflow: 'hidden', marginHorizontal: -20, paddingVertical: 8 }}>
        <Animated.View style={{ flexDirection: 'row', gap: GAP, paddingLeft: 20, transform: [{ translateX: x }] }}>
          {doubled.map((city, idx) => (
            <Pressable
              key={idx}
              onPress={() => navigation.navigate('SelectLocation', { drop: city.drop || city.title })}
              style={({ pressed }) => ({ width: CARD_W, transform: [{ scale: pressed ? 0.98 : 1 }] })}
            >
              <View style={{ height: 120, borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 8 }, elevation: 2 }}>
                <Image source={city.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <LinearGradient colors={['transparent', 'rgba(2,6,23,0.2)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
                <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', color: '#4F46E5', letterSpacing: 1.4 }}>{city.code}</Text>
                </View>
              </View>
              <View style={{ marginTop: 10, paddingHorizontal: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#1E293B', letterSpacing: -0.2 }}>{city.title}</Text>
                  <ArrowRight size={11} color="#94A3B8" />
                </View>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#94A3B8', marginTop: 2, letterSpacing: 0.9 }}>{city.label.toUpperCase()}</Text>
              </View>
            </Pressable>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}
