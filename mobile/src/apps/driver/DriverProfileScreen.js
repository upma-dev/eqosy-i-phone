import React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';
import { Text } from '../../components/Text';
import { driverApi } from './api';
import { useAuth } from '../../store/auth';
import { useDriver } from './store';
import { disconnectSocket } from '../../lib/socket';

// Port of web Taxi/modules/driver/pages/DriverProfile.jsx (read-only summary + logout).
// Edit profile, documents, vehicles, referral and support come in the next phase.
const Row = ({ label, value }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
    <Text style={{ color: '#64748B' }}>{label}</Text>
    <Text style={{ fontWeight: '700', color: '#0F172A', maxWidth: '60%', textAlign: 'right' }}>{value || '-'}</Text>
  </View>
);

export default function DriverProfileScreen() {
  const driver = useDriver((s) => s.driver) || {};
  const isOnline = useDriver((s) => s.isOnline);
  const signOut = useAuth((s) => s.signOut);
  const name = driver.name || driver.fullName || 'Driver';
  const vehicle = driver.vehicle || {};

  const logout = () =>
    Alert.alert('Log out', 'Do you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          if (isOnline) await driverApi.goOffline().catch(() => {});
          disconnectSocket();
          useDriver.getState().setDriver(null);
          signOut();
        },
      },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#3B6BF0', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800' }}>{String(name).charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>{name}</Text>
          <Text style={{ color: '#64748B' }}>{driver.phone ? `+91 ${String(driver.phone).slice(-10)}` : ''}</Text>
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16 }}>
          <Row label="Status" value={driver.approvalStatus || driver.status} />
          <Row label="Rating" value={driver.rating ? String(driver.rating) : ''} />
          <Row label="Vehicle" value={[vehicle.make || vehicle.brand, vehicle.model].filter(Boolean).join(' ')} />
          <Row label="Number plate" value={vehicle.number || vehicle.registrationNumber || vehicle.plateNumber} />
        </View>

        <Pressable onPress={logout} style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 16, paddingVertical: 14 }}>
          <LogOut size={18} color="#DC2626" />
          <Text style={{ color: '#DC2626', fontWeight: '800' }}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
