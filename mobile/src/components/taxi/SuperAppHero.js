import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, Bus, Car, Compass, MapPin, Package, Search, Send, Sparkles, Truck, Users } from 'lucide-react-native';
import { Text } from '../Text';
import GradientText from '../GradientText';

// 1:1 port of web Taxi/modules/user/components/SuperAppHero.jsx (h-[255px], split doors open after 1600ms).
// Screens already ported; the rest show 'coming soon' until their phase.
export const IMPLEMENTED = ['SelectLocation', 'BusTab'];
const W = Dimensions.get('window').width;
const HALF = W / 2;

const SERVICES = [
  { id: 'taxi', label: 'Taxi', Icon: Car, colors: ['#3B82F6', '#4F46E5'], route: 'SelectLocation', params: { preferredCategory: 'cab' } },
  { id: 'outstation', label: 'Outstation', Icon: Compass, colors: ['#2563EB', '#06B6D4'], route: 'Intercity' },
  { id: 'pooling', label: 'Pooling', Icon: Users, colors: ['#6366F1', '#2563EB'], route: 'Pooling' },
  { id: 'parcel', label: 'Parcel', Icon: Package, colors: ['#8B5CF6', '#9333EA'], route: 'ParcelType' },
  { id: 'bus', label: 'Bus', Icon: Bus, colors: ['#0EA5E9', '#3B82F6'], route: 'BusTab' },
];

// Float up/down loop (framer-motion animate={{ y: [0, -N, 0] }} repeat Infinity).
function useLoop(duration, from = 0, to = 1) {
  const v = useRef(new Animated.Value(from)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: to, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: from, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration, from, to]);
  return v;
}

