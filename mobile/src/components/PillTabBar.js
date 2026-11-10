import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';

// Web bottom navigation: white bar, pill-shaped active item tinted with the vertical's colour.
// Use as <Tab.Navigator tabBar={(p) => <PillTabBar {...p} color="#2563EB" />}>.
// Each screen sets options.tabBarIcon = ({ color, focused }) => <Icon .../> and options.title.
export default function PillTabBar({ state, descriptors, navigation, color }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(6, insets.bottom) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const tint = focused ? color : '#6B7280';
        const label = options.title ?? route.name;

        const onPress = () => {
          const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            style={[styles.item, focused && { backgroundColor: `${color}1A` }]}
          >
            <View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
              {options.tabBarIcon?.({ color: tint, focused, size: 20 })}
            </View>
            <Text style={[styles.label, { color: tint, opacity: focused ? 1 : 0.8 }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB',
    paddingTop: 6, paddingHorizontal: 8,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 8,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4, paddingVertical: 6, borderRadius: 999 },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
});
