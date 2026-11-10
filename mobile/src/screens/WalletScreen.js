import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Gift, History, Plus } from 'lucide-react-native';
import { Text } from '../components/Text';
import { authService, unwrap } from '../api/services';

// 1:1 port of web Taxi/modules/user/pages/Wallet.jsx (balance card, refer card, transaction history, add-money sheet).
const inr = (v) => (Math.round(Number(v || 0) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const split = (f) => { const [whole, d = '00'] = String(f).split('.'); return { whole, decimals: (d || '00').padEnd(2, '0').slice(0, 2) }; };

export default function WalletScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [wallet, setWallet] = useState({ balance: 0, currency: 'INR', recentTransactions: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = unwrap(await authService.getWallet()) || {};
      setWallet({ balance: Number(data.balance || 0), currency: data.currency || 'INR', recentTransactions: Array.isArray(data.recentTransactions) ? data.recentTransactions : [] });
    } catch (e) {
      setError(e?.message || 'Failed to load wallet');
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const bal = useMemo(() => split(inr(wallet.balance)), [wallet.balance]);

  const refill = () => {
    const v = Number(amount);
    if (!Number.isFinite(v) || v <= 0) return setError('Enter a valid amount.');
    // Online top-up uses Razorpay / PhonePe, which needs the native development build.
    Alert.alert('Add money', 'Online top-up needs the payment build. It will be enabled with the Razorpay setup.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 }}>
          <Pressable onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={18} color="#0F172A" /></Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>My Wallet</Text>
        </View>
      </SafeAreaView>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />} contentContainerStyle={{ paddingBottom: 96 }}>
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View style={{ backgroundColor: '#0F172A', borderRadius: 24, padding: 32, shadowColor: '#E2E8F0', shadowOpacity: 0.5, shadowRadius: 20, elevation: 6, gap: 32 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8' }}>AVAILABLE BALANCE</Text>
              <Text style={{ fontSize: 36, fontWeight: '700', color: '#fff', letterSpacing: -0.5 }}>
                ₹ {loading ? '0' : bal.whole}<Text style={{ fontSize: 24, color: '#475569' }}>.{loading ? '00' : bal.decimals}</Text>
              </Text>
              {error ? <Text style={{ fontSize: 12, fontWeight: '700', color: '#FB7185', marginTop: 8 }}>{error}</Text> : null}
            </View>
            <Pressable onPress={() => { setError(''); setShowAdd(true); }} style={{ height: 48, borderRadius: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
              <Plus size={16} color="#0F172A" strokeWidth={2.5} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>Add Money</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Pressable onPress={() => Alert.alert('Refer & Earn', 'Coming soon in the app.')} style={({ pressed }) => ({ backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}><Gift size={20} color="#0F172A" /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>Refer & Earn ₹50</Text>
              <Text style={{ marginTop: 2, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8' }}>INVITE FRIENDS TO EQOSY</Text>
            </View>
            <ArrowLeft size={18} color="#CBD5E1" style={{ transform: [{ rotate: '180deg' }] }} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8' }}>TRANSACTION HISTORY</Text>
            <Pressable onPress={() => navigation.navigate('ActivityTab')}><Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#0F172A' }}>VIEW ALL</Text></Pressable>
          </View>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' }}>
            {loading ? (
              <Text style={{ padding: 32, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#94A3B8' }}>Loading transactions...</Text>
            ) : wallet.recentTransactions.length ? wallet.recentTransactions.map((tx, i) => {
              const debit = tx.kind === 'debit';
              const when = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
              return (
                <View key={String(tx.id || i)} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderTopWidth: i ? 1 : 0, borderTopColor: '#F8FAFC' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: debit ? '#F8FAFC' : '#ECFDF5', alignItems: 'center', justifyContent: 'center' }}>
                    {debit ? <ArrowLeft size={16} color="#475569" style={{ transform: [{ rotate: '45deg' }] }} /> : <Plus size={16} color="#059669" />}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{tx.title || (debit ? 'Debit' : 'Credit')}</Text>
                    <Text style={{ marginTop: 2, fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>{when.toUpperCase()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: debit ? '#0F172A' : '#059669' }}>{debit ? '-' : '+'}₹{inr(tx.amount)}</Text>
                    <Text style={{ fontSize: 8, fontWeight: '700', letterSpacing: 0.8, color: debit ? '#94A3B8' : '#34D399' }}>{debit ? 'DEBIT' : 'CREDIT'}</Text>
                  </View>
                </View>
              );
            }) : <Text style={{ padding: 32, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#94A3B8' }}>No transactions yet</Text>}
          </View>
        </View>
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.4)', justifyContent: 'flex-end', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 32, paddingBottom: Math.max(40, insets.bottom + 16), gap: 32 }}>
            <Pressable onPress={() => setShowAdd(false)} style={{ position: 'absolute', top: 24, right: 24, width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <Plus size={20} color="#94A3B8" style={{ transform: [{ rotate: '45deg' }] }} />
            </Pressable>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>Add Money</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8' }}>SELECT AMOUNT TO TOP-UP</Text>
            </View>
            <View style={{ gap: 32 }}>
              <View style={{ justifyContent: 'center' }}>
                <Text style={{ position: 'absolute', left: 24, zIndex: 1, fontSize: 20, fontWeight: '700', color: '#94A3B8' }}>₹</Text>
                <TextInput value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#CBD5E1" style={{ height: 64, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 16, paddingLeft: 48, paddingRight: 24, fontSize: 24, fontWeight: '700', color: '#0F172A' }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {['100', '500', '1000'].map((v) => (
                  <Pressable key={v} onPress={() => setAmount(v)} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: amount === v ? '#0F172A' : '#F8FAFC', borderWidth: amount === v ? 0 : 1, borderColor: '#F1F5F9' }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: amount === v ? '#fff' : '#475569' }}>+₹{v}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={refill} disabled={!amount} style={{ height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: amount ? '#0F172A' : '#F1F5F9' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: amount ? '#fff' : '#94A3B8' }}>Refill Wallet</Text>
                <Plus size={18} color={amount ? '#fff' : '#94A3B8'} />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