export default function SuperAppHero({ onSearchFocus }) {
  const navigation = useNavigation();
  const [isOpen, setIsOpen] = useState(false);

  const door = useRef(new Animated.Value(0)).current; // 0 closed, 1 open
  const intro = useRef(new Animated.Value(0)).current; // content reveal
  const chips = useRef(SERVICES.map(() => new Animated.Value(0))).current;

  // Safety: never leave the chips invisible if an animation is skipped.
  useEffect(() => {
    const t = setTimeout(() => { intro.setValue(1); chips.forEach((c) => c.setValue(1)); }, 3600);
    return () => clearTimeout(t);
  }, [intro, chips]);

  useEffect(() => {
    const t = setTimeout(() => setIsOpen(true), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    Animated.spring(door, { toValue: isOpen ? 1 : 0, stiffness: 70, damping: 18, mass: 1, delay: 300, useNativeDriver: true }).start();
    if (isOpen) {
      Animated.timing(intro, { toValue: 1, duration: 600, delay: 500, useNativeDriver: true }).start();
      // Plain timings (no spring overshoot) so the chips always end fully visible.
      chips.forEach((c, i) => {
        Animated.timing(c, { toValue: 1, duration: 450, delay: 900 + i * 80, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => c.setValue(1));
      });
    } else {
      intro.setValue(0);
      chips.forEach((c) => c.setValue(0));
    }
  }, [isOpen, door, intro, chips]);

  const pulse = useLoop(2000, 0.5, 1);
  const floatLux = useLoop(4000, 0, -4);
  const ringScale = useLoop(3000, 1, 1.12);
  const floatBox = useLoop(3500, 0, -8);
  const drift1 = useLoop(5000, 0, -6);
  const drift2 = useLoop(4000, 0, 6);

  const leftX = door.interpolate({ inputRange: [0, 1], outputRange: [0, -HALF] });
  const rightX = door.interpolate({ inputRange: [0, 1], outputRange: [0, HALF] });
  const introY = intro.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  const go = (s) => {
    if (!IMPLEMENTED.includes(s.route)) return Alert.alert(s.label, 'Coming soon in the app.');
    navigation.navigate(s.route, s.params);
  };

  return (
    <View style={styles.root}>
      {/* 1. Background blobs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ position: 'absolute', top: -96, left: -80, width: 224, height: 224, borderRadius: 112, backgroundColor: 'rgba(79,70,229,0.15)' }} />
        <View style={{ position: 'absolute', bottom: -96, right: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(59,130,246,0.10)' }} />
      </View>

      {/* 3. Revealed content */}
      <View style={styles.content}>
        <Animated.View style={[styles.pill, { opacity: intro, transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }]}>
          <Sparkles size={10} color="#FBBF24" />
          <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 2.2, color: '#C7D2FE' }}>EQOSY SUPER APP EXPERIENCE</Text>
        </Animated.View>

        <View style={{ position: 'absolute', top: 56, left: 24, right: 24, height: 96, alignItems: 'center', gap: 14 }}>
          <Animated.View style={{ opacity: intro, transform: [{ scale: intro.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }}>
            <Animated.View style={{ position: 'absolute', top: -12, bottom: -12, left: -12, right: -12, borderRadius: 999, backgroundColor: 'rgba(251,191,36,0.20)', opacity: pulse }} />
            <GradientText text="eqosy" stops={['#FBBF24', '#FDE047', '#F59E0B']} style={{ fontSize: 36, fontWeight: '900', letterSpacing: -1.4, lineHeight: 38 }} />
          </Animated.View>

          <Animated.View style={{ width: '100%', maxWidth: 260, opacity: intro, transform: [{ translateY: introY }] }}>
            <Pressable onPress={onSearchFocus} style={styles.search}>
              <Search size={14} color="rgba(165,180,252,0.8)" />
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 11, fontWeight: '600', color: 'rgba(199,210,254,0.6)' }}>Where are we going today?</Text>
              <View style={styles.searchArrow}><ArrowRight size={9} color="#A5B4FC" /></View>
            </Pressable>
          </Animated.View>
        </View>

        <View style={{ position: 'absolute', bottom: 22, left: 28, right: 28, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {SERVICES.map((s, i) => (
            <Animated.View
              key={s.id}
              style={{ flex: 1, maxWidth: 50, opacity: chips[i], transform: [{ translateY: chips[i].interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }}
            >
              <Pressable onPress={() => go(s)} style={({ pressed }) => ({ alignItems: 'center', gap: 4, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
                <LinearGradient colors={s.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chip}>
                  <s.Icon size={15} color="#fff" />
                </LinearGradient>
                <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 0.8, color: '#94A3B8', textTransform: 'uppercase' }}>{s.label}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* 4. Left panel: Luxury Ride */}
      <Animated.View style={[styles.panel, { left: 0, borderRightWidth: 1, transform: [{ translateX: leftX }] }]}>
        <LinearGradient colors={['#0F172A', '#020617', '#1E1B4B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { opacity: 0.2 }]} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Defs>
              <SvgGradient id="lux" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#3B82F6" />
                <Stop offset="100%" stopColor="#6366F1" />
              </SvgGradient>
            </Defs>
            <Path d="M-20,50 Q20,20 50,60 T120,30" stroke="url(#lux)" strokeWidth={2} strokeDasharray="3 3" fill="none" />
          </Svg>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={styles.luxIcon}><Car size={10} color="#fff" /></View>
          <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 1.6, color: '#60A5FA' }}>LUXURY RIDE</Text>
        </View>

        <View style={{ height: 80, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{ transform: [{ translateY: floatLux }] }}>
            <Compass size={48} color="rgba(129,140,248,0.7)" strokeWidth={1.2} />
            <Animated.View style={{ position: 'absolute', top: -10, bottom: -10, left: -10, right: -10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(129,140,248,0.2)', transform: [{ scale: ringScale }] }} />
          </Animated.View>
          <View style={{ position: 'absolute', top: 8, left: 32 }}><MapPin size={16} color="#3B82F6" fill="rgba(59,130,246,0.1)" /></View>
          <View style={{ position: 'absolute', bottom: 16, right: 40 }}><MapPin size={14} color="#6366F1" fill="rgba(99,102,241,0.1)" /></View>
        </View>

        <View>
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: -0.2, lineHeight: 15 }}>Premium Transport</Text>
          <Text style={{ fontSize: 8, fontWeight: '700', color: '#94A3B8', marginTop: 2, letterSpacing: 0.8 }}>SAFE, RELIABLE MOBILITY</Text>
        </View>
      </Animated.View>

      {/* 5. Right panel: Express Parcel */}
      <Animated.View style={[styles.panel, { right: 0, borderLeftWidth: 1, transform: [{ translateX: rightX }] }]}>
        <LinearGradient colors={['#06B6D4', '#2563EB', '#4338CA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { opacity: 0.15 }]} pointerEvents="none">
          <Animated.View style={{ position: 'absolute', top: 24, right: 16, transform: [{ translateY: drift1 }] }}><Send size={24} color="#fff" /></Animated.View>
          <Animated.View style={{ position: 'absolute', bottom: 32, left: 16, transform: [{ translateY: drift2 }] }}><Truck size={24} color="#fff" /></Animated.View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end' }}>
          <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 1.6, color: '#DBEAFE' }}>EXPRESS PARCEL</Text>
          <View style={styles.parcelIcon}><Package size={10} color="#2563EB" /></View>
        </View>

        <View style={{ height: 80, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{ alignItems: 'center', transform: [{ translateY: floatBox }] }}>
            <Package size={48} color="#fff" strokeWidth={1.2} />
            <View style={{ position: 'absolute', bottom: -6, width: 32, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.2)' }} />
          </Animated.View>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: -0.2, lineHeight: 15 }}>Courier & Parcel</Text>
          <Text style={{ fontSize: 8, fontWeight: '700', color: '#DBEAFE', marginTop: 2, letterSpacing: 0.8 }}>SEND PACKAGES ANYWHERE</Text>
        </View>
      </Animated.View>

      {/* 6. Toggle doors */}
      <Pressable onPress={() => setIsOpen((p) => !p)} accessibilityLabel="Toggle Door Animation" style={styles.toggle}>
        <ArrowRight size={12} color="rgba(255,255,255,0.5)" style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%', height: 255, minHeight: 255, flexShrink: 0, overflow: 'hidden', backgroundColor: '#0B172A' },
  content: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  pill: {
    position: 'absolute', top: 22, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 14, paddingVertical: 8,
  },
  searchArrow: { width: 18, height: 18, borderRadius: 4, backgroundColor: 'rgba(99,102,241,0.2)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.3)', alignItems: 'center', justifyContent: 'center' },
  chip: {
    width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  panel: { position: 'absolute', top: 0, bottom: 0, width: '50%', padding: 16, justifyContent: 'space-between', overflow: 'hidden', borderColor: 'rgba(255,255,255,0.05)', zIndex: 20 },
  luxIcon: { width: 20, height: 20, borderRadius: 4, backgroundColor: '#2563EB', borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)', alignItems: 'center', justifyContent: 'center' },
  parcelIcon: { width: 20, height: 20, borderRadius: 4, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  toggle: { position: 'absolute', top: 12, right: 12, zIndex: 30, width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
});
