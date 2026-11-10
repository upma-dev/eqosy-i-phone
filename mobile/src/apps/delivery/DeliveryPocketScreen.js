import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Text } from '../../components/Text';
import { deliveryApi, body } from './api';

// Port of web DeliveryV2/pages/PocketV2.jsx (read-only): wallet balances, cash limit and recent trips.
// Payout, deposit, statements and deduction details come later.
const GREEN = '#1F9D4B';
const money = (v) => `Rs ${Number(v || 0).toFixed(2)}`;

const Stat = ({ label, value }) => (
  <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14 }}>
    <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B' }}>{label}</Text>
    <Text style={{ fontWeight: '800', fontSize: 16, marginTop: 4, color: '#0F172A' }}>{value}</Text>
  </View>
);

export default function DeliveryPocketScreen() {
  const [wallet, setWallet] = useState({});
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [w, t] = await Promise.allSettled([deliveryApi.wallet(), deliveryApi.tripHistory({ limit: 20 })]);
    if (w.status === 'fulfilled') {
      const d = body(w.value);
      setWallet(d.wallet || d);
      setError('');
    } else setError(w.reason?.message || 'Could not load wallet.');
    if (t.status === 'fulfilled') {
      const d = body(t.value);
      setTrips(d.trips || d.orders || d.history || (Array.isArray(d) ? d : []));
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={GREEN} /></SafeAreaView>;

  const balance = wallet.pocketBalance ?? wallet.balance ?? wallet.availableBalance ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={GREEN} />}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A' }}>Pocket</Text>

        <View style={{ backgroundColor: '#157A38', borderRadius: 24, padding: 22 }}>
          <Text style={{ color: '#BBF7D0', fontSize: 12, fontWeight: '700' }}>POCKET BALANCE</Text>
          <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900', marginTop: 4 }}>{money(balance)}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Stat label="TOTAL EARNINGS" value={money(wallet.totalEarnings ?? wallet.totalEarned)} />
          <Stat label="CASH IN HAND" value={money(wallet.cashInHand ?? wallet.cashCollected)} />
        </View>

        {error ? <Text style={{ color: '#DC2626' }}>{error}</Text> : null}

        <Text style={{ fontWeight: '800', color: '#0F172A' }}>Recent deliveries</Text>
        {trips.length === 0 ? <Text style={{ color: '#94A3B8' }}>No deliveries yet.</Text> : null}
        {trips.map((t, i) => (
          <View key={String(t._id || t.orderId || i)} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>{t.restaurantName || t.restaurant?.name || `Order ${String(t.orderId || t._id || '').slice(-6)}`}</Text>
              {t.createdAt || t.deliveredAt ? <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>{new Date(t.deliveredAt || t.createdAt).toLocaleString()}</Text> : null}
            </View>
            <Text style={{ fontWeight: '800', color: '#059669' }}>+{money(t.riderEarning ?? t.earnings ?? t.amount)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
