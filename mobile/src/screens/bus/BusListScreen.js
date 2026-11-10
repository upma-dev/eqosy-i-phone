import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Check, ChevronRight, Clock3, SlidersHorizontal, Star } from 'lucide-react-native';
import { Text } from '../../components/Text';
import api from '../../api/client';

// 1:1 port of web Taxi/modules/user/pages/bus/BusList.jsx.
const SORT_OPTIONS = [
  { id: 'recommended', label: 'Filter & Sort' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'departure-asc', label: 'Early Departure' },
  { id: 'rating-desc', label: 'Top Rated' },
];

const fmtDate = (s) => { try { return new Date(s).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return s; } };
const brief = (v = '') => {
  const raw = String(v || '').trim();
  if (!raw) return 'Direct';
  return raw.replace(/days?/gi, 'd').replace(/hours?/gi, 'h').replace(/hrs?/gi, 'h').replace(/minutes?/gi, 'm').replace(/mins?/gi, 'm').replace(/\s+/g, ' ').trim();
};
const num = (v, f = 0) => { const n = Number(v); return Number.isFinite(n) ? n : f; };
const company = (b) => String(b?.operator || b?.busName || b?.travels || b?.company || '').trim();
const rating = (b) => num(b?.rating, 0);
const ratingCount = (b) => num(b?.ratingCount, 0);
const hasRating = (b) => ratingCount(b) > 0;
const highly = (b) => hasRating(b) && rating(b) >= 4.5;
const hasDeal = (b) => [b?.cancellationPolicy, b?.offerText, b?.badge, Array.isArray(b?.tags) ? b.tags.join(' ') : b?.tags].filter(Boolean).join(' ').toLowerCase().match(/free|deal|save/) !== null;
const depValue = (b) => { const m = String(b?.departure || '').match(/(\d{1,2}):(\d{2})/); return m ? Number(m[1]) * 60 + Number(m[2]) : Number.MAX_SAFE_INTEGER; };

const Pill = ({ label, on, tone = 'orange', onPress, icon }) => {
  const t = { orange: ['#FFEDD5', '#FFF7ED', '#C2410C'], amber: ['#FDE68A', '#FFFBEB', '#B45309'], slate: ['#CBD5E1', '#F8FAFC', '#0F172A'] }[tone];
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8, borderColor: on ? t[0] : '#E2E8F0', backgroundColor: on ? t[1] : '#fff', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 }}>
      {icon}
      <Text style={{ fontSize: 12, fontWeight: '700', color: on ? t[2] : '#334155' }}>{label}</Text>
    </Pressable>
  );
};

const Chip = ({ text, bg, fg, strong }) => <View style={{ borderRadius: 99, backgroundColor: bg, paddingHorizontal: 12, paddingVertical: 4 }}><Text style={{ fontSize: 10, fontWeight: strong ? '900' : '700', color: fg }}>{text}</Text></View>;

