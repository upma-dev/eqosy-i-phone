import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight } from 'lucide-react-native';
import { Text } from '../Text';
import { userService, unwrap } from '../../api/services';
import { useLocationStore } from '../../store/location';
import { resolveAssetUrl } from '../../config';
import { IMPLEMENTED } from './SuperAppHero';

// 1:1 port of web Taxi/modules/user/components/ServiceGrid.jsx (plain=true on Home).
const IMG = {
  bus: require('../../../assets/services/bus.png'),
  taxi: require('../../../assets/services/taxi.png'),
  oneway: require('../../../assets/services/oneway.png'),
  delivery: require('../../../assets/vehicles/Delivery.png'),
};

const DEFAULT_SERVICES = [
  { id: 'cab', icon: IMG.taxi, label: 'Cab', description: 'Ride', route: 'SelectLocation' },
  { id: 'parcel', icon: IMG.delivery, label: 'Parcel', description: 'Send Pack', route: 'ParcelType' },
  { id: 'outstation', icon: IMG.oneway, label: 'Book Outstation', description: 'Intercity', route: 'Intercity' },
  { id: 'bus', icon: IMG.bus, label: 'Bus', description: 'Reserve', route: 'BusTab' },
  { id: 'pooling', icon: IMG.taxi, label: 'Pooling', description: 'Share Cab', route: 'Pooling' },
];

const routeFor = (m) => {
  const name = String(m.name || '').toLowerCase();
  if (m.transport_type === 'delivery') return 'ParcelType';
  if (m.service_type === 'rental') return 'Rental';
  if (m.service_type === 'outstation') return 'Intercity';
  if (m.service_type === 'pooling' || name.includes('pooling')) return 'Pooling';
  if (m.service_type === 'bus' || name.includes('bus')) return 'BusTab';
  return 'SelectLocation';
};

function ServiceCard({ service, delay }) {
  const navigation = useNavigation();
  const enter = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 400, delay: delay * 1000, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -3, duration: 1500, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [enter, float, delay]);

  const onPress = () => {
    const label = String(service.label).toLowerCase();
    if (!IMPLEMENTED.includes(service.route)) return Alert.alert(service.label, 'Coming soon in the app.');
    const preferred = service.id === 'cab' || label.includes('cab') || label.includes('taxi') ? 'cab'
      : label.includes('bike') ? 'bike' : label.includes('auto') ? 'auto' : undefined;
    navigation.navigate(service.route, preferred ? { preferredCategory: preferred } : undefined);
  };

  const source = typeof service.icon === 'number' || imgFailed ? (imgFailed ? service.fallbackIcon : service.icon) : { uri: service.icon };

  return (
    <Animated.View style={{ width: '31.5%', opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          minHeight: 112, alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, overflow: 'hidden',
          backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: 'rgba(226,232,240,0.6)',
          shadowColor: '#94A3B8', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 3,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 4, paddingBottom: 2 }}>
          <Animated.View style={{ transform: [{ translateY: float }] }}>
            <Image
              source={source}
              onError={() => service.fallbackIcon && setImgFailed(true)}
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
        <View style={{ width: '100%', alignItems: 'center', marginTop: 4 }}>
          <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '800', color: '#1E293B', letterSpacing: -0.2, paddingHorizontal: 2 }}>{service.label}</Text>
          {service.description ? (
            <Text numberOfLines={1} style={{ fontSize: 8, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2, paddingHorizontal: 2 }}>
              {service.description}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ServiceGrid() {
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(false);
  const coords = useLocationStore((s) => s.coords);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const params = coords ? { lng: coords.longitude, lat: coords.latitude } : {};
        const res = await userService.getAppModules(params);
        const body = unwrap(res);
        const results = res?.results || body?.results || (Array.isArray(body) ? body : []);
        const mapped = results
          .filter((m) => m.active)
          .map((m, idx) => {
            const name = String(m.name || '').toLowerCase();
            const isBus = m.service_type === 'bus' || name.includes('bus');
            const isPooling = m.service_type === 'pooling' || name.includes('pooling');
            const isOutstation = m.service_type === 'outstation' || name.includes('outstation');
            const isParcel = m.transport_type === 'delivery' || name.includes('parcel') || name.includes('delivery');
            let fallbackIcon = IMG.taxi;
            let description = m.short_description || 'Ride';
            if (isParcel) { fallbackIcon = IMG.delivery; if (!m.short_description) description = 'Send Pack'; }
            else if (isOutstation) { fallbackIcon = IMG.oneway; if (!m.short_description) description = 'Intercity'; }
            else if (isBus) { fallbackIcon = IMG.bus; if (!m.short_description) description = 'Reserve'; }
            else if (isPooling) { fallbackIcon = IMG.taxi; if (!m.short_description) description = 'Share Cab'; }
            const admin = m.mobile_menu_icon || m.mobile_menu_cover_image || m.icon || m.image || m.thumbnail || m.icon_url;
            const hasBike = admin && (String(admin).includes('1_Bike') || String(admin).includes('bike.png'));
            const picked = isParcel ? (admin && !hasBike ? admin : null) : (admin && String(admin).trim() ? admin : null);
            return {
              id: m._id || idx,
              icon: picked ? resolveAssetUrl(picked) : fallbackIcon,
              fallbackIcon,
              label: m.name || 'Cab',
              description,
              route: routeFor(m),
            };
          });
        // Keep the web's 5 standard cards: add any default the API did not return (e.g. Bus, Pooling).
        const has = (r) => mapped.some((m) => m.route === r);
        const merged = [...mapped, ...DEFAULT_SERVICES.filter((d) => !has(d.route))];
        if (alive) setServices(merged.length ? merged : DEFAULT_SERVICES);
      } catch {
        if (alive) setServices(DEFAULT_SERVICES);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [coords]);

  const optionLabel = services.length === 1 ? 'Service' : 'Services';
  const subtitle = loading ? 'Everything you need in one app.' : `${services.map((s) => s.label).join(', ')} and more in one app.`;

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2.5, color: '#2563EB' }}>SERVICES</Text>
          <Text style={{ marginTop: 2, fontSize: 20, fontWeight: '900', letterSpacing: -0.4, color: '#1E293B', lineHeight: 25 }}>Choose your next ride</Text>
          <Text style={{ marginTop: 4, fontSize: 11, fontWeight: '700', color: '#64748B', lineHeight: 14 }}>{subtitle}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(191,219,254,0.5)', backgroundColor: 'rgba(239,246,255,0.5)', paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={{ fontSize: 9, fontWeight: '900', color: '#2563EB' }}>{loading ? '...' : services.length} {optionLabel}</Text>
          <ArrowRight size={9} color="#2563EB" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {loading
          ? [0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={{ width: '31.5%', height: 112, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.4)' }} />
            ))
          : services.map((s, i) => <ServiceCard key={String(s.id)} service={s} delay={0.2 + i * 0.06} />)}
      </View>
    </View>
  );
}
