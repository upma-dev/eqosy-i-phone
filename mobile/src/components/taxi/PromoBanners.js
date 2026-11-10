import React from 'react';
import { Animated, Image, Pressable, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, Clock3, Coins, Percent, ShieldCheck, Sparkles, Zap } from 'lucide-react-native';
import { Text } from '../Text';
import { useEnter, useFloat } from './anim';

// 1:1 port of web Taxi PromoBanners.jsx ("Smart choices" cards + savings promo).
const PRIMARY = '#F38F24';
const IMG = {
  auto: require('../../../assets/vehicles/auto.png'),
  taxi: require('../../../assets/services/taxi.png'),
};

function RecommendedCard({ title, description, gradient, accent, image, isLeft, delay }) {
  const navigation = useNavigation();
  const enter = useEnter(delay, 600);
  const drive = useEnter(delay + 0.3, 900);
  const float = useFloat(-3.5, 2800, isLeft ? 0 : 1400);
  const pulse = useFloat(1.05, 3000, isLeft ? 0 : 1500, 1);

  return (
    <Animated.View
      style={{ flex: 1, opacity: enter, transform: [{ translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [isLeft ? -50 : 50, 0] }) }] }}
    >
      <Pressable onPress={() => navigation.navigate('SelectLocation')} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
        <LinearGradient
          colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ minHeight: 170, padding: 18, borderRadius: 8, justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 3 }}
        >
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.2, overflow: 'hidden' }} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 160 140" fill="none">
              <Path d={isLeft ? 'M-10,30 Q40,60 80,20 T170,80' : 'M170,30 Q120,60 80,20 T-10,80'} stroke="#0F172A" strokeWidth={1.5} strokeDasharray="4 4" />
              <Circle cx={isLeft ? 30 : 130} cy={isLeft ? 40 : 35} r={2} fill={accent} />
            </Svg>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              {isLeft ? <Clock3 size={12} color={PRIMARY} /> : <ShieldCheck size={12} color="#2563EB" />}
            </View>
            <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 1, color: '#64748B', backgroundColor: 'rgba(255,255,255,0.4)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' }}>
              {isLeft ? 'FASTEST' : 'COMFORT'}
            </Text>
          </View>

          <View style={{ maxWidth: '65%', marginTop: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: '#1E293B', letterSpacing: -0.3, lineHeight: 18 }}>{title}</Text>
            <Text style={{ marginTop: 6, fontSize: 9.5, fontWeight: '700', color: '#64748B', lineHeight: 12 }}>{description}</Text>
          </View>

          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <LinearGradient colors={[PRIMARY, '#E53935']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                <ArrowRight size={13} strokeWidth={2.5} color="#fff" />
              </LinearGradient>
            </Animated.View>
          </View>

          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute', bottom: -10, right: -10, width: 95, height: 95, opacity: drive,
              transform: [{ translateX: drive.interpolate({ inputRange: [0, 1], outputRange: [isLeft ? -90 : 90, 0] }) }, { translateY: float }],
            }}
          >
            <Image source={image} style={{ width: 90, height: 90 }} resizeMode="contain" />
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function PromoBanners() {
  const navigation = useNavigation();
  const line = useEnter(0.2, 800);
  const coin = useFloat(-6, 2500);
  const tag = useFloat(5, 3200, 500);
  const car = useFloat(-4, 3000);
  const arrow = useFloat(3, 1500);

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
      <View style={{ marginBottom: 20, marginLeft: 4, alignSelf: 'flex-start' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Sparkles size={11} color={PRIMARY} />
          <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 1.6, color: PRIMARY }}>RECOMMENDED FOR YOU</Text>
        </View>
        <Text style={{ fontSize: 19, fontWeight: '900', color: '#1E293B', letterSpacing: -0.4, marginTop: 2 }}>Smart choices</Text>
        <Animated.View style={{ position: 'absolute', bottom: -2, left: 0, height: 2, width: '80%', opacity: line }}>
          <LinearGradient colors={['rgba(243,143,36,0.4)', 'rgba(243,143,36,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
        </Animated.View>
      </View>

      <View style={{ flexDirection: 'row', gap: 14 }}>
        <RecommendedCard
          title="In a hurry?" description="Auto for shorter wait times." image={IMG.auto} isLeft delay={0.1} accent={PRIMARY}
          gradient={['rgba(255,253,240,0.8)', 'rgba(255,245,236,0.7)', 'rgba(255,227,207,0.7)']}
        />
        <RecommendedCard
          title="Need space?" description="Cab for comfort and luggage." image={IMG.taxi} isLeft={false} delay={0.22} accent="#2563EB"
          gradient={['rgba(255,253,245,0.8)', 'rgba(238,245,255,0.7)', 'rgba(227,236,255,0.7)']}
        />
      </View>

      {/* Savings promo */}
      <Pressable onPress={() => navigation.navigate('SelectLocation')} style={{ marginTop: 20 }}>
        <LinearGradient
          colors={['#0B1528', '#0F1E36', '#0A1220']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 26, padding: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', shadowColor: '#0B172A', shadowOpacity: 0.35, shadowRadius: 25, shadowOffset: { width: 0, height: 20 }, elevation: 10 }}
        >
          <View pointerEvents="none" style={{ position: 'absolute', top: -64, left: -64, width: 224, height: 224, borderRadius: 112, backgroundColor: 'rgba(59,130,246,0.15)' }} />
          <View pointerEvents="none" style={{ position: 'absolute', bottom: -64, right: -64, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(251,191,36,0.10)' }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: 'rgba(245,158,11,0.2)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Sparkles size={11} color="#FBBF24" />
                  <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 1.4, color: '#FCD34D' }}>SAVINGS</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)', paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Percent size={9} color="#6EE7B7" />
                  <Text style={{ fontSize: 8.5, fontWeight: '700', color: '#6EE7B7' }}>Save 30%</Text>
                </View>
              </View>
              <Text style={{ fontSize: 19, fontWeight: '900', color: '#fff', letterSpacing: -0.3, lineHeight: 23 }}>Better savings on your next ride.</Text>
              <Text style={{ marginTop: 6, fontSize: 10.5, fontWeight: '500', color: 'rgba(203,213,225,0.8)', lineHeight: 16 }}>Book quickly and save more with instant cashback credits.</Text>
              <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <LinearGradient colors={['#FBBF24', '#F59E0B', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#020617' }}>Ride Now</Text>
                  <Animated.View style={{ transform: [{ translateX: arrow }] }}><ArrowRight size={13} strokeWidth={3} color="#020617" /></Animated.View>
                </LinearGradient>
                <Text style={{ fontSize: 8.5, fontWeight: '700', letterSpacing: 1, color: '#94A3B8' }}>LIMITED OFFER</Text>
              </View>
            </View>

            <View style={{ width: 130, height: 130, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
              <View style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' }} />
              <Svg style={{ position: 'absolute' }} width={130} height={130} viewBox="0 0 130 130" fill="none">
                <Path d="M15,90 C40,50 90,80 115,35" stroke="rgba(255,255,255,0.15)" strokeWidth={2} strokeDasharray="3 3" />
                <Circle cx={65} cy={68} r={3} fill="#F59E0B" />
              </Svg>
              <Animated.Image source={IMG.taxi} resizeMode="contain" style={{ width: 105, height: 105, transform: [{ translateY: car }] }} />
              <Animated.View style={{ position: 'absolute', top: -4, right: 4, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: 'rgba(251,191,36,0.9)', paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', transform: [{ translateY: coin }] }}>
                <Coins size={9} color="#020617" />
                <Text style={{ fontSize: 8, fontWeight: '900', color: '#020617' }}>₹100 OFF</Text>
              </Animated.View>
              <Animated.View style={{ position: 'absolute', bottom: -4, left: 0, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: 'rgba(37,99,235,0.9)', paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', transform: [{ translateY: tag }] }}>
                <Zap size={8} color="#fff" />
                <Text style={{ fontSize: 7.5, fontWeight: '700', color: '#fff' }}>Instant</Text>
              </Animated.View>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
