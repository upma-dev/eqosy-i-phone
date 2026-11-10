import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LogOut } from 'lucide-react-native';
import { Text } from '../../components/Text';
import { restaurantApi, body } from './api';
import { useAuth } from '../../store/auth';
import { useRestaurant } from './store';
import { disconnectSocket } from '../../lib/socket';

// Port of web Food/pages/restaurant HubMenu / HubFinance (summary only) + logout.
// Menu editing, outlet timings, coupons, ratings, payouts and support come later.
const Row = ({ label, value }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
    <Text style={{ color: '#64748B' }}>{label}</Text>
    <Text style={{ fontWeight: '700', color: '#0F172A', maxWidth: '60%', textAlign: 'right' }}>{value || '-'}</Text>
  </View>
);
const money = (v) => (v == null ? '' : `Rs ${Number(v).toFixed(2)}`);

export default function RestaurantProfileScreen() {
  const restaurant = useRestaurant((s) => s.restaurant) || {};
  const signOut = useAuth((s) => s.signOut);
  const [finance, setFinance] = useState({});

  useFocusEffect(useCallback(() => {
    restaurantApi.finance().then((r) => { const d = body(r); setFinance(d.finance || d); }).catch(() => {});
  }, []));

  const name = restaurant.restaurantName || restaurant.name || 'Restaurant';

  const logout = () =>
    Alert.alert('Log out', 'Do you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          disconnectSocket();
          useRestaurant.getState().setRestaurant(null);
          signOut();
        },
      },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#EC4899', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800' }}>{String(name).charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>{name}</Text>
          <Text style={{ color: '#64748B' }}>{restaurant.phone || restaurant.ownerPhone || ''}</Text>
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16 }}>
          <Row label="Status" value={restaurant.status} />
          <Row label="City" value={restaurant.city} />
          <Row label="Cuisines" value={Array.isArray(restaurant.cuisines) ? restaurant.cuisines.join(', ') : ''} />
          <Row label="Rating" value={restaurant.rating ? String(restaurant.rating) : ''} />
        </View>

        {Object.keys(finance).length ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16 }}>
            <Row label="Wallet balance" value={money(finance.balance ?? finance.walletBalance ?? finance.currentBalance)} />
            <Row label="Total earnings" value={money(finance.totalEarnings ?? finance.totalEarned)} />
          </View>
        ) : null}

        <Pressable onPress={logout} style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 16, paddingVertical: 14 }}>
          <LogOut size={18} color="#DC2626" />
          <Text style={{ color: '#DC2626', fontWeight: '800' }}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
