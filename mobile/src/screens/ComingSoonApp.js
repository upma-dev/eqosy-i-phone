import React from 'react';
import { Image, View } from 'react-native';
import { Text } from '../components/Text';
import { colors, APP_VARIANT } from '../theme';

const TITLES = { driver: 'Eqosy Driver', delivery: 'Eqosy Delivery', restaurant: 'Eqosy Restaurant' };

// Placeholder until the driver / delivery / restaurant screens are ported.
export default function ComingSoonApp() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Image source={require('../../assets/brand/logo.png')} style={{ width: 60, height: 60 }} resizeMode="contain" />
      </View>
      <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>{TITLES[APP_VARIANT] || 'Eqosy'}</Text>
      <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginTop: 10 }}>
        <Text style={{ color: '#fff', fontWeight: '800', letterSpacing: 1.4, fontSize: 11 }}>{colors.appLabel}</Text>
      </View>
      <Text style={{ color: '#9CA3AF', marginTop: 20, textAlign: 'center' }}>This app is being built. Coming soon.</Text>
    </View>
  );
}
