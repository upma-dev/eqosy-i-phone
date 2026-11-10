import React, { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  ArrowLeft, Bookmark, ChevronRight, Info, LogOut, MapPin, Moon, Share2, ShieldAlert, ShoppingCart, Tag, Trash2, User, Utensils, Wallet,
} from 'lucide-react-native';
import { Text } from '../../components/Text';
import foodApi from '../../api/foodClient';
import { dataOf } from '../../api/foodServices';
import { useAuth } from '../../store/auth';
import { useFood } from '../../store/food';

// Port of web Food/pages/user/profile/Profile.jsx (bg #f5f5f5, white rounded cards, same order of rows).
const PRIMARY = '#EB590E';
const soon = (t) => Alert.alert(t, 'Coming soon in the app.');

function Row({ icon: Icon, iconBg = '#F3F4F6', iconColor = '#374151', label, sub, right, rightText, onPress, danger }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1, opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        {Icon ? (
          <View style={{ backgroundColor: iconBg, borderRadius: 999, padding: 8 }}>
            <Icon size={20} color={iconColor} />
          </View>
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '500', color: danger ? '#DC2626' : '#111827' }}>{label}</Text>
          {sub ? <Text numberOfLines={1} style={{ fontSize: 12, color: '#6B7280' }}>{sub}</Text> : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {rightText ? <Text style={rightText.style}>{rightText.text}</Text> : null}
        {right}
        {!danger && !right ? <ChevronRight size={20} color="#9CA3AF" /> : null}
      </View>
    </Pressable>
  );
}

const Section = ({ title }) => <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 8, marginBottom: 4 }}>{title}</Text>;

export default function FoodProfileScreen() {
  const navigation = useNavigation();
  const authUser = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const { vegMode, setVegMode, favorites } = useFood();
  const [profile, setProfile] = useState(authUser || {});
  const [wallet, setWallet] = useState(0);
  const [addresses, setAddresses] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.allSettled([foodApi.get('/food/user/profile'), foodApi.get('/food/user/wallet'), foodApi.get('/food/user/addresses')]).then(([p, w, a]) => {
        if (!alive) return;
        if (p.status === 'fulfilled') {
          const d = dataOf(p.value);
          setProfile(d?.data?.user || d?.data || d?.user || authUser || {});
        }
        if (w.status === 'fulfilled') {
          const d = dataOf(w.value);
          setWallet(Number(d?.data?.wallet?.balance ?? d?.data?.balance ?? d?.wallet?.balance ?? d?.balance ?? 0));
        }
        if (a.status === 'fulfilled') {
          const d = dataOf(a.value);
          const list = d?.data?.addresses || d?.addresses || d?.data || [];
          setAddresses(Array.isArray(list) ? list : []);
        }
      });
      return () => { alive = false; };
    }, [authUser]),
  );

  const name = String(profile?.name || '').trim() || 'Eqosy User';
  const hasEmail = Boolean(profile?.email && String(profile.email).includes('@'));
  const fields = [profile?.name, profile?.phone, profile?.email, profile?.profileImage];
  const completion = Math.round((fields.filter((f) => f && String(f).trim()).length / fields.length) * 100);

  const logout = () =>
    Alert.alert('Log out?', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => signOut() },
    ]);

  const first = addresses[0];
  const addrSummary = first ? [first.label || first.type, first.street || first.address || first.formattedAddress].filter(Boolean).join(', ') : 'Add your delivery address';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <ArrowLeft size={20} color="#000" />
        </Pressable>

        {/* Profile Info Card */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, paddingTop: 12, flexDirection: 'row', gap: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#93C5FD', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {profile?.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '600' }}>{name.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={{ flex: 1, paddingTop: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 4 }}>{name}</Text>
            {hasEmail ? <Text style={{ fontSize: 14, color: '#000', marginBottom: 4 }}>{profile.email}</Text> : null}
            {profile?.phone ? <Text style={{ fontSize: 14, color: hasEmail ? '#4B5563' : '#000' }}>{profile.phone}</Text> : null}
            {!hasEmail && !profile?.phone ? <Text style={{ fontSize: 14, color: '#6B7280' }}>Not available</Text> : null}
          </View>
        </View>

        <View style={{ gap: 8, marginTop: 12, marginBottom: 12 }}>
          <Row label="Outstanding charges" onPress={() => soon('Outstanding charges')} />
          <Row label="Food Rescue (discounted food nearby)" onPress={() => soon('Food Rescue')} />
          <Row icon={Wallet} label="Eqosy Money" onPress={() => navigation.navigate('FoodWallet')} rightText={{ text: `₹${wallet.toFixed(0)}`, style: { fontSize: 16, fontWeight: '600', color: '#16A34A' } }} />
          <Row icon={Utensils} iconBg="#FFF2EB" iconColor={PRIMARY} label="My Table Bookings" onPress={() => soon('Table bookings')} />
          <Row icon={Tag} label="Your coupons" onPress={() => soon('Coupons')} />
          <Row icon={ShoppingCart} label="Your cart" onPress={() => navigation.navigate('FoodCart')} />

          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <View style={{ backgroundColor: '#F3F4F6', borderRadius: 999, padding: 8 }}><Tag size={20} color="#374151" /></View>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>Refer & Earn</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ flex: 1, fontSize: 12, color: '#6B7280' }}>Invite a friend. Reward is added to your wallet when they sign up.</Text>
              <Pressable onPress={() => soon('Refer & Earn')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8, padding: 4 }}>
                <Share2 size={14} color={PRIMARY} />
                <Text style={{ fontSize: 12, fontWeight: '500', color: PRIMARY }}>Refer</Text>
              </Pressable>
            </View>
          </View>

          <Row icon={MapPin} label="Saved addresses" sub={addrSummary} onPress={() => soon('Addresses')} rightText={{ text: String(addresses.length), style: { fontSize: 12, fontWeight: '500', color: '#374151', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, overflow: 'hidden' } }} />
          <Row
            icon={User} label="Your profile" onPress={() => soon('Edit profile')}
            rightText={{ text: `${completion}% completed`, style: { fontSize: 12, fontWeight: '500', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, overflow: 'hidden', color: completion === 100 ? '#15803D' : '#9A3412', backgroundColor: completion === 100 ? '#DCFCE7' : '#FFEDD5' }}}
          />
          <Row
            icon={Utensils} label={`Veg Mode ${vegMode ? 'ON' : 'OFF'}`} onPress={() => setVegMode(!vegMode)}
            right={<Switch value={vegMode} onValueChange={setVegMode} trackColor={{ true: '#065f46' }} />}
          />
          <Row icon={Moon} label="Appearance" sub="Light" onPress={() => soon('Appearance')} />
        </View>

        <Section title="Collections" />
        <Row icon={Bookmark} label="Your collections" onPress={() => navigation.navigate('FoodFavorites')} rightText={{ text: String(favorites.length), style: { fontSize: 12, color: '#6B7280' } }} />

        <Section title="Food Orders" />
        <Row icon={ShoppingCart} label="Your orders" onPress={() => navigation.navigate('FoodOrders')} />

        <Section title="More" />
        <View style={{ gap: 8 }}>
          <Row icon={Info} label="Help & Support" onPress={() => soon('Help & Support')} />
          <Row icon={Info} label="About" onPress={() => soon('About')} />
          <Row icon={ShieldAlert} label="Report a safety emergency" onPress={() => soon('Safety report')} />
          <Row icon={LogOut} label="Log out" onPress={logout} right={<View />} />
          <Row icon={Trash2} iconBg="#FEE2E2" iconColor="#DC2626" label="Delete Account" danger onPress={() => soon('Delete account')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
