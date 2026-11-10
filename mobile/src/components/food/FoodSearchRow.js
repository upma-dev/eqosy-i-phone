import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { Mic, Search } from 'lucide-react-native';
import { Text } from '../Text';
import { getVerticalTheme } from '../../theme';

// Web HomeHeader "Container 2": search pill with rotating placeholder + Veg Mode toggle.
export const PLACEHOLDERS = [
  'Search "burger"', 'Search "biryani"', 'Search "pizza"', 'Search "desserts"',
  'Search "chinese"', 'Search "thali"', 'Search "momos"', 'Search "dosa"',
];

export default function FoodSearchRow({ vertical = 'food', onSearch, vegMode, onVegChange, showVeg = true }) {
  const theme = getVerticalTheme(vertical);
  const [index, setIndex] = useState(0);
  const anim = useRef(new Animated.Value(1)).current;
  const knob = useRef(new Animated.Value(vegMode ? 1 : 0)).current;

  useEffect(() => {
    const t = setInterval(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setIndex((i) => (i + 1) % PLACEHOLDERS.length);
        anim.setValue(0);
        Animated.timing(anim, { toValue: 1, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
      });
    }, 3000);
    return () => clearInterval(t);
  }, [anim]);

  useEffect(() => {
    Animated.timing(knob, { toValue: vegMode ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [vegMode, knob]);

  return (
    <View style={{ backgroundColor: theme.theme, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable
          onPress={onSearch}
          style={{
            flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8,
            backgroundColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
          }}
        >
          <Search size={18} strokeWidth={2.5} color={theme.accent} style={{ marginRight: 8 }} />
          <View style={{ flex: 1, height: 20, justifyContent: 'center' }}>
            <Animated.Text
              numberOfLines={1}
              style={{
                fontSize: 14, fontWeight: '500', color: '#9CA3AF', fontFamily: 'Poppins_500Medium', opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              }}
            >
              {PLACEHOLDERS[index]}
            </Animated.Text>
          </View>
          <View style={{ width: 1, height: 20, backgroundColor: '#E5E7EB', marginHorizontal: 10 }} />
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={18} strokeWidth={2.5} color={theme.accent} />
          </View>
        </Pressable>

        {showVeg ? (
          <Pressable onPress={() => onVegChange?.(!vegMode)} style={{ width: 52, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.4, lineHeight: 11 }}>VEG</Text>
            <Text style={{ fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.4, lineHeight: 11, marginBottom: 4 }}>MODE</Text>
            <View style={{ width: 36, height: 18, borderRadius: 9, backgroundColor: vegMode ? '#065f46' : 'rgba(255,255,255,0.4)' }}>
              <Animated.View
                style={{
                  position: 'absolute', top: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff',
                  transform: [{ translateX: knob.interpolate({ inputRange: [0, 1], outputRange: [2, 18] }) }],
                }}
              />
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
