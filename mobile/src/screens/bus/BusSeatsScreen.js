import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { Text } from '../../components/Text';
import api from '../../api/client';
import BusCancellationPolicy from './BusCancellationPolicy';

// 1:1 port of web Taxi bus/BusSeats.jsx: seat decks, legend, selected summary, proceed bar.
const LEGEND = [
  { key: 'available', label: 'Available' }, { key: 'selected', label: 'Selected' },
  { key: 'booked', label: 'Booked' }, { key: 'sleeper', label: 'Sleeper' },
];

const resolveSeatPrice = (bus, seat) => {
  const vp = bus?.variantPricing || {};
  const def = Number(bus?.seatPrice || bus?.price || 0);
  let key = String(seat?.variant || 'seat').trim().toLowerCase();
  const lbl = String(seat?.label || seat?.id || '').toUpperCase();
  if (lbl.includes('UB')) {
    key = vp?.upper ? 'upper' : vp?.sleeper ? 'sleeper' : key;
    key = vp?.lower ? 'lower' : key;
  }
  const p = vp?.[key] ?? vp?.[seat?.variant] ?? vp?.seat ?? def;
  return Number.isFinite(Number(p)) && Number(p) > 0 ? Number(p) : def;
};

export const describeSeat = (seat = {}) => {
  const variant = String(seat.variant || 'seat').trim().toLowerCase();
  const id = String(seat.id || seat.label || '').toUpperCase();
  if (variant === 'sleeper') {
    if (/UB$|^U|SU|UPPER/.test(id)) return 'Upper berth';
    if (/LB$|SL|LOWER/.test(id)) return 'Lower berth';
    return 'Sleeper berth';
  }
  if (variant === 'window') return 'Window seat';
  if (variant === 'aisle') return 'Aisle seat';
  return 'Seat';
};

