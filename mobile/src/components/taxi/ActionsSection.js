import React from 'react';
import { Alert, Animated, Image, Pressable, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, Package } from 'lucide-react-native';
import { Text } from '../Text';
import { useEnter, useFloat } from './anim';
import { IMPLEMENTED } from './SuperAppHero';

// 1:1 port of web Taxi ActionsSection.jsx ("What do you need today?" Ride / Delivery cards).
const PRIMARY = '#F38F24'; // --app-primary (taxiUser)
const IMG = {
  bike: require('../../../assets/vehicles/bike.png'),
  auto: require('../../../assets/vehicles/auto.png'),
  car: require('../../../assets/vehicles/car.png'),
  delivery: require('../../../assets/vehicles/Delivery.png'),
};

function GatewayCard({ title, subtitle, route, gradient, accent, button, isRide, delay }) {
  const navigation = useNavigation();
  const enter = useEnter(delay, 600);
  const a = useFloat(-3.5, 2800);
  const b = useFloat(-4, 2600);
  const pill = useFloat(1.04, 3000, isRide ? 0 : 1500, 1);
  const badge = useFloat(-6, 1800);

  const onPress = () => {
    if (!IMPLEMENTED.includes(route)) return Alert.alert(title, 'Coming soon in the app.');
    navigation.navigate(route);
  };

  return (
    <Animated.View
      style={{
        flex: 1, opacity: enter,
        transform: [{ translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [isRide ? -50 : 50, 0] }) }],
      }}
    >
      <Pressable onPress={onPress} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
        <LinearGradient
          colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            minHeight: 190, padding: 18, borderRadius: 8, justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
            shadowColor: '#0F172A', shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 12 }, elevation: 3,
          }}
        >
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15, overflow: 'hidden' }} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 160 160" fill="none">
              <Path d={isRide ? 'M-10,40 Q40,70 85,30 T170,90' : 'M170,40 Q120,70 85,30 T-10,90'} stroke="#0F172A" strokeWidth={1.5} strokeDasharray="4 4" />
              <Circle cx={isRide ? 90 : 70} cy={isRide ? 35 : 25} r={2} fill={accent} />
              <Circle cx={isRide ? 30 : 130} cy={isRide ? 55 : 45} r={1.5} fill="#475569" />
            </Svg>
          </View>

          <View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#1E293B', letterSpacing: -0.4, lineHeight: 20 }}>{title}</Text>
            <Text style={{ marginTop: 6, fontSize: 10.5, fontWeight: '700', color: '#64748B', maxWidth: 130, lineHeight: 14 }}>{subtitle}</Text>
          </View>

          {/* Illustrations */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
            {isRide ? (
              <>
                <Animated.View style={{ position: 'absolute', bottom: 4, right: -4, width: 50, height: 50, transform: [{ translateY: a }] }}>
                  <Image source={IMG.auto} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </Animated.View>
                <View style={{ position: 'absolute', bottom: 6, right: 34, width: 36, height: 36 }}>
                  <Image source={IMG.bike} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>
                <View style={{ position: 'absolute', bottom: 24, right: -10, width: 62, height: 62 }}>
                  <Image source={IMG.car} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>
              </>
            ) : (
              <Animated.View style={{ position: 'absolute', bottom: 6, right: -8, width: 86, height: 86, transform: [{ translateY: b }] }}>
                <Image source={IMG.delivery} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                <Animated.View style={{ position: 'absolute', top: -4, right: 8, padding: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: '#6366F1', transform: [{ translateY: badge }] }}>
                  <Package size={8} color="#fff" />
                </Animated.View>
              </Animated.View>
            )}
          </View>

          <View style={{ flexDirection: 'row' }}>
            <Animated.View style={{ transform: [{ scale: pill }] }}>
              <LinearGradient colors={button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 36, paddingHorizontal: 18, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#fff' }}>{isRide ? 'Book Now' : 'Send Now'}</Text>
                <ArrowRight size={12} strokeWidth={2.5} color="#fff" />
              </LinearGradient>
            </Animated.View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function ActionsSection() {
  const line = useEnter(0.2, 800);
  return (
    <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
      <View style={{ marginBottom: 20, marginLeft: 4, alignSelf: 'flex-start' }}>
        <Text style={{ fontSize: 19, fontWeight: '900', color: '#1E293B', letterSpacing: -0.4 }}>What do you need today?</Text>
        <Animated.View style={{ position: 'absolute', bottom: -3, left: 0, height: 2.5, width: '80%', opacity: line }}>
          <LinearGradient colors={[PRIMARY, 'rgba(243,143,36,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
        </Animated.View>
      </View>

      <View style={{ flexDirection: 'row', gap: 14 }}>
        <GatewayCard
          title="Ride" subtitle="Bike, Auto & Cab rides" route="SelectLocation" isRide delay={0.1}
          gradient={['rgba(255,253,240,0.8)', 'rgba(255,247,241,0.8)', 'rgba(255,229,211,0.7)']}
          accent={PRIMARY} button={[PRIMARY, '#E53935']}
        />
        <GatewayCard
          title="Delivery" subtitle="Send parcels across the city" route="ParcelType" isRide={false} delay={0.22}
          gradient={['rgba(255,253,245,0.8)', 'rgba(244,245,255,0.8)', 'rgba(236,233,255,0.7)']}
          accent="#7C3AED" button={['#7C3AED', '#4F46E5']}
        />
      </View>
    </View>
  );
}
