import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, IndianRupee, Plus, RotateCcw } from 'lucide-react-native';
import { Text } from '../../components/Text';
import foodApi from '../../api/foodClient';
import { dataOf } from '../../api/foodServices';

// Port of web Food/pages/user/Wallet.jsx (balance, referral earnings, Add money, filtered transaction history).
const FILTERS = [{ id: 'all', label: 'All Transactions' }, { id: 'addition', label: 'Additions' }, { id: 'deduction', label: 'Deductions' }, { id: 'refund', label: 'Refunds' }];
const amt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (v) => { try { return new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch { return ''; } };
const kind = (t) => { const x = String(t?.type || '').toLowerCase(); return x === 'refund' ? 'refund' : x === 'deduction' || x === 'debit' ? 'deduction' : 'addition'; };
const color = (k) => (k === 'deduction' ? '#DC2626' : k === 'refund' ? '#2563EB' : '#16A34A');

export default function FoodWalletScreen() {
  const navigation = useNavigation();
  const [wallet, setWallet] = useState(null);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      setError('');
      const w = dataOf(await foodApi.get('/food/user/wallet'));
      const data = w?.data?.wallet || w?.wallet;
      if (data) { setWallet(data); setTxs(data.transactions || []); }
    } catch (e) {
      setError(e?.message || 'Failed to load wallet');
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const list = useMemo(() => (filter === 'all' ? txs : txs.filter((t) => kind(t) === filter)), [txs, filter]);
  const Icon = (k) => (k === 'deduction' ? <ArrowUpRight size={22} color="#DC2626" /> : k === 'refund' ? <RotateCcw size={20} color="#2563EB" /> : <ArrowDownLeft size={22} color="#16A34A" />);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 }}>
          <Pressable onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} color="#374151" /></Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Wallet</Text>
        </View>
      </SafeAreaView>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />} contentContainerStyle={{ padding: 16, paddingTop: 24, paddingBottom: 64, gap: 24 }}>
        {loading ? <View style={{ alignItems: 'center', paddingVertical: 48 }}><ActivityIndicator color="#4B5563" size="large" /></View> : null}
        {error && !loading ? <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 8, padding: 16 }}><Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text></View> : null}

        {!loading && !error ? (
          <>
            <View style={{ alignItems: 'center', gap: 16 }}>
              <View>
                <LinearGradient colors={['#EF4444', '#DC2626', '#B91C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 80, height: 80, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                    <IndianRupee size={40} color="#fff" strokeWidth={2.5} />
                  </View>
                </LinearGradient>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Eqosy Money</Text>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Current Balance</Text>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#111827' }}>{amt(wallet?.balance)}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Referral Earnings</Text>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#16A34A' }}>{amt(wallet?.referralEarnings)}</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', maxWidth: 280 }}>Add money to enjoy one-tap, seamless payments</Text>
              <Pressable onPress={() => Alert.alert('Add money', 'Online top-up needs the payment build (Razorpay).')} style={{ width: '100%', height: 48, borderRadius: 12, backgroundColor: '#16A34A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Plus size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Add money</Text>
              </Pressable>
            </View>

            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', letterSpacing: 2, color: '#9CA3AF' }}>TRANSACTION HISTORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {FILTERS.map((f) => {
                  const on = filter === f.id;
                  return (
                    <Pressable key={f.id} onPress={() => setFilter(f.id)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fff', borderWidth: on ? 2 : 1, borderColor: on ? '#16A34A' : '#E5E7EB' }}>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: on ? '#16A34A' : '#4B5563' }}>{f.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {list.length ? (
                <View style={{ gap: 12 }}>
                  {list.map((t, i) => {
                    const k = kind(t);
                    const referral = t?.metadata?.source === 'referral_signup' || String(t.description || '').toLowerCase().startsWith('referral reward');
                    return (
                      <View key={String(t.id || t._id || i)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>{Icon(k)}</View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 }}>{t.description}</Text>
                            {referral ? <Text style={{ fontSize: 11, fontWeight: '500', color: '#16A34A', marginBottom: 4 }}>Referral reward</Text> : null}
                            <Text style={{ fontSize: 12, color: '#6B7280' }}>{fmtDate(t.date || t.createdAt)}</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: color(k) }}>{k === 'deduction' ? '-' : '+'}{amt(t.amount)}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={{ paddingVertical: 48 }}>
                  <View style={{ gap: 12, marginBottom: 24 }}>
                    {[1, 2, 3].map((i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, opacity: 0.3 + i * 0.15 }}>
                        <View style={{ width: 40, height: 40, backgroundColor: '#E5E7EB', borderRadius: 8 }} />
                        <View style={{ flex: 1, gap: 8 }}><View style={{ height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, width: '75%' }} /><View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, width: '50%' }} /></View>
                      </View>
                    ))}
                  </View>
                  <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: '500', color: '#4B5563' }}>Your transactions will appear here</Text>
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