function SeatDeck({ title, rows, selectedIds, onToggle, bus }) {
  if (!rows?.length) return null;
  const upper = title.toLowerCase().includes('upper');
  return (
    <View style={{ borderRadius: 28, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#fff', padding: 20, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', borderStyle: 'dashed' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: '900', letterSpacing: 1.8, color: '#1E293B', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#F1F5F9', borderRadius: 8, overflow: 'hidden' }}>{title.toUpperCase()} ({upper ? 'UPPER BERTH' : 'LOWER BERTH'})</Text>
          <Text style={{ marginTop: 4, fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>{upper ? 'Upper deck sleeper berths' : 'Lower deck berths & seating'}</Text>
        </View>
        <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 4, borderColor: '#E2E8F0', borderRightColor: 'transparent', borderBottomColor: 'transparent', transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#E2E8F0' }} />
        </View>
      </View>

      <View style={{ gap: 12 }}>
        {rows.map((row, ri) => (
          <View key={`${title}-${ri}`} style={{ flexDirection: 'row', gap: 12 }}>
            {row.map((seat, ci) => {
              if (!seat || seat.kind !== 'seat') return <View key={`${title}-${ri}-${ci}`} style={{ flex: 1 }} />;
              const booked = seat.status === 'booked';
              const sel = selectedIds.includes(seat.id);
              const sleeper = seat.variant === 'sleeper' || String(seat.id || '').includes('B');
              const price = resolveSeatPrice(bus, seat);
              const bg = booked ? '#E2E8F0' : sel ? '#0F172A' : sleeper ? '#EFF6FF' : '#fff';
              const border = booked ? '#CBD5E1' : sel ? '#0F172A' : sleeper ? '#BFDBFE' : '#CBD5E1';
              const t1 = sel ? '#fff' : booked ? '#64748B' : '#1E293B';
              const t2 = sel ? 'rgba(255,255,255,0.7)' : booked ? '#94A3B8' : '#64748B';
              const t3 = sel ? '#FDBA74' : booked ? '#94A3B8' : '#047857';
              return (
                <Pressable key={seat.id} disabled={booked} onPress={() => onToggle(seat)} style={{ flex: 1, minHeight: sleeper ? 68 : 58, borderRadius: sleeper ? 18 : 12, borderWidth: 2, borderColor: border, backgroundColor: bg, padding: 6, alignItems: 'center', justifyContent: 'center', shadowColor: sel ? '#020617' : '#000', shadowOpacity: sel ? 0.22 : 0, shadowRadius: 8, elevation: sel ? 4 : 0 }}>
                  {sleeper ? (
                    <View style={{ position: 'absolute', left: 6, top: '14%', height: '72%', width: 6, borderRadius: 3, backgroundColor: booked ? '#94A3B8' : sel ? '#FB923C' : '#93C5FD' }} />
                  ) : (
                    <View style={{ position: 'absolute', top: -4, width: '100%', height: 8, borderTopLeftRadius: 2, borderTopRightRadius: 2, backgroundColor: booked ? '#94A3B8' : sel ? '#FB923C' : '#E2E8F0' }} />
                  )}
                  <View style={{ alignItems: 'center', paddingLeft: sleeper ? 8 : 0 }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: t1, lineHeight: 11 }}>{seat.label || seat.id}</Text>
                    <Text style={{ marginTop: 2, fontSize: 7, fontWeight: '700', color: t2, lineHeight: 8, letterSpacing: 0.4 }}>{describeSeat(seat).toUpperCase()}</Text>
                    <Text style={{ marginTop: sleeper ? 4 : 2, fontSize: sleeper ? 9 : 8, fontWeight: '700', color: t3, lineHeight: 10 }}>₹{price}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function BusSeatsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute();
  const { bus, fromCity, toCity, date } = params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [layout, setLayout] = useState(null);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (!bus?.busServiceId || !bus?.scheduleId || !date) { navigation.goBack(); return undefined; }
    let alive = true;
    setLoading(true); setError('');
    api.get(`/users/buses/${bus.busServiceId}/seats`, { params: { scheduleId: bus.scheduleId, date } })
      .then((res) => { if (alive) setLayout(res?.data || res || null); })
      .catch((e) => { if (alive) setError(e?.message || 'Failed to load seat layout'); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [bus?.busServiceId, bus?.scheduleId, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (seat) => {
    if (!seat || seat.status === 'booked') return;
    setSelected((cur) => (cur.some((s) => s.id === seat.id) ? cur.filter((s) => s.id !== seat.id) : [...cur, { id: seat.id, label: seat.label || seat.id, variant: seat.variant || 'seat', price: resolveSeatPrice(layout?.bus || bus, seat) }]));
  };
  const total = selected.reduce((n, s) => n + Number(s.price || 0), 0);
  const ready = selected.length > 0 && !error && !loading;
  const mergedBus = { ...(bus || {}), ...(layout?.bus || {}), cancellationRules: layout?.bus?.cancellationRules?.length ? layout.bus.cancellationRules : bus?.cancellationRules };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 }}>
          <Pressable onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={18} color="#0F172A" /></Pressable>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Select Seats</Text>
            <Text style={{ marginTop: 2, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8' }}>{String(bus?.operator || '').toUpperCase()} • {String(fromCity).toUpperCase()} TO {String(toCity).toUpperCase()}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 200, gap: 24 }}>
        {loading ? <View style={{ borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#fff', padding: 48, alignItems: 'center', gap: 16 }}><ActivityIndicator color="#94A3B8" size="large" /><Text style={{ fontSize: 14, fontWeight: '700', color: '#94A3B8' }}>Loading seat map...</Text></View> : null}
        {!loading && error ? <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#FFE4E6', backgroundColor: '#FFF1F2', padding: 16 }}><Text style={{ fontSize: 14, fontWeight: '700', color: '#E11D48' }}>{error}</Text></View> : null}
        {!loading && !error ? (
          <>
            <SeatDeck title="Lower Deck" rows={layout?.blueprint?.lowerDeck || []} selectedIds={selected.map((s) => s.id)} onToggle={toggle} bus={layout?.bus || bus} />
            <SeatDeck title="Upper Deck" rows={layout?.blueprint?.upperDeck || []} selectedIds={selected.map((s) => s.id)} onToggle={toggle} bus={layout?.bus || bus} />
            <BusCancellationPolicy bus={mergedBus} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 12, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#fff', padding: 16 }}>
              {LEGEND.map((l) => (
                <View key={l.key} style={{ width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 16, height: 16, borderRadius: l.key === 'sleeper' ? 8 : 4, borderWidth: l.key === 'sleeper' ? 1 : 2, borderColor: l.key === 'sleeper' ? '#BFDBFE' : l.key === 'selected' ? '#0F172A' : '#E2E8F0', backgroundColor: l.key === 'selected' ? '#0F172A' : l.key === 'booked' ? '#E2E8F0' : l.key === 'sleeper' ? '#EFF6FF' : '#fff' }} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>{l.label.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(16, insets.bottom), backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
        {selected.length > 0 ? (
          <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8', marginBottom: 4 }}>{selected.length} SEAT{selected.length > 1 ? 'S' : ''} SELECTED</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{selected.map((s) => `${s.label || s.id} (${describeSeat(s)})`).join(', ')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8', marginBottom: 4 }}>TOTAL</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>₹{total}</Text>
            </View>
          </View>
        ) : null}
        <Pressable
          disabled={!ready}
          onPress={() => navigation.navigate('BusCheckout', { ...params, tripId: layout?.tripId || params?.tripId, bus: layout?.bus || bus, selectedSeats: selected, totalFare: total })}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 16, backgroundColor: ready ? '#0F172A' : '#F1F5F9' }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: ready ? '#fff' : '#94A3B8' }}>Proceed to Passenger Details</Text>
          <ChevronRight size={18} color={ready ? '#fff' : '#94A3B8'} />
        </Pressable>
      </View>
    </View>
  );
}
