import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ArrowRightLeft, BusFront, Calendar, ChevronLeft, ChevronRight, MapPin, Route, Search, X } from 'lucide-react-native';
import { Text } from '../../components/Text';
import api from '../../api/client';

// 1:1 port of web Taxi/modules/user/pages/bus/BusHome.jsx.
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const offset = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return key(d); };
const today = () => offset(0);
const nextWeekend = () => { const d = new Date(); const day = d.getDay(); if (day === 6 || day === 0) return key(d); d.setDate(d.getDate() + ((6 - day + 7) % 7)); return key(d); };
const monthStart = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const norm = (v = '') => String(v).trim().toLowerCase();
const fmt = (v) => { if (!v) return ''; const p = new Date(`${v}T00:00:00`); return Number.isNaN(p.getTime()) ? v : p.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); };
const calendarDays = (m) => {
  const start = monthStart(m);
  const grid = new Date(start);
  grid.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => { const d = new Date(grid); d.setDate(grid.getDate() + i); return d; });
};

export default function BusHomeScreen() {
  const navigation = useNavigation();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [date, setDate] = useState(today());
  const [error, setError] = useState('');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [routesError, setRoutesError] = useState('');
  const [calOpen, setCalOpen] = useState(false);
  const [month, setMonth] = useState(() => monthStart(new Date(offset(1))));
  const [focus, setFocus] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get('/users/buses/routes')
      .then((res) => { if (alive) setRoutes(Array.isArray(res?.data?.results) ? res.data.results : Array.isArray(res?.results) ? res.results : []); })
      .catch((e) => { if (alive) setRoutesError(e?.message || 'Failed to load route suggestions'); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const cities = useMemo(() => {
    const s = new Set();
    routes.forEach((r) => { if (r?.fromCity) s.add(String(r.fromCity).trim()); if (r?.toCity) s.add(String(r.toCity).trim()); });
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [routes]);

  const match = useMemo(() => routes.find((r) => norm(r.fromCity) === norm(fromCity) && norm(r.toCity) === norm(toCity)), [routes, fromCity, toCity]);
  const invalid = fromCity.trim() && toCity.trim() && norm(fromCity) !== norm(toCity) && routes.length > 0 && !match;

  const suggest = (typed, other, side) => {
    const set = new Set(routes.filter((r) => (!other ? true : norm(side === 'from' ? r.toCity : r.fromCity) === norm(other))).map((r) => (side === 'from' ? r.fromCity : r.toCity)).filter(Boolean));
    return [...set].filter((c) => (!typed ? true : norm(c).includes(norm(typed)))).slice(0, 6);
  };

  const go = (from, to) => navigation.navigate('BusList', { fromCity: from, toCity: to, date });

  const search = () => {
    const s = fromCity.trim(); const d = toCity.trim();
    if (!s || !d) return setError('Choose both source and destination first.');
    if (norm(s) === norm(d)) return setError('From and destination cannot be the same.');
    if (!date) return setError('Select a travel date.');
    if (date < today()) return setError('Please select today or a future travel date.');
    if (!match) return setError('This route is not active yet. Pick one from the available routes below.');
    setError('');
    go(s, d);
  };

  const quick = [{ l: 'Today', v: today() }, { l: 'Tomorrow', v: offset(1) }, { l: 'Day After', v: offset(2) }, { l: 'This Weekend', v: nextWeekend() }];
  const monthLabel = month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const field = { paddingLeft: 48, paddingRight: 16, paddingVertical: 12, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' };

  const CityInput = ({ id, label, value, onChange, side, other }) => (
    <View>
      <View style={field}>
        <MapPin size={16} color="#94A3B8" style={{ position: 'absolute', left: 16, top: 16 }} />
        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8', marginBottom: 2 }}>{label.toUpperCase()}</Text>
        <TextInput
          value={value} onChangeText={(t) => { onChange(t); setError(''); }} onFocus={() => setFocus(id)} onBlur={() => setTimeout(() => setFocus(''), 150)}
          placeholder={side === 'from' ? 'Enter source city' : 'Enter destination city'} placeholderTextColor="#CBD5E1"
          style={{ fontSize: 16, fontWeight: '600', color: '#0F172A', padding: 0 }}
        />
      </View>
      {focus === id && suggest(value, other, side).length ? (
        <View style={{ marginTop: 4, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
          {suggest(value, other, side).map((c) => (
            <Pressable key={c} onPress={() => { onChange(c); setFocus(''); }} style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155' }}>{c}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => navigation.navigate('HomeTab')} style={{ width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={18} color="#0F172A" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8' }}>BUS TICKETS</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>Book your journey</Text>
          </View>
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 128, gap: 24 }}>
        <View style={{ borderRadius: 24, backgroundColor: '#0F172A', padding: 24, shadowColor: '#E2E8F0', shadowOpacity: 0.5, shadowRadius: 20, elevation: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff', lineHeight: 28 }}>Travel with ease</Text>
              <Text style={{ marginTop: 8, fontSize: 14, color: '#CBD5E1', fontWeight: '500' }}>Find and book bus tickets for your preferred routes in just a few clicks.</Text>
            </View>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}><BusFront size={24} color="#fff" /></View>
          </View>
          <View style={{ marginTop: 24, flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16 }}>
            {[['Routes', String(routes.length || 0)], ['Cities', String(cities.length || 0)], ['Date', fmt(date) || 'Choose']].map(([l, v], i) => (
              <View key={l} style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>{l.toUpperCase()}</Text>
                <Text style={{ marginTop: 4, fontSize: i === 2 ? 14 : 18, fontWeight: '700', color: '#fff' }}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#F1F5F9', gap: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}><Search size={20} color="#475569" /></View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Search Buses</Text>
              <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>Find available buses on your route</Text>
            </View>
          </View>

          <View style={{ gap: 16 }}>
            <View>
              <CityInput id="from" label="From" value={fromCity} onChange={setFromCity} side="from" other={toCity} />
              <Pressable onPress={() => { setFromCity(toCity); setToCity(fromCity); setError(''); }} style={{ position: 'absolute', right: 20, top: 22, width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', zIndex: 5, elevation: 3 }}>
                <ArrowRightLeft size={16} color="#475569" />
              </Pressable>
            </View>
            <CityInput id="to" label="To" value={toCity} onChange={setToCity} side="to" other={fromCity} />
            <Pressable onPress={() => { setMonth(monthStart(date ? new Date(`${date}T00:00:00`) : new Date())); setCalOpen(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
              <Calendar size={16} color="#94A3B8" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8', marginBottom: 2 }}>DATE OF JOURNEY</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0F172A' }}>{fmt(date) || 'Choose date'}</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#94A3B8' }}>Change</Text>
            </Pressable>
          </View>

          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8' }}>QUICK DATES</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {quick.map((q) => (
                <Pressable key={q.v + q.l} onPress={() => setDate(q.v)} style={{ borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: date === q.v ? '#0F172A' : '#F8FAFC', borderWidth: date === q.v ? 0 : 1, borderColor: '#F1F5F9' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: date === q.v ? '#fff' : '#475569' }}>{q.l}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ gap: 16 }}>
            {match ? (
              <View style={{ borderRadius: 16, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#D1FAE5', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Route size={14} color="#059669" /><Text style={{ fontSize: 12, fontWeight: '700', color: '#047857' }}>Route available</Text></View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#047857' }}>Starts at ₹{Number(match.startingPrice || 0)}</Text>
              </View>
            ) : null}
            {invalid ? <View style={{ borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 12 }}><Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>This specific route is not available. Please check the list below.</Text></View> : null}
            {error ? <View style={{ borderRadius: 16, backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FFE4E6', paddingHorizontal: 16, paddingVertical: 12 }}><Text style={{ fontSize: 12, fontWeight: '700', color: '#E11D48' }}>{error}</Text></View> : null}
            <Pressable onPress={search} style={({ pressed }) => ({ backgroundColor: '#0F172A', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Search Buses</Text><ChevronRight size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Popular Routes</Text>
            {loading ? <ActivityIndicator size="small" color="#94A3B8" /> : null}
          </View>
          <View style={{ gap: 12 }}>
            {routes.slice(0, 6).map((r, i) => (
              <Pressable key={`${r.fromCity}-${r.toCity}-${r.operatorName || i}`} onPress={() => { setFromCity(r.fromCity || ''); setToCity(r.toCity || ''); setError(''); if (date) go(r.fromCity || '', r.toCity || ''); }} style={({ pressed }) => ({ borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>{r.fromCity} → {r.toCity}</Text>
                  <Text numberOfLines={1} style={{ marginTop: 4, fontSize: 12, fontWeight: '500', color: '#64748B' }}>{r.operatorName || 'Multiple operators available'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>FROM</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>₹{Number(r.startingPrice || 0)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
          {!loading && !routes.length && !routesError ? <Text style={{ textAlign: 'center', paddingVertical: 32, fontSize: 14, fontWeight: '500', color: '#94A3B8' }}>No active routes found.</Text> : null}
          {routesError ? <Text style={{ textAlign: 'center', paddingVertical: 32, fontSize: 14, fontWeight: '500', color: '#F43F5E' }}>{routesError}</Text> : null}
        </View>
      </ScrollView>

      <Modal visible={calOpen} transparent animationType="slide" onRequestClose={() => setCalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.4)', justifyContent: 'flex-end', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8', marginBottom: 4 }}>SELECT JOURNEY DATE</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>{monthLabel}</Text>
              </View>
              <Pressable onPress={() => setCalOpen(false)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}><X size={20} color="#94A3B8" /></Pressable>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
              <Pressable onPress={() => setMonth(addMonths(month, -1))} style={{ width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={20} color="#475569" /></Pressable>
              <View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F8FAFC', borderRadius: 99, overflow: 'hidden' }}>{fmt(date)}</Text></View>
              <Pressable onPress={() => setMonth(addMonths(month, 1))} style={{ width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={20} color="#475569" /></Pressable>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#94A3B8', paddingVertical: 8 }}>{d}</Text>)}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 }}>
              {calendarDays(month).map((d) => {
                const k = key(d);
                const cur = d.getMonth() === month.getMonth();
                const dis = k < today();
                const sel = k === date;
                return (
                  <Pressable key={k} disabled={dis} onPress={() => { setDate(k); setCalOpen(false); setError(''); }} style={{ width: '14.285%', aspectRatio: 1, padding: 2 }}>
                    <View style={{ flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? '#0F172A' : 'transparent' }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: sel ? '#fff' : dis ? '#E2E8F0' : cur ? '#1E293B' : '#CBD5E1' }}>{d.getDate()}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => { setDate(offset(1)); setCalOpen(false); }} style={{ flex: 1, paddingVertical: 12, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' }}><Text style={{ fontSize: 14, fontWeight: '700', color: '#334155' }}>Tomorrow</Text></Pressable>
              <Pressable onPress={() => setCalOpen(false)} style={{ flex: 1, paddingVertical: 12, borderRadius: 16, backgroundColor: '#0F172A', alignItems: 'center' }}><Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Confirm</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
