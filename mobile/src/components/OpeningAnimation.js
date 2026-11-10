import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';

// Port of the web AppOpeningAnimation: hold the splash, then the two "doors" open.
// Timings are the web ones: hold 1400ms, doors 850ms, unmount at 2400ms.
const W = Dimensions.get('window').width;
const logo = require('../../assets/brand/logo.png');

export default function OpeningAnimation({ onDone }) {
  const [visible, setVisible] = useState(true);
  const doors = useRef(new Animated.Value(0)).current; // 0 closed -> 1 open
  const content = useRef(new Animated.Value(0)).current; // logo fade/scale-in
  const fade = useRef(new Animated.Value(1)).current; // logo block fade-out
  const bar = useRef(new Animated.Value(0)).current; // progress bar
  const pulse = useRef(new Animated.Value(0)).current;
  const opened = useRef(false);

  const open = () => {
    if (opened.current) return;
    opened.current = true;
    Animated.parallel([
      Animated.timing(doors, { toValue: 1, duration: 850, easing: Easing.bezier(0.77, 0, 0.175, 1), useNativeDriver: true }),
      Animated.timing(fade, { toValue: 0, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      onDone?.();
    });
  };

  useEffect(() => {
    Animated.timing(content, { toValue: 1, duration: 700, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: true }).start();
    Animated.timing(bar, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), delay: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
    const t = setTimeout(open, 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  const leftX = doors.interpolate({ inputRange: [0, 1], outputRange: [0, -W / 2] });
  const rightX = doors.interpolate({ inputRange: [0, 1], outputRange: [0, W / 2] });
  const logoScale = content.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const logoY = content.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  const blockScale = fade.interpolate({ inputRange: [0, 1], outputRange: [1.15, 1] });
  const auraScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const auraOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.7] });
  const barX = bar.interpolate({ inputRange: [0, 1], outputRange: [-144, 0] });

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={open}>
      <View style={styles.root} pointerEvents="box-none">
        {/* Left door */}
        <Animated.View style={[styles.door, { left: 0, borderRightWidth: 1, transform: [{ translateX: leftX }] }]}>
          <LinearGradient colors={['#0B172A', '#0F172A', '#1E293B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        {/* Right door */}
        <Animated.View style={[styles.door, { right: 0, borderLeftWidth: 1, transform: [{ translateX: rightX }] }]}>
          <LinearGradient colors={['#0B172A', '#0F172A', '#1E293B']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>

        {/* Logo + brand */}
        <Animated.View style={[styles.center, { opacity: fade, transform: [{ scale: blockScale }] }]} pointerEvents="none">
          <View style={{ alignItems: 'center' }}>
            <Animated.View style={[styles.aura, { opacity: auraOpacity, transform: [{ scale: auraScale }] }]} />
            <Animated.View style={{ alignItems: 'center', opacity: content, transform: [{ translateY: logoY }, { scale: logoScale }] }}>
              <View style={styles.logoBox}>
                <Image source={logo} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>
              <Text style={styles.title}>EQOSY</Text>
              <View style={styles.tagline}>
                <View style={styles.dot} />
                <Text style={styles.tagText}>SUPER APP • FOOD • TAXI • DELIVERY</Text>
              </View>
            </Animated.View>
          </View>

          <View style={styles.bottom}>
            <View style={styles.track}>
              <Animated.View style={[styles.fill, { transform: [{ translateX: barX }] }]} />
            </View>
            <Text style={styles.starting}>STARTING EQOSY...</Text>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 99999, overflow: 'hidden', backgroundColor: 'transparent' },
  door: {
    position: 'absolute', top: 0, bottom: 0, width: '50%', overflow: 'hidden',
    borderColor: 'rgba(245,158,11,0.2)', backgroundColor: '#0F172A',
  },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 24 },
  aura: {
    position: 'absolute', top: -32, bottom: -32, left: -32, right: -32, borderRadius: 999,
    backgroundColor: 'rgba(251,191,36,0.22)',
  },
  logoBox: {
    width: 96, height: 96, borderRadius: 24, padding: 12, marginBottom: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 25, shadowOffset: { width: 0, height: 20 }, elevation: 12,
  },
  title: { fontSize: 38, fontWeight: '800', color: '#FBBF24', letterSpacing: -0.5, lineHeight: 40 },
  tagline: {
    marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34D399' },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: '#FDE68A' },
  bottom: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', gap: 8 },
  track: { width: 144, height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.10)' },
  fill: { width: '100%', height: '100%', borderRadius: 2, backgroundColor: '#FBBF24' },
  starting: { fontSize: 9, fontWeight: '700', letterSpacing: 1.8, color: '#94A3B8' },
});
