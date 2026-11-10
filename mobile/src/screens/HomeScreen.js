import React, { useCallback, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Text } from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authService, rideService, unwrap } from '../api/services';
import { useAuth } from '../store/auth';
import VerticalHeader from '../components/VerticalHeader';
import SuperAppHero from '../components/taxi/SuperAppHero';
import ServiceGrid from '../components/taxi/ServiceGrid';
import ActionsSection from '../components/taxi/ActionsSection';
import PromoBanners from '../components/taxi/PromoBanners';
import ExplorerSection from '../components/taxi/ExplorerSection';
import { colors, radius } from '../theme';

const IMG = {
  taxi: require('../../assets/services/taxi.png'),
  oneway: require('../../assets/services/oneway.png'),
  bus: require('../../assets/services/bus.png'),
  delivery: require('../../assets/vehicles/Delivery.png'),
};

// Gradients and icons copied from the web SuperAppHero chips.
const CHIPS = [
  { key: 'taxi', label: 'Taxi', icon: 'car', colors: ['#3B82F6', '#4F46E5'], route: 'SelectLocation' },
  { key: 'outstation', label: 'Outstation', icon: 'compass', colors: ['#2563EB', '#06B6D4'], route: null },
  { key: 'pooling', label: 'Pooling', icon: 'people', colors: ['#6366F1', '#2563EB'], route: null },
  { key: 'parcel', label: 'Parcel', icon: 'cube', colors: ['#8B5CF6', '#9333EA'], route: null },
  { key: 'bus', label: 'Bus', icon: 'bus', colors: ['#0EA5E9', '#3B82F6'], route: null },
];

const SERVICES = [
  { key: 'cab', label: 'Cab', desc: 'RIDE', img: IMG.taxi, route: 'SelectLocation' },
  { key: 'parcel', label: 'Parcel', desc: 'SEND PACK', img: IMG.delivery, route: null },
  { key: 'outstation', label: 'Book Outstation', desc: 'INTERCITY', img: IMG.oneway, route: null },
  { key: 'bus', label: 'Bus', desc: 'RESERVE', img: IMG.bus, route: null },
  { key: 'pooling', label: 'Pooling', desc: 'SHARE CAB', img: IMG.taxi, route: null },
];

const ACTIVE = ['accepted', 'arriving', 'arrived', 'started', 'ongoing', 'in_progress', 'assigned', 'searching'];

export default function HomeScreen({ navigation }) {
  const user = useAuth((s) => s.user);
  const [wallet, setWallet] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [w, r] = await Promise.allSettled([authService.getWallet(), rideService.active()]);
    if (w.status === 'fulfilled') setWallet(unwrap(w.value));
    if (r.status === 'fulfilled') {
      const ride = unwrap(r.value);
      const status = String(ride?.status || ride?.liveStatus || '').toLowerCase();
      setActiveRide(ride && (ride.rideId || ride.id || ride._id) && ACTIVE.includes(status) ? ride : null);
    } else {
      setActiveRide(null);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const go = (item) => {
    if (item.route) navigation.navigate(item.route);
    else alert(`${item.label} is coming soon in the app.`);
  };

  const firstName = String(user?.name || '').split(' ')[0] || 'there';

  const openActive = () => {
    const id = String(activeRide.rideId || activeRide.id || activeRide._id);
    if (String(activeRide.status || '').toLowerCase() === 'searching') {
      navigation.navigate('SearchingDriver', {
        resumeRideId: id,
        pickup: activeRide.pickupAddress,
        drop: activeRide.dropAddress,
        fare: activeRide.fare,
      });
    } else {
      navigation.navigate('RideTracking', { rideId: id, snapshot: activeRide });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#EFF5FD' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {/* Light blue draped shade (web page background glows) */}
        <View pointerEvents="none" style={{ position: 'absolute', top: 120, left: -80, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(147,197,253,0.28)' }} />
        <View pointerEvents="none" style={{ position: 'absolute', top: 520, right: -80, width: 360, height: 360, borderRadius: 180, backgroundColor: 'rgba(186,230,253,0.35)' }} />

        {/* HomeHeader + SuperAppHero in the navy rounded card */}
        <View style={{ backgroundColor: '#0B172A', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden', shadowColor: '#0B172A', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 14 }, elevation: 8 }}>
          <VerticalHeader />
          <SuperAppHero onSearchFocus={() => navigation.navigate('SelectLocation')} />
        </View>

        <View style={{ paddingTop: 12, gap: 20 }}>
          {activeRide ? (
            <Pressable onPress={openActive} style={{ marginHorizontal: 20 }}>
              <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.lg, padding: 16 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Ride in progress</Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 2, textTransform: 'capitalize' }}>
                  {String(activeRide.status || activeRide.liveStatus || '').replace(/_/g, ' ')} · Tap to open
                </Text>
              </LinearGradient>
            </Pressable>
          ) : null}

          <ServiceGrid />
          <ActionsSection />
          <PromoBanners />
          <ExplorerSection />
        </View>
      </ScrollView>
    </View>
  );
}
