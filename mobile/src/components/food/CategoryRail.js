import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, Pressable, ScrollView, View } from 'react-native';
import { ArrowRightLeft, Plus } from 'lucide-react-native';
import { Text } from '../Text';

const PRIMARY = '#EB590E'; // --app-primary for the Food user app

// "What's on your mind today?" header + horizontally scrolling round category chips (web CategoryRail*).
export function CategoryRailHeader({ onViewAll }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', letterSpacing: -0.3 }}>What's on your mind today?</Text>
      <Pressable onPress={onViewAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF' }}>View All</Text>
        <ArrowRightLeft size={12} color="#9CA3AF" />
      </Pressable>
    </View>
  );
}

function Chip({ category, index, onPress }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 500, delay: index * 50, useNativeDriver: true }).start();
  }, [v, index]);
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
      <Pressable onPress={onPress} style={{ alignItems: 'center', gap: 8 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FFF7ED' }}>
          {category.image ? <Image source={{ uri: category.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : null}
        </View>
        <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '500', color: '#374151', textAlign: 'center', maxWidth: 72 }}>{category.name}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function CategoryRail({ categories = [], loading, onPress, onSeeAll }) {
  const ref = useRef(null);
  const pos = useRef(0);
  const dir = useRef(1);
  const maxX = useRef(0);
  const paused = useRef(false);
  const resume = useRef(null);

  // Slow auto-scroll that bounces between both ends; pauses while the user drags.
  useEffect(() => {
    const t = setInterval(() => {
      if (paused.current || maxX.current <= 0) return;
      pos.current += dir.current * 0.8;
      if (pos.current >= maxX.current) { pos.current = maxX.current; dir.current = -1; }
      if (pos.current <= 0) { pos.current = 0; dir.current = 1; }
      ref.current?.scrollTo({ x: pos.current, animated: false });
    }, 30);
    return () => clearInterval(t);
  }, []);

  const pause = () => { paused.current = true; clearTimeout(resume.current); };
  const later = () => { clearTimeout(resume.current); resume.current = setTimeout(() => { paused.current = false; }, 2500); };

  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      onContentSizeChange={(w) => { maxX.current = Math.max(0, w - Dimensions.get('window').width + 32); }}
      onScroll={(e) => { if (paused.current) pos.current = e.nativeEvent.contentOffset.x; }}
      onScrollBeginDrag={pause}
      onScrollEndDrag={later}
      onMomentumScrollEnd={later}
      contentContainerStyle={{ gap: 12, paddingHorizontal: 8, paddingVertical: 8 }}
    >
      {loading
        ? [0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={{ alignItems: 'center', gap: 8 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6' }} />
              <View style={{ width: 48, height: 10, borderRadius: 5, backgroundColor: '#F3F4F6' }} />
            </View>
          ))
        : categories.slice(0, 12).map((c, i) => (
            <Chip key={c.id || i} category={c} index={i} onPress={() => onPress?.(c)} />
          ))}
      {!loading && categories.length > 12 ? (
        <Pressable onPress={onSeeAll} style={{ alignItems: 'center', gap: 8 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FFEDD5', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={24} color={PRIMARY} />
          </View>
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>See All</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
