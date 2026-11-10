import React from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BusFront, CheckCircle2, Home, Phone, QrCode, Route, Share2 } from 'lucide-react-native';
import { Text } from '../../components/Text';

// 1:1 port of web Taxi bus/BusConfirm.jsx (E-Ticket).
const fmtDate = (s) => { try { return new Date(s).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return s; } };
const compact = (v = '') => { const raw = String(v || '').trim(); return raw ? raw.replace(/days?/gi, 'd').replace(/hours?/gi, 'h').replace(/hrs?/gi, 'h').replace(/minutes?/gi, 'm').replace(/mins?/gi, 'm').replace(/\s+/g, ' ').trim() : 'Direct'; };
const reg = (v = '') => String(v || '').trim().toUpperCase();
const lab = { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8' };
const tile = { borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#F8FAFC', padding: 16 };

export default function BusConfirmScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute();
  const { booking, fromCity, toCity, date } = params || {};

  if (!booking?.bookingCode) { navigation.goBack(); return null; }

  const share = async () => {
    try {
      await Share.share({
        title: 'Bus Ticket',
        message: `Ticket ${booking.bookingCode} for ${booking.bus?.fromCity || fromCity} to ${booking.bus?.toCity || toCity} on ${booking.travelDate || date}. Seats: ${(booking.seatLabels || booking.seatIds || []).join(', ')}`,
      });
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>E-Ticket</Text>
          <Pressable onPress={share} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}><Share2 size={18} color="#475569" /></Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 40, paddingBottom: 140, alignItems: 'center' }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 }}>
          <CheckCircle2 size={32} color="#fff" />
        </View>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ ...lab, marginBottom: 4 }}>BOOKING CONFIRMED</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#0F172A' }}>Your ticket is ready</Text>
        </View>

        <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' }}>
          <View style={{ padding: 24, backgroundColor: '#0F172A' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <View><Text style={{ ...lab, marginBottom: 4 }}>PNR NUMBER</Text><Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: 3 }}>{booking.bookingCode}</Text></View>
              <View style={{ alignItems: 'flex-end' }}><Text style={{ ...lab, marginBottom: 4 }}>SEAT(S)</Text><Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>{(booking.seatLabels || booking.seatIds || []).join(', ')}</Text></View>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 }}>{booking.bus?.operator}</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8' }}>{booking.bus?.type}{booking.bus?.registrationNumber ? ` • ${reg(booking.bus.registrationNumber)}` : ''}</Text>
          </View>

          <View style={{ padding: 24, gap: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>{booking.bus?.departure}</Text>
                <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: 4 }}>{String(booking.bus?.fromCity || fromCity).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#64748B', backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, overflow: 'hidden' }}>{compact(booking.bus?.duration)}</Text>
                <View style={{ width: '100%', height: 1, borderTopWidth: 1, borderTopColor: '#E2E8F0', borderStyle: 'dashed', marginVertical: 8 }} />
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#94A3B8' }}>{fmtDate(booking.travelDate || date)}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>{booking.bus?.arrival}</Text>
                <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: 4 }}>{String(booking.bus?.toCity || toCity).toUpperCase()}</Text>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              <View style={tile}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><BusFront size={15} color="#64748B" /><Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.8, color: '#64748B' }}>BUS NUMBER</Text></View>
                <Text style={{ marginTop: 8, fontSize: 14, fontWeight: '900', color: '#0F172A' }}>{booking.bus?.registrationNumber ? reg(booking.bus.registrationNumber) : 'Will be shared soon'}</Text>
              </View>
              <View style={tile}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Phone size={15} color="#64748B" /><Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.8, color: '#64748B' }}>DRIVER CONTACT</Text></View>
                <Text style={{ marginTop: 8, fontSize: 14, fontWeight: '900', color: '#0F172A' }}>{booking.bus?.driverPhone || booking.bus?.driverName || 'Assigned before departure'}</Text>
              </View>
            </View>

            <View style={{ ...tile, padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Route size={15} color="#64748B" /><Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.8, color: '#64748B' }}>PICKUP & DROP</Text></View>
              <View style={{ marginTop: 12, gap: 12 }}>
                <View><Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.6, color: '#059669' }}>PICKUP</Text><Text style={{ marginTop: 4, fontSize: 14, fontWeight: '900', color: '#0F172A' }}>{booking.bus?.pickupLocation || booking.bus?.fromCity || fromCity}</Text></View>
                <View><Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.6, color: '#E11D48' }}>DROP</Text><Text style={{ marginTop: 4, fontSize: 14, fontWeight: '900', color: '#0F172A' }}>{booking.bus?.dropLocation || booking.bus?.toCity || toCity}</Text></View>
              </View>
            </View>

            <View style={{ ...tile, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ ...lab, marginBottom: 4 }}>PASSENGER</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{booking.passenger?.name} <Text style={{ color: '#94A3B8', fontWeight: '500', fontSize: 14 }}>({booking.passenger?.age}{String(booking.passenger?.gender || '').charAt(0)})</Text></Text>
                <Text style={{ marginTop: 8, fontSize: 12, fontWeight: '700', color: '#64748B' }}>Paid ₹{Number(booking.amount || 0)}</Text>
              </View>
              <QrCode size={48} color="#0F172A" strokeWidth={1.5} />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(16, insets.bottom) }}>
        <Pressable onPress={() => navigation.navigate('ActivityTab')} style={{ flex: 1, backgroundColor: '#F8FAFC', paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' }}><Text style={{ fontSize: 14, fontWeight: '700', color: '#334155' }}>My Bookings</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('TaxiTabs')} style={{ flex: 2, backgroundColor: '#0F172A', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Home size={18} color="#fff" /><Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Home</Text></Pressable>
      </View>
    </View>
  );
}
