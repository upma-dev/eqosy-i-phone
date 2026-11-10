import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AlertCircle, ArrowLeft, Calendar, ChevronRight, Clock, Headset } from 'lucide-react-native';
import { Text } from '../components/Text';
import api from '../api/client';
import {
  buildAvatarFallback, getHelperText, normalizeBusBooking, normalizePoolingBooking, normalizeRide, PAGE_SIZE, TABS,
} from '../lib/activity';

// 1:1 port of web Taxi user Activity page (header, pill tabs, activity cards, pager, states).
const payload = (r) => r?.data || r || {};
const CATEGORY = { Rides: 'rides', Parcels: 'parcels', Outstation: 'outstation', Scheduled: 'scheduled' };
const TONE = {
  success: { bg: '#ECFDF5', fg: '#047857', border: '#D1FAE5' },
  danger: { bg: '#FFF1F2', fg: '#BE123C', border: '#FFE4E6' },
  warning: { bg: '#FFFBEB', fg: '#B45309', border: '#FEF3C7' },
};

function Card({ a, onPress }) {
  const [broken, setBroken] = useState(false);
  const tone = TONE[a.statusTone] || TONE.warning;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ width: 64, height: 64, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', overflow: 'hidden' }}>
          <Image source={a.vehicleImage} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <View style={{ position: 'absolute', bottom: 6, right: 6, width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#fff', backgroundColor: '#fff', overflow: 'hidden' }}>
            <Image source={{ uri: broken ? buildAvatarFallback(a.driverName) : a.driverImage }} onError={() => setBroken(true)} style={{ width: '100%', height: '100%' }} />
          </View>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: '600', color: '#0F172A', lineHeight: 18 }}>{a.title}</Text>
              <Text numberOfLines={2} style={{ marginTop: 4, fontSize: 10, fontWeight: '600', letterSpacing: 1.2, color: '#94A3B8' }}>{String(a.eyebrow || a.driverName).toUpperCase()}</Text>
              <Text numberOfLines={2} style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>{a.address}</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A', paddingLeft: 4 }}>Rs {a.price}</Text>
          </View>
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Calendar size={11} color="#94A3B8" strokeWidth={2.4} /><Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1.2, color: '#94A3B8' }}>{a.date.toUpperCase()}</Text></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Clock size={11} color="#94A3B8" strokeWidth={2.4} /><Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1.2, color: '#94A3B8' }}>{a.time.toUpperCase()}</Text></View>
            <View style={{ marginLeft: 'auto', borderRadius: 99, borderWidth: 1, borderColor: tone.border, backgroundColor: tone.bg, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 9, fontWeight: '600', color: tone.fg }}>{a.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <View style={{ marginTop: 4, width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={16} color="#CBD5E1" strokeWidth={2.4} />
        </View>
      </View>
    </Pressable>
  );
}

const Center = ({ children }) => <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 }}>{children}</View>;
const Box = ({ children }) => <View style={{ width: 56, height: 56, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}>{children}</View>;
const Dark = ({ label, onPress }) => <Pressable onPress={onPress} style={{ marginTop: 8, backgroundColor: '#0F172A', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 99 }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2 }}>{label.toUpperCase()}</Text></Pressable>;

