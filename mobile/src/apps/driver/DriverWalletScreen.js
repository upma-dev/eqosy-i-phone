import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Text } from '../../components/Text';
import { driverApi, pick } from './api';

// Port of web Taxi/modules/driver/pages/DriverWallet.jsx: balance + transaction list.
// Top-up (Razorpay / PhonePe), withdrawals and filters come with the payments phase.
const BLUE = '#3B6BF0';
const money = (v) => {
  const n = Number(v || 0);
  return `${n < 0 ? '-' : ''}Rs ${Math.abs(n).toFixed(2)}`;
};
const labelOf = (t) => String(t.title || t.description || t.type || 'Transaction').replace(/_/g, ' ');

export default function DriverWalletScreen() {
  const [wallet, setWallet] = useState({});
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const d = pick(await driverApi.wallet());
      setWallet(d?.wallet || {});
      setTxns(Array.isArray(d?.transactions) ? d.transactions : []);
      setError('');
    } catch (e) {
      setError(e?.message || 'Could not load wallet.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={BLUE} /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={BLUE} />}
      >
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A' }}>My Wallet</Text>

        <View style={{ backgroundColor: '#1E3A8A', borderRadius: 24, padding: 22 }}>
          <Text style={{ color: '#BFDBFE', fontSize: 12, fontWeight: '700' }}>AVAILABLE BALANCE</Text>
          <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900', marginTop: 4 }}>{money(wallet.balance)}</Text>
          {wallet.isBlocked ? <Text style={{ color: '#FCA5A5', marginTop: 8, fontWeight: '700' }}>Wallet blocked. Please top up to receive rides.</Text> : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B' }}>CASH LIMIT</Text>
            <Text style={{ fontWeight: '800', fontSize: 16, marginTop: 4, color: '#0F172A' }}>{money(wallet.cashLimit)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B' }}>FOR ORDERS</Text>
            <Text style={{ fontWeight: '800', fontSize: 16, marginTop: 4, color: '#0F172A' }}>{money(wallet.availableForOrders)}</Text>
          </View>
        </View>

        {error ? <Text style={{ color: '#DC2626' }}>{error}</Text> : null}

        <Text style={{ fontWeight: '800', color: '#0F172A' }}>Transactions</Text>
        {txns.length === 0 ? <Text style={{ color: '#94A3B8' }}>No transactions yet.</Text> : null}
        {txns.map((t, i) => {
          const amt = Number(t.amount || 0);
          const debit = amt < 0 || /deduction|withdraw|debit/i.test(String(t.type));
          return (
            <View key={String(t._id || i)} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontWeight: '700', color: '#0F172A', textTransform: 'capitalize' }}>{labelOf(t)}</Text>
                {t.createdAt ? <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>{new Date(t.createdAt).toLocaleString()}</Text> : null}
              </View>
              <Text style={{ fontWeight: '800', color: debit ? '#DC2626' : '#059669' }}>{debit ? '-' : '+'}{money(Math.abs(amt)).replace('-', '')}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
