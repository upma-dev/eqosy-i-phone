import React, { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Bell, BusFront, Check, ChevronRight, CreditCard, FileText, Gift, HelpCircle, History, LogOut, MapPin, Package, Phone, Settings, Shield, Star, Trash2, User, Wallet,
} from 'lucide-react-native';
import { Text } from '../components/Text';
import { authService, unwrap } from '../api/services';
import api from '../api/client';
import { useAuth } from '../store/auth';

// 1:1 port of web Taxi/modules/user/pages/Profile.jsx (dark header, hero card with stats, grouped menu, sign out).
const soon = (t) => Alert.alert(t, 'Coming soon in the app.');

const SECTIONS = [
  { title: 'Personal', items: [
    { icon: User, title: 'Profile Settings', sub: 'Manage your personal info', bg: '#EEF2FF', color: '#4F46E5', route: null },
    { icon: MapPin, title: 'Saved Addresses', sub: 'Home, office & others', bg: '#ECFDF5', color: '#059669', route: null },
    { icon: History, title: 'My Rides', sub: 'Rides, parcels & trips', bg: '#EFF6FF', color: '#2563EB', route: 'ActivityTab' },
  ] },
  { title: 'Financial & Rewards', items: [
    { icon: Wallet, title: 'My Wallet', sub: 'Balance & transactions', bg: '#FFFBEB', color: '#D97706', route: 'Wallet' },
    { icon: Package, title: 'Subscriptions', sub: 'Ride plans & credits', bg: '#EEF2FF', color: '#4F46E5', route: null },
    { icon: Gift, title: 'Refer & Earn', sub: 'Invite friends & get rewards', bg: '#FFF1F2', color: '#E11D48', route: null },
    { icon: BusFront, title: 'Bus Tickets', sub: 'Manage bus bookings', bg: '#FFF7ED', color: '#EA580C', route: null },
  ] },
  { title: 'Preferences', items: [
    { icon: Bell, title: 'Notifications', sub: 'Offers & alerts', bg: '#FAF5FF', color: '#9333EA', route: null },
    { icon: Shield, title: 'Security & SOS', sub: 'Trust & safety settings', bg: '#F0F9FF', color: '#0284C7', route: null },
    { icon: HelpCircle, title: 'Help & Support', sub: 'Help center & tickets', bg: '#F8FAFC', color: '#475569', route: 'SupportTab' },
  ] },
  { title: 'Legal', items: [
    { icon: FileText, title: 'Terms & Conditions', sub: 'Read service terms', bg: '#FFF7ED', color: '#EA580C', route: null },
    { icon: Shield, title: 'Privacy Policy', sub: 'How your data is handled', bg: '#ECFDF5', color: '#059669', route: null },
    { icon: CreditCard, title: 'Refund Policy', sub: 'Refunds and cancellations', bg: '#EEF2FF', color: '#4F46E5', route: null },
  ] },
];

const num = (...v) => { for (const x of v) { const n = Number(x); if (Number.isFinite(n)) return n; } return 0; };

