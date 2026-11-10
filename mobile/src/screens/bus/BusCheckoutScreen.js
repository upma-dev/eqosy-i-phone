import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Check, ChevronRight, Mail, Phone, User } from 'lucide-react-native';
import { Text } from '../../components/Text';
import api from '../../api/client';
import { authService, unwrap } from '../../api/services';
import { useAuth } from '../../store/auth';

// 1:1 port of web Taxi bus/BusDetails.jsx (route /bus/checkout): passenger + contact details, Pay Now.
const fmtDate = (s) => { try { return new Date(s).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return s; } };
const lab = { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8', marginLeft: 4, marginBottom: 6 };
const box = { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 };
const inp = { flex: 1, minWidth: 0, fontSize: 14, fontWeight: '700', color: '#0F172A', padding: 0 };
const card = { backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#F1F5F9', gap: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 };

export default function BusCheckoutScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute();
  const { bus, fromCity, toCity, date, selectedSeats, totalFare } = params || {};
  const authUser = useAuth((s) => s.user);
  const scroll = useRef(null);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [bad, setBad] = useState('');
  const [paying, setPaying] = useState(false);
  const [mode, setMode] = useState('self');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState(null);

  const apply = (p) => {
    const next = { name: String(p?.name || '').trim(), email: String(p?.email || '').trim(), phone: String(p?.phone || '').trim() };
    setProfile(next);
    setName(next.name); setEmail(next.email); setPhone(next.phone);
  };

  useEffect(() => {
    apply(authUser || {});
    authService.getCurrentUser()
      .then((r) => { const u = unwrap(r)?.user || unwrap(r) || {}; apply({ name: u.name || authUser?.name, email: u.email || authUser?.email, phone: u.phone || authUser?.phone }); })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!bus || !selectedSeats?.length) { navigation.goBack(); return null; }

  const useSelf = () => { setMode('self'); setName(profile?.name || ''); setEmail(profile?.email || ''); setPhone(profile?.phone || ''); setError(''); };
  const useOther = () => { setMode('other'); setName(''); setAge(''); setGender('Male'); setPhone(''); setEmail(''); setError(''); };
  const flag = (field, msg) => { setError(msg); setBad(field); };

  const pay = async () => {
    if (paying) return;
    const n = name.trim(); const a = Number(age); const ph = phone.replace(/\D/g, ''); const em = email.trim().toLowerCase();
    if (n.length < 2 || n.length > 80) return flag('name', 'Please enter a valid passenger full name (2 - 80 characters).');
    if (!Number.isFinite(a) || a < 1 || a > 120) return flag('age', 'Please enter a valid passenger age between 1 and 120.');
    if (!/^\d{10}$/.test(ph)) return flag('phone', 'A valid 10-digit mobile number is required (e.g. 9876543210).');
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return flag('email', 'A valid email address is required (e.g. name@example.com).');
    setError(''); setBad('');
    setPaying(true);
    try {
      // Online payment (Razorpay) needs the native development build; validate first, then stop before creating the order.
      Alert.alert('Payment', 'Razorpay payment is available in the development build. Your details are valid.');
    } finally { setPaying(false); }
  };

  const fieldStyle = (k) => (bad === k ? { borderColor: '#F43F5E', borderWidth: 2 } : null);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 }}>
          <Pressable onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={18} color="#0F172A" /></Pressable>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Passenger Details</Text>
            <Text style={{ marginTop: 2, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8' }}>{selectedSeats.length} SEAT(S) • {String(fromCity).toUpperCase()} TO {String(toCity).toUpperCase()}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 260, gap: 24 }}>
        <View style={{ backgroundColor: '#0F172A', borderRadius: 24, padding: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8', marginBottom: 8 }}>{fmtDate(date).toUpperCase()} • {bus.departure}</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', lineHeight: 24 }}>{bus.operator}</Text>
              <Text style={{ marginTop: 4, fontSize: 14, fontWeight: '500', color: '#94A3B8' }}>{bus.type}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', maxWidth: '40%' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8', marginBottom: 4 }}>SEATS</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'right' }}>{selectedSeats.map((s) => s.label || s.id).join(', ')}</Text>
            </View>
          </View>
        </View>

        <View style={card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Primary Passenger</Text>
              <Text style={{ marginTop: 4, fontSize: 12, fontWeight: '600', color: '#64748B' }}>Choose who is travelling, then confirm the details below.</Text>
            </View>
            {loadingProfile ? <ActivityIndicator size="small" color="#94A3B8" /> : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[{ id: 'self', t: 'SELF', h: 'Use my profile', s: 'Name, phone, and email auto-fill from your account.', fn: useSelf }, { id: 'other', t: 'OTHER', h: 'Book for someone else', s: 'Enter passenger details manually.', fn: useOther }].map((m) => (
              <Pressable key={m.id} onPress={m.fn} style={{ flex: 1, borderRadius: 16, borderWidth: 1, borderColor: mode === m.id ? '#0F172A' : '#E2E8F0', backgroundColor: mode === m.id ? '#0F172A' : '#F8FAFC', paddingHorizontal: 16, paddingVertical: 12 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.8, color: mode === m.id ? '#fff' : '#334155' }}>{m.t}</Text>
                <Text style={{ marginTop: 4, fontSize: 14, fontWeight: '900', color: mode === m.id ? '#fff' : '#0F172A' }}>{m.h}</Text>
                <Text style={{ marginTop: 4, fontSize: 11, fontWeight: '600', color: mode === m.id ? 'rgba(255,255,255,0.7)' : '#64748B' }}>{m.s}</Text>
              </Pressable>
            ))}
          </View>

          {mode === 'self' && profile ? (
            <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#D1FAE5', backgroundColor: '#ECFDF5', paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#047857' }}>{profile.email ? `Using ${profile.email} for the ticket confirmation.` : 'Profile phone and name are filled. Add an email if you want the e-ticket mailed too.'}</Text>
            </View>
          ) : null}

          <View style={{ gap: 16 }}>
            <View>
              <Text style={lab}>FULL NAME</Text>
              <View style={[box, fieldStyle('name')]}>
                <User size={16} color="#94A3B8" />
                <TextInput value={name} onChangeText={(t) => { setName(t); setBad(''); }} placeholder="Enter full name" placeholderTextColor="#CBD5E1" style={inp} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={lab}>AGE</Text>
                <TextInput value={age} onChangeText={(t) => { setAge(t.replace(/\D/g, '')); setBad(''); }} keyboardType="number-pad" placeholder="Age" placeholderTextColor="#CBD5E1" style={[inp, box, { flex: 0 }, fieldStyle('age')]} />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={lab}>GENDER</Text>
                <View style={{ flexDirection: 'row', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 16, padding: 4 }}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <Pressable key={g} onPress={() => setGender(g)} style={{ flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center', backgroundColor: gender === g ? '#fff' : 'transparent', shadowColor: '#000', shadowOpacity: gender === g ? 0.08 : 0, shadowRadius: 2, elevation: gender === g ? 1 : 0 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: gender === g ? '#0F172A' : '#64748B' }}>{g}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Contact Info</Text>
            <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8', backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, overflow: 'hidden' }}>FOR E-TICKET</Text>
          </View>
          <View style={{ gap: 16 }}>
            <View>
              <Text style={lab}>MOBILE NUMBER</Text>
              <View style={[box, fieldStyle('phone')]}>
                <Phone size={16} color="#94A3B8" />
                <TextInput value={phone} onChangeText={(t) => { setPhone(t.replace(/\D/g, '').slice(0, 10)); setBad(''); }} keyboardType="number-pad" placeholder="10-digit mobile number" placeholderTextColor="#CBD5E1" style={inp} />
              </View>
            </View>
            <View>
              <Text style={lab}>EMAIL ID</Text>
              <View style={[box, fieldStyle('email')]}>
                <Mail size={16} color="#94A3B8" />
                <TextInput value={email} onChangeText={(t) => { setEmail(t); setBad(''); }} keyboardType="email-address" autoCapitalize="none" placeholder="Email address" placeholderTextColor="#CBD5E1" style={inp} />
              </View>
            </View>
          </View>
          {error ? <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#FFE4E6', backgroundColor: '#FFF1F2', paddingHorizontal: 16, paddingVertical: 12 }}><Text style={{ fontSize: 12, fontWeight: '700', color: '#E11D48' }}>{error}</Text></View> : null}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(16, insets.bottom) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 }}>
          <View>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: '#94A3B8', marginBottom: 4 }}>PAYABLE AMOUNT</Text>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#0F172A' }}>₹{Number(totalFare || 0)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 }}>
            <Check size={12} color="#059669" strokeWidth={3} /><Text style={{ fontSize: 10, fontWeight: '700', color: '#047857' }}>Taxes included</Text>
          </View>
        </View>
        <Pressable onPress={pay} disabled={paying} style={{ backgroundColor: '#0F172A', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: paying ? 0.7 : 1 }}>
          {paying ? <ActivityIndicator color="#fff" /> : <><Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Pay Now</Text><ChevronRight size={18} color="#fff" /></>}
        </Pressable>
      </View>
    </View>
  );
}
