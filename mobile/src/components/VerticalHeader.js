import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackActions, useNavigation } from '@react-navigation/native';
import { Bell, ChevronDown, MapPin, ShoppingBag } from 'lucide-react-native';
import { Text } from './Text';
import VerticalSwitcher from './VerticalSwitcher';
import { getVerticalTheme } from '../theme';
import { useVertical } from '../store/vertical';
import { useLocationStore } from '../store/location';
import { useCart } from '../store/cart';

// Root stack route that hosts each vertical's tabs.
export const VERTICAL_ROUTE = { food: 'FoodTabs', taxi: 'TaxiTabs', grocery: 'GroceryTabs' };

// Web HomeHeader "Container 1": location + wallet (+ bell and cart outside Taxi), then the vertical tabs.
export default function VerticalHeader({ children }) {
  const navigation = useNavigation();
  const active = useVertical((s) => s.active);
  const theme = getVerticalTheme(active);
  const isTaxi = active === 'taxi';
  const { title, subtitle, loading, refresh, load } = useLocationStore();
  const cartCount = useCart((c) => c.items.reduce((n, l) => n + l.quantity, 0));

  useEffect(() => {
    load().then(refresh);
  }, [load, refresh]);

  const onChange = (id) => navigation.dispatch(StackActions.replace(VERTICAL_ROUTE[id]));
  const round = {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  };

  return (
    <View style={{ backgroundColor: theme.theme }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.theme }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Pressable onPress={refresh} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MapPin size={20} strokeWidth={1.5} color={theme.accent} fill={theme.accent} />
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: '#fff', flexShrink: 1 }}>
                  {title || 'Set your location'}
                </Text>
                <ChevronDown size={14} color="#fff" style={{ opacity: 0.9 }} />
              </View>
              {subtitle ? (
                <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '500', color: '#fff', opacity: 0.8, maxWidth: 210 }}>{subtitle}</Text>
              ) : null}
            </View>
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable onPress={() => navigation.navigate(isTaxi ? 'Wallet' : 'FoodWallet')} accessibilityLabel="Wallet" style={round}>
              <View style={{ width: 20, height: 20, borderWidth: 2, borderColor: '#1F2937', borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#1F2937', lineHeight: 12 }}>₹</Text>
              </View>
            </Pressable>
            {!isTaxi ? (
              <>
                <Pressable accessibilityLabel="Notifications" style={round}><Bell size={20} color="#1F2937" /></Pressable>
                <Pressable accessibilityLabel="Cart" onPress={() => navigation.navigate('FoodCart')} style={round}>
                  <ShoppingBag size={20} color="#1F2937" />
                  {cartCount > 0 ? (
                    <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff', lineHeight: 11 }}>{cartCount > 9 ? '9+' : cartCount}</Text>
                    </View>
                  ) : null}
                </Pressable>
              </>
            ) : null}
          </View>
        </View>

        {children}
        <VerticalSwitcher onChange={onChange} />
      </SafeAreaView>
    </View>
  );
}