export default function BusListScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const { fromCity, toCity, date } = params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buses, setBuses] = useState([]);
  const [sortBy, setSortBy] = useState('recommended');
  const [deals, setDeals] = useState(false);
  const [rated, setRated] = useState(false);
  const [comp, setComp] = useState('all');
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!fromCity || !toCity || !date) { navigation.goBack(); return undefined; }
    let alive = true;
    setLoading(true); setError('');
    api.get('/users/buses/search', { params: { fromCity, toCity, date } })
      .then((res) => { if (alive) setBuses(Array.isArray(res?.data?.results) ? res.data.results : Array.isArray(res?.results) ? res.results : []); })
      .catch((e) => { if (alive) setError(e?.message || 'Failed to search buses'); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [fromCity, toCity, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const companies = useMemo(() => [...new Set(buses.map(company).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [buses]);
  const visible = useMemo(() => {
    const list = buses.filter((b) => (!deals || hasDeal(b)) && (!rated || highly(b)) && (comp === 'all' || company(b) === comp));
    if (sortBy === 'price-asc') list.sort((a, b) => num(a?.price, 9e15) - num(b?.price, 9e15));
    else if (sortBy === 'departure-asc') list.sort((a, b) => depValue(a) - depValue(b));
    else if (sortBy === 'rating-desc') list.sort((a, b) => rating(b) - rating(a) || ratingCount(b) - ratingCount(a));
    return list;
  }, [buses, deals, rated, comp, sortBy]);

  const sortOption = SORT_OPTIONS.find((o) => o.id === sortBy) || SORT_OPTIONS[0];
  const Row = ({ label, active, onPress }) => (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: active ? '#0F172A' : '#fff' }}>
      <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#334155', paddingRight: 12 }}>{label}</Text>
      {active ? <Check size={14} color="#fff" /> : null}
    </Pressable>
  );

  return (
    <LinearGradient colors={['#FFF7ED', '#FFFAF7', '#F8FAFC']} locations={[0, 0.16, 1]} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,237,213,0.7)', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={18} color="#0F172A" /></Pressable>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>{fromCity} <Text style={{ color: '#CBD5E1' }}>→</Text> {toCity}</Text>
              <Text style={{ marginTop: 2, fontSize: 12, fontWeight: '600', color: '#64748B' }}>{visible.length || 0} buses</Text>
            </View>
            <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#FFEDD5', backgroundColor: '#FFF7ED', paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.8, color: '#FB923C' }}>{fmtDate(date).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40, gap: 16 }}>
          {loading ? (
            <View style={{ borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#fff', padding: 48, alignItems: 'center' }}>
              <ActivityIndicator color="#94A3B8" size="large" />
              <Text style={{ marginTop: 16, fontSize: 14, fontWeight: '700', color: '#94A3B8' }}>Finding available buses...</Text>
            </View>
          ) : null}
          {!loading && error ? <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#FFE4E6', backgroundColor: '#FFF1F2', padding: 16 }}><Text style={{ fontSize: 14, fontWeight: '700', color: '#E11D48' }}>{error}</Text></View> : null}
          {!loading && !error && visible.length === 0 ? (
            <View style={{ borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#fff', padding: 48, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>No buses found</Text>
              <Text style={{ marginTop: 8, fontSize: 14, fontWeight: '500', color: '#64748B', textAlign: 'center' }}>{deals || rated || sortBy !== 'recommended' || comp !== 'all' ? 'Try changing your filters to see more buses.' : 'Try searching for a different date or route.'}</Text>
            </View>
          ) : null}

          {!loading && !error && buses.length > 0 ? (
            <View style={{ zIndex: 10 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                <Pill label={sortOption.label} on={menu} tone="slate" onPress={() => setMenu(!menu)} icon={<SlidersHorizontal size={14} color="#334155" />} />
                <Pill label="Deals" on={deals} tone="orange" onPress={() => setDeals(!deals)} />
                <Pill label="Highly Rated" on={rated} tone="amber" onPress={() => setRated(!rated)} />
              </ScrollView>
              {menu ? (
                <View style={{ marginTop: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', padding: 8, shadowColor: '#0F172A', shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 18 }, elevation: 10 }}>
                  <Text style={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8, fontSize: 10, fontWeight: '900', letterSpacing: 1.8, color: '#94A3B8' }}>SORT BUSES BY</Text>
                  <View style={{ gap: 4 }}>{SORT_OPTIONS.map((o) => <Row key={o.id} label={o.label} active={sortBy === o.id} onPress={() => { setSortBy(o.id); setMenu(false); }} />)}</View>
                  {companies.length ? (
                    <>
                      <View style={{ height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 4, marginVertical: 8 }} />
                      <Text style={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8, fontSize: 10, fontWeight: '900', letterSpacing: 1.8, color: '#94A3B8' }}>BUS COMPANY</Text>
                      <ScrollView style={{ maxHeight: 224 }} nestedScrollEnabled>
                        <View style={{ gap: 4 }}>
                          <Row label="All companies" active={comp === 'all'} onPress={() => setComp('all')} />
                          {companies.map((c) => <Row key={c} label={c} active={comp === c} onPress={() => setComp(c)} />)}
                        </View>
                      </ScrollView>
                    </>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}

          {!loading && !error ? visible.map((bus, i) => {
            const has = hasRating(bus);
            const amen = Array.isArray(bus.amenities) ? bus.amenities.slice(0, 2) : [];
            const freeCancel = String(bus.cancellationPolicy || '').toLowerCase().includes('free');
            return (
              <Pressable key={String(bus.id ?? i)} onPress={() => navigation.navigate('BusDetails', { ...params, bus })} style={({ pressed }) => ({ borderRadius: 24, borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)', backgroundColor: '#fff', padding: 16, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 3, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                      <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A', lineHeight: 24 }}>{bus.departure}</Text>
                      <Text style={{ paddingBottom: 2, fontSize: 14, fontWeight: '700', color: '#94A3B8' }}>→</Text>
                      <Text style={{ fontSize: 24, fontWeight: '900', color: '#334155', lineHeight: 24 }}>{bus.arrival}</Text>
                    </View>
                    <Text style={{ marginTop: 4, fontSize: 12, fontWeight: '600', color: '#64748B' }}>{brief(bus.duration)} {bus.availableSeats > 0 ? `• ${bus.availableSeats} Seats` : ''}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A', lineHeight: 24 }}>₹{Number(bus.price || 0).toLocaleString('en-IN')}</Text>
                    <Text style={{ marginTop: 4, fontSize: 11, fontWeight: '600', color: '#94A3B8' }}>Onwards</Text>
                  </View>
                </View>

                <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Clock3 size={13} color="#94A3B8" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>{bus.type}  •  {bus.busName || company(bus)}</Text>
                </View>

                <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '900', color: '#0F172A' }}>{company(bus) || 'Bus Service'}</Text>
                    <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 12, fontWeight: '600', color: '#64748B' }}>{amen.length ? amen.join(' • ') : bus.routeName || `${fromCity} to ${toCity}`}</Text>
                  </View>
                  {has ? (
                    <View style={{ borderRadius: 12, backgroundColor: '#FBBF24', paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Star size={12} color="#fff" fill="#fff" /><Text style={{ fontSize: 14, fontWeight: '900', color: '#fff' }}>{rating(bus).toFixed(1)}</Text></View>
                      <Text style={{ marginTop: 2, fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{ratingCount(bus)}</Text>
                    </View>
                  ) : (
                    <View style={{ borderRadius: 99, borderWidth: 1, borderColor: '#A7F3D0', backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 4 }}><Text style={{ fontSize: 10, fontWeight: '900', color: '#047857' }}>New</Text></View>
                  )}
                </View>

                <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {bus.availableSeats > 0 ? <Chip text={`${bus.availableSeats} seats left`} bg="#FFF7ED" fg="#EA580C" strong /> : null}
                  {amen.map((a) => <Chip key={a} text={a} bg="#F1F5F9" fg="#475569" />)}
                </View>

                <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {highly(bus) ? <Chip text="Highly rated" bg="#FDF2F8" fg="#DB2777" strong /> : null}
                    {freeCancel ? <Chip text="Free cancellation" bg="#ECFDF5" fg="#059669" strong /> : null}
                    {!has ? <Chip text="New" bg="#F0F9FF" fg="#0369A1" strong /> : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', letterSpacing: 1.7, color: '#0F172A' }}>DETAILS</Text>
                    <ChevronRight size={16} color="#0F172A" />
                  </View>
                </View>
              </Pressable>
            );
          }) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
