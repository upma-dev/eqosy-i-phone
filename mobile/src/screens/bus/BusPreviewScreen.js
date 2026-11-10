import React, { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Armchair, BusFront, CalendarDays, ChevronRight, Clock3, Images, MapPin, Phone, ShieldCheck, Ticket } from 'lucide-react-native';
import { Text } from '../../components/Text';
import BusCancellationPolicy from './BusCancellationPolicy';
import { resolveAssetUrl } from '../../config';

// 1:1 port of web Taxi bus/BusPreview.jsx (route /bus/details): gallery, journey summary, stops, policies.
const fmtDate = (s) => { try { return new Date(s).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return s; } };
const brief = (v = '') => {
  const raw = String(v || '').trim();
  return raw ? raw.replace(/days?/gi, 'd').replace(/hours?/gi, 'h').replace(/hrs?/gi, 'h').replace(/minutes?/gi, 'm').replace(/mins?/gi, 'm').replace(/\s+/g, ' ').trim() : 'Direct';
};
const STOP = { pickup: ['#A7F3D0', '#ECFDF5', '#047857'], drop: ['#FECDD3', '#FFF1F2', '#BE123C'], both: ['#C7D2FE', '#EEF2FF', '#4338CA'] };
const card = { borderRadius: 28, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#fff', padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 };
const label = { fontSize: 10, fontWeight: '900', letterSpacing: 2, color: '#94A3B8' };
const row = { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 12 };

export default function BusPreviewScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute();
  const { bus, fromCity, toCity, date } = params || {};
  const img = (u) => (u ? resolveAssetUrl(u) : '');
  const [active, setActive] = useState(img(bus?.coverImage || bus?.image || bus?.galleryImages?.[0]));

  if (!bus?.busServiceId || !bus?.scheduleId) { navigation.goBack(); return null; }

  const gallery = [bus?.coverImage || bus?.image || '', ...(Array.isArray(bus?.galleryImages) ? bus.galleryImages : [])].filter(Boolean).filter((x, i, l) => l.indexOf(x) === i).map(img);
  const stops = Array.isArray(bus?.route?.stops) ? bus.route.stops : [];

  return (
    <LinearGradient colors={['#FFF7ED', '#FFFFFF', '#F8FAFC']} locations={[0, 0.18, 1]} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={18} color="#0F172A" /></Pressable>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>{bus.operator || 'Bus Details'}</Text>
              <Text style={{ marginTop: 2, fontSize: 10, fontWeight: '900', letterSpacing: 1.8, color: '#94A3B8' }}>{String(fromCity).toUpperCase()} TO {String(toCity).toUpperCase()} • {fmtDate(date).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120, gap: 20 }}>
          <View style={{ borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.95)', overflow: 'hidden', shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 3 }}>
            <View style={{ height: 224, backgroundColor: '#0F172A' }}>
              {active ? <Image source={{ uri: active }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: bus.busColor || '#0F172A' }}><BusFront size={70} color="rgba(255,255,255,0.9)" /></View>
              )}
              <LinearGradient colors={['transparent', 'rgba(15,23,42,0.2)', 'rgba(2,6,23,0.75)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.8, color: 'rgba(255,255,255,0.7)' }}>{String(bus.busName || 'Coach Service').toUpperCase()}</Text>
                  <Text numberOfLines={1} style={{ marginTop: 4, fontSize: 22, fontWeight: '900', color: '#fff' }}>{bus.operator}</Text>
                  <Text style={{ marginTop: 4, fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.75)' }}>{bus.type} • {bus.routeName || 'Direct route'}</Text>
                </View>
                <View style={{ borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.6, color: 'rgba(255,255,255,0.7)' }}>STARTS AT</Text>
                  <Text style={{ marginTop: 4, fontSize: 24, fontWeight: '900', color: '#fff' }}>Rs {Number(bus.price || 0)}</Text>
                </View>
              </View>
            </View>
            {gallery.length > 1 ? (
              <View style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9', padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}><Images size={14} color="#94A3B8" /><Text style={label}>GALLERY</Text></View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {gallery.map((g, i) => (
                    <Pressable key={`${g}-${i}`} onPress={() => setActive(g)} style={{ borderRadius: 16, borderWidth: 2, borderColor: active === g ? '#FB923C' : 'transparent', overflow: 'hidden' }}>
                      <Image source={{ uri: g }} style={{ width: 112, height: 80 }} resizeMode="cover" />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[['Departure', bus.departure || 'NA', '#0F172A'], ['Arrival', bus.arrival || 'NA', '#0F172A'], ['Seats Left', String(bus.availableSeats || 0), '#059669']].map(([l, v, c]) => (
              <View key={l} style={{ flex: 1, borderRadius: 22, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#fff', padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }}>
                <Text style={label}>{l.toUpperCase()}</Text>
                <Text style={{ marginTop: 8, fontSize: 18, fontWeight: '900', color: c }}>{v}</Text>
              </View>
            ))}
          </View>

          <View style={card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...label, letterSpacing: 2 }}>JOURNEY SUMMARY</Text>
                <Text style={{ marginTop: 4, fontSize: 18, fontWeight: '900', color: '#0F172A' }}>{fromCity} to {toCity}</Text>
              </View>
              <View style={{ borderRadius: 99, backgroundColor: '#FFF7ED', paddingHorizontal: 12, paddingVertical: 8 }}><Text style={{ fontSize: 11, fontWeight: '900', color: '#EA580C' }}>{brief(bus.duration)}</Text></View>
            </View>
            <View style={{ marginTop: 20, gap: 12 }}>
              <View style={row}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><CalendarDays size={14} color="#94A3B8" /><Text style={{ fontSize: 14, fontWeight: '700', color: '#334155' }}>{fmtDate(date)}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Clock3 size={14} color="#94A3B8" /><Text style={{ fontSize: 14, fontWeight: '700', color: '#334155' }}>{bus.departure} to {bus.arrival}</Text></View>
              </View>
              <View style={row}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Armchair size={14} color="#94A3B8" /><Text style={{ fontSize: 14, fontWeight: '700', color: '#334155' }}>{bus.type}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ticket size={14} color="#94A3B8" /><Text style={{ fontSize: 14, fontWeight: '700', color: '#334155' }}>Rs {Number(bus.price || 0)} per seat</Text></View>
              </View>
              {bus.driverName || bus.driverPhone ? (
                <View style={row}>
                  <View><Text style={{ ...label, letterSpacing: 1.6 }}>BUS STAFF</Text><Text style={{ marginTop: 4, fontSize: 14, fontWeight: '900', color: '#0F172A' }}>{bus.driverName || 'Assigned crew'}</Text></View>
                  {bus.driverPhone ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Phone size={14} color="#94A3B8" /><Text style={{ fontSize: 14, fontWeight: '700', color: '#334155' }}>{bus.driverPhone}</Text></View> : null}
                </View>
              ) : null}
            </View>
          </View>

          <View style={card}>
            <Text style={label}>STOPS & BOARDING POINTS</Text>
            <View style={{ marginTop: 16, gap: 12 }}>
              {stops.length ? stops.map((s, i) => {
                const t = STOP[s.stopType] || STOP.pickup;
                return (
                  <View key={s.id || `${bus.id}-stop-${i}`} style={{ borderRadius: 22, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: 'rgba(248,250,252,0.8)', padding: 16, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><MapPin size={14} color="#F97316" /><Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: '900', color: '#0F172A' }}>{s.city || s.pointName || `Stop ${i + 1}`}</Text></View>
                      <Text numberOfLines={1} style={{ marginTop: 4, fontSize: 12, fontWeight: '600', color: '#64748B' }}>{s.pointName || 'Point not set'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={{ borderRadius: 99, borderWidth: 1, borderColor: t[0], backgroundColor: t[1], paddingHorizontal: 8, paddingVertical: 4 }}><Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 1, color: t[2] }}>{s.stopType === 'both' ? 'BP + DP' : s.stopType === 'drop' ? 'DP' : 'BP'}</Text></View>
                      <Text style={{ marginTop: 4, fontSize: 11, fontWeight: '700', color: '#64748B' }}>{s.arrivalTime || s.departureTime || '--:--'}</Text>
                    </View>
                  </View>
                );
              }) : (
                <View style={{ borderRadius: 22, borderWidth: 1, borderStyle: 'dashed', borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 24 }}><Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B' }}>No stop details added for this bus yet.</Text></View>
              )}
            </View>
          </View>

          <View style={card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><ShieldCheck size={16} color="#10B981" /><Text style={label}>POLICIES & COMFORT</Text></View>
            {Array.isArray(bus.amenities) && bus.amenities.length ? (
              <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {bus.amenities.map((a) => <View key={a} style={{ borderRadius: 99, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8 }}><Text style={{ fontSize: 11, fontWeight: '900', color: '#334155' }}>{a}</Text></View>)}
              </View>
            ) : null}
            <View style={{ marginTop: 16, gap: 12 }}>
              {bus.boardingPolicy ? <View style={{ ...row, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}><Text style={{ ...label, letterSpacing: 1.8 }}>BOARDING POLICY</Text><Text style={{ marginTop: 8, fontSize: 14, fontWeight: '600', lineHeight: 22, color: '#475569' }}>{bus.boardingPolicy}</Text></View> : null}
              <BusCancellationPolicy bus={bus} />
              {bus.luggagePolicy ? <View style={{ ...row, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}><Text style={{ ...label, letterSpacing: 1.8 }}>LUGGAGE POLICY</Text><Text style={{ marginTop: 8, fontSize: 14, fontWeight: '600', lineHeight: 22, color: '#475569' }}>{bus.luggagePolicy}</Text></View> : null}
            </View>
          </View>
        </ScrollView>

        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(16, insets.bottom) }}>
          <Pressable onPress={() => navigation.navigate('BusSeats', params)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 20, backgroundColor: '#0F172A', paddingVertical: 16 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>Select Seats</Text><ChevronRight size={18} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