export default function ProfileScreen() {
  const navigation = useNavigation();
  const authUser = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const [profile, setProfile] = useState({ name: authUser?.name || 'User', phone: authUser?.phone || '', profileImage: authUser?.profileImage || '', stats: { trips: 0, rating: 4.9, wallet: 0 } });

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.allSettled([authService.getCurrentUser(), authService.getWallet(), api.get('/rides', { params: { page: 1, limit: 1 } })]).then(([p, w, r]) => {
        if (!alive) return;
        const user = p.status === 'fulfilled' ? (unwrap(p.value)?.user || unwrap(p.value) || {}) : {};
        const wallet = w.status === 'fulfilled' ? unwrap(w.value) || {} : {};
        const rides = r.status === 'fulfilled' ? r.value : {};
        const pag = rides?.data?.pagination || rides?.pagination || {};
        setProfile({
          name: user.name || authUser?.name || 'User',
          phone: user.phone || authUser?.phone || '',
          profileImage: user.profileImage || user.profile_image || authUser?.profileImage || '',
          stats: {
            trips: num(pag.total, rides?.total, rides?.count, user.totalRides, user.totalTrips),
            rating: num(user.rating, user.avgRating, user.average_rating, 4.9),
            wallet: num(wallet.balance, wallet.walletBalance, wallet.amount, user.walletBalance, user.wallet?.balance),
          },
        });
      });
      return () => { alive = false; };
    }, [authUser]),
  );

  const initials = (profile.name || 'User').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
  const go = (item) => (item.route ? navigation.navigate(item.route) : soon(item.title));

  const logout = () => Alert.alert('Sign out?', 'Are you sure you want to sign out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => signOut() }]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Premium header background */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320, backgroundColor: '#0F172A', overflow: 'hidden' }}>
        <LinearGradient colors={['rgba(79,70,229,0.3)', '#0F172A', '#0F172A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
        <View style={{ position: 'absolute', top: -50, right: -40, width: 256, height: 256, borderRadius: 128, backgroundColor: 'rgba(99,102,241,0.10)' }} />
        <View style={{ position: 'absolute', bottom: 0, left: -20, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(16,185,129,0.05)' }} />
      </View>

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 112 }}>
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>Profile</Text>
              <Pressable onPress={() => soon('Profile Settings')} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={20} color="#fff" />
              </Pressable>
            </View>

            {/* Hero card */}
            <View style={{ borderRadius: 32, backgroundColor: '#fff', padding: 24, shadowColor: '#0F172A', shadowOpacity: 0.2, shadowRadius: 25, shadowOffset: { width: 0, height: 20 }, elevation: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                <View>
                  <View style={{ width: 80, height: 80, borderRadius: 28, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#fff' }}>
                    {profile.profileImage ? <Image source={{ uri: profile.profileImage }} style={{ width: '100%', height: '100%' }} /> : <Text style={{ fontSize: 24, fontWeight: '900', color: 'rgba(255,255,255,0.4)' }}>{initials || 'U'}</Text>}
                  </View>
                  <View style={{ position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: 8, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={14} color="#fff" strokeWidth={4} />
                  </View>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3, textTransform: 'capitalize' }}>{profile.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Phone size={14} color="#CBD5E1" />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#94A3B8' }}>{profile.phone ? `+91 ${profile.phone}` : 'Account Active'}</Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#F8FAFC' }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: '#CBD5E1' }}>TOTAL TRIPS</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 4 }}>{profile.stats.trips}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F8FAFC' }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: '#CBD5E1' }}>RATING</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Star size={14} color="#FBBF24" fill="#FBBF24" /><Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>{profile.stats.rating}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: '#CBD5E1' }}>CREDITS</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#4F46E5', marginTop: 4 }}>₹{profile.stats.wallet}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Menu sections */}
          <View style={{ paddingHorizontal: 24, gap: 32 }}>
            {SECTIONS.map((section) => (
              <View key={section.title} style={{ gap: 16 }}>
                <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: '900', letterSpacing: 3, color: '#94A3B8' }}>{section.title.toUpperCase()}</Text>
                <View style={{ backgroundColor: '#fff', borderRadius: 32, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden', shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 3 }}>
                  {section.items.map((item, i) => (
                    <Pressable key={item.title} onPress={() => go(item)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 20, paddingHorizontal: 24, paddingVertical: 20, borderTopWidth: i ? 1 : 0, borderTopColor: '#F8FAFC', backgroundColor: pressed ? '#F8FAFC' : '#fff' })}>
                      <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center' }}>
                        <item.icon size={20} color={item.color} strokeWidth={2.5} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', letterSpacing: -0.2 }}>{item.title}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 4 }}>{item.sub}</Text>
                      </View>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronRight size={18} color="#E2E8F0" strokeWidth={3} />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}

            <View style={{ paddingTop: 16, paddingBottom: 48, gap: 16 }}>
              <Pressable onPress={() => soon('Account deletion')} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 24, borderWidth: 1, borderColor: '#FEF2F2' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={18} color="#EF4444" strokeWidth={2.5} /></View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>Request Account Deletion</Text>
              </Pressable>
              <Pressable onPress={logout} style={{ height: 64, borderRadius: 24, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#0F172A', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 6 }}>
                <LogOut size={18} color="#fff" strokeWidth={3} />
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>Sign Out Securely</Text>
              </Pressable>
              <Text style={{ textAlign: 'center', paddingTop: 24, fontSize: 10, fontWeight: '900', letterSpacing: 3, color: '#CBD5E1' }}>VERSION 2.4.1 • BUILT WITH LOVE</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