export default function ActivityScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState('All');
  const [all, setAll] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    if (tab === 'Support') { setLoading(false); setAll([]); return; }
    setLoading(true); setError('');
    try {
      const safe = (p) => p.catch(() => ({}));
      let items = [];
      if (tab === 'Bus') {
        const r = payload(await api.get('/users/bus-bookings', { params: { page: 1, limit: 60 } }));
        items = (r?.data?.results || r?.results || []).map(normalizeBusBooking);
      } else if (tab === 'Pooling') {
        const r = payload(await api.get('/users/pooling/bookings'));
        const list = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : r?.data?.results || r?.results || [];
        items = list.map(normalizePoolingBooking);
      } else if (tab === 'All') {
        const [rides, bus, pool] = await Promise.all([
          safe(api.get('/rides', { params: { limit: 60, page: 1 } })),
          safe(api.get('/users/bus-bookings', { params: { page: 1, limit: 60 } })),
          safe(api.get('/users/pooling/bookings')),
        ]);
        const rp = payload(rides); const bp = payload(bus); const pp = payload(pool);
        items = [
          ...(rp?.data?.results || rp?.results || []).map(normalizeRide),
          ...(bp?.data?.results || bp?.results || []).map(normalizeBusBooking),
          ...(Array.isArray(pp?.data) ? pp.data : Array.isArray(pp) ? pp : pp?.data?.results || pp?.results || []).map(normalizePoolingBooking),
        ];
      } else {
        const r = payload(await api.get('/rides', { params: { limit: 60, page: 1, category: CATEGORY[tab] || '' } }));
        items = (r?.data?.results || r?.results || []).map(normalizeRide);
      }
      setAll(items.filter((i) => i.id).sort((a, b) => b.sortTimestamp - a.sortTimestamp));
    } catch (e) {
      setError(e?.error || e?.message || 'Could not load your ride history.');
      setAll([]);
    } finally { setLoading(false); }
  }, [tab]);

  useFocusEffect(useCallback(() => { load(); }, [load, reload]));
  useEffect(() => { setPage(1); }, [tab]);

  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = useMemo(() => all.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [all, safePage]);

  const open = (a) => {
    if (a.type === 'ride' || a.type === 'parcel') navigation.navigate('RideTracking', { rideId: String(a.id), snapshot: a.ride });
    else Alert.alert(a.title, 'Booking details are coming soon in the app.');
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
          <Pressable onPress={() => navigation.navigate('HomeTab')} style={{ padding: 8, marginLeft: -8 }}><ArrowLeft size={22} color="#0F172A" strokeWidth={2.6} /></Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 2, color: '#94A3B8' }}>MY BOOKINGS</Text>
            <Text numberOfLines={1} style={{ marginTop: 4, fontSize: 20, fontWeight: '600', color: '#0F172A', lineHeight: 22, letterSpacing: -0.3 }}>Recent activity</Text>
            <Text style={{ marginTop: 4, fontSize: 12, color: '#64748B' }}>{getHelperText(tab)}</Text>
          </View>
        </View>
        <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingHorizontal: 20, paddingVertical: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8, borderRadius: 99, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', padding: 4 }}>
              {TABS.map((t) => (
                <Pressable key={t} onPress={() => setTab(t)} style={{ borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: tab === t ? '#fff' : 'transparent', shadowColor: '#000', shadowOpacity: tab === t ? 0.08 : 0, shadowRadius: 2, elevation: tab === t ? 1 : 0 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.3, color: tab === t ? '#0F172A' : '#64748B' }}>{t.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 112 }}>
        {tab === 'Support' ? (
          <Center>
            <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' }}><Headset size={36} color="#F97316" /></View>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }}>No support tickets</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B' }}>You haven't raised any support tickets yet.</Text>
            <Dark label="Contact Us" onPress={() => navigation.navigate('SupportTab')} />
          </Center>
        ) : loading ? (
          <Center><Box><ActivityIndicator color="#F97316" /></Box><Text style={{ fontSize: 15, fontWeight: '900', color: '#64748B' }}>Loading your trips</Text></Center>
        ) : error ? (
          <Center><Box><AlertCircle size={24} color="#F43F5E" strokeWidth={3} /></Box><Text style={{ fontSize: 15, fontWeight: '900', color: '#334155', textAlign: 'center' }}>{error}</Text><Dark label="Retry" onPress={() => setReload((x) => x + 1)} /></Center>
        ) : rows.length === 0 ? (
          <Center><Box><Text style={{ fontSize: 22, fontWeight: '900', color: '#94A3B8' }}>-</Text></Box><Text style={{ fontSize: 15, fontWeight: '900', color: '#64748B' }}>No {tab.toLowerCase()} found</Text></Center>
        ) : (
          <View style={{ gap: 12 }}>
            {rows.map((a) => <Card key={`${a.type}-${a.id}`} a={a} onPress={() => open(a)} />)}
            {totalPages > 1 ? (
              <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', padding: 12 }}>
                  <Pressable disabled={safePage <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))} style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', paddingVertical: 12, alignItems: 'center', opacity: safePage <= 1 ? 0.45 : 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.3, color: '#334155' }}>PREVIOUS</Text>
                  </Pressable>
                  <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 12 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.3, color: '#64748B' }}>PAGE {safePage} / {totalPages}</Text>
                  </View>
                  <Pressable disabled={safePage >= totalPages} onPress={() => setPage((p) => Math.min(totalPages, p + 1))} style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#0F172A', backgroundColor: '#0F172A', paddingVertical: 12, alignItems: 'center', opacity: safePage >= totalPages ? 0.45 : 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.3, color: '#fff' }}>NEXT</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
