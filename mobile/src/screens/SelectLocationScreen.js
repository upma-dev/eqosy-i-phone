import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, TextInput, View } from 'react-native';
import { Text } from '../components/Text';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ScreenHeader, Button } from '../components/ui';
import { autocomplete, placeDetails, reverseGeocode, getRoute, hasMapsKey } from '../lib/google';
import { toRegionPoint } from '../lib/geo';
import { colors, radius } from '../theme';

const DEFAULT_CENTER = { latitude: 22.7196, longitude: 75.8577 };

export default function SelectLocationScreen({ navigation }) {
  const [pickup, setPickup] = useState(null); // { address, coords: [lng, lat] }
  const [drop, setDrop] = useState(null);
  const [active, setActive] = useState('drop'); // which field is being edited
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef(null);
  const timer = useRef(null);

  // Current location as pickup.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') throw new Error('denied');
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = pos.coords;
        const address = (await reverseGeocode(latitude, longitude).catch(() => '')) || 'Current location';
        if (!cancelled) setPickup({ address, coords: [longitude, latitude] });
      } catch {
        if (!cancelled) setError('Location is off. Search a pickup address manually.');
      } finally {
        if (!cancelled) setLocating(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fit map to the chosen points.
  useEffect(() => {
    const pts = [pickup, drop].map((p) => toRegionPoint(p?.coords)).filter(Boolean);
    if (pts.length && mapRef.current) {
      mapRef.current.fitToCoordinates(pts, { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true });
    }
  }, [pickup, drop]);

  const runSearch = useCallback(
    (text) => {
      setQuery(text);
      clearTimeout(timer.current);
      if (text.trim().length < 3) {
        setResults([]);
        return;
      }
      timer.current = setTimeout(async () => {
        setSearching(true);
        try {
          const origin = toRegionPoint(pickup?.coords);
          setResults(await autocomplete(text, origin ? { lat: origin.latitude, lng: origin.longitude } : {}));
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      }, 350);
    },
    [pickup],
  );

  const choose = async (item) => {
    Keyboard.dismiss();
    setError('');
    try {
      const detail = await placeDetails(item.placeId, item.title);
      if (!detail) throw new Error('no place');
      const next = { address: detail.address || item.address, coords: detail.coords };
      if (active === 'pickup') setPickup(next);
      else setDrop(next);
      setQuery('');
      setResults([]);
      if (active === 'pickup' && !drop) setActive('drop');
    } catch {
      setError('Could not load that place. Try another.');
    }
  };

  const confirm = async () => {
    if (!pickup || !drop) return;
    setConfirming(true);
    try {
      const route = await getRoute(pickup.coords, drop.coords);
      navigation.navigate('SelectVehicle', {
        pickup: pickup.address,
        drop: drop.address,
        pickupCoords: pickup.coords,
        dropCoords: drop.coords,
        estimatedDistanceMeters: route.distanceMeters,
        estimatedDurationMinutes: route.durationMinutes,
        routePath: route.path,
      });
    } finally {
      setConfirming(false);
    }
  };

  const pickupPoint = toRegionPoint(pickup?.coords);
  const dropPoint = toRegionPoint(drop?.coords);

  const renderField = ({ id, dot, value, placeholder }) => {
    const on = active === id;
    return (
      <Pressable
        key={id}
        onPress={() => { setActive(id); setQuery(''); setResults([]); }}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: radius.md,
          borderColor: on ? colors.ink : colors.border, paddingHorizontal: 12, height: 50, backgroundColor: '#fff',
        }}
      >
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dot }} />
        {on ? (
          <TextInput
            autoFocus
            value={query}
            onChangeText={runSearch}
            placeholder={value?.address || placeholder}
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.text }}
          />
        ) : (
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, fontWeight: '600', color: value ? colors.text : '#9CA3AF' }}>
            {id === 'pickup' && locating ? 'Finding your location...' : value?.address || placeholder}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title="Book a ride" navigation={navigation} />
      <View style={{ padding: 16, gap: 10 }}>
        {renderField({ id: 'pickup', dot: colors.success, value: pickup, placeholder: 'Pickup location' })}
        {renderField({ id: 'drop', dot: colors.danger, value: drop, placeholder: 'Where to?' })}
        {!hasMapsKey() ? (
          <Text style={{ color: colors.danger, fontSize: 12 }}>Google Maps key is not configured, so place search will not work.</Text>
        ) : null}
        {error ? <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text> : null}
      </View>

      {query.length >= 3 || results.length ? (
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={results}
          keyExtractor={(i) => i.placeId}
          ListHeaderComponent={searching ? <ActivityIndicator style={{ margin: 12 }} color={colors.primary} /> : null}
          ListEmptyComponent={!searching ? <Text style={{ color: colors.muted, padding: 16 }}>No places found.</Text> : null}
          renderItem={({ item }) => (
            <Pressable onPress={() => choose(item)} style={{ flexDirection: 'row', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Ionicons name="location-outline" size={20} color={colors.muted} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>{item.title}</Text>
                <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{item.address}</Text>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={{ ...(pickupPoint || DEFAULT_CENTER), latitudeDelta: 0.05, longitudeDelta: 0.05 }}
            showsUserLocation
          >
            {pickupPoint ? <Marker coordinate={pickupPoint} pinColor="green" title="Pickup" /> : null}
            {dropPoint ? <Marker coordinate={dropPoint} pinColor="red" title="Drop" /> : null}
          </MapView>
          <View style={{ padding: 16 }}>
            <Button title="Confirm and choose ride" onPress={confirm} disabled={!pickup || !drop} loading={confirming} variant="primary" />
          </View>
        </View>
      )}
    </Screen>
  );
}
