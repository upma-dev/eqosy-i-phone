import React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';
import { Text } from '../../components/Text';
import { deliveryApi } from './api';
import { useAuth } from '../../store/auth';
import { useDelivery } from './store';
import { disconnectSocket } from '../../lib/socket';

// Port of web DeliveryV2/pages/ProfileV2.jsx (read-only summary + logout).
// Details, bank, documents, ID card, support tickets and legal pages come later.
const Row = ({ label, value }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
    <Text style={{ color: '#64748B' }}>{label}</Text>
    <Text style={{ fontWeight: '700', color: '#0F172A', maxWidth: '60%', textAlign: 'right' }}>{value || '-'}</Text>
  </View>
);

export default function DeliveryProfileScreen() {
  const partner = useDelivery((s) => s.partner) || {};
  const user = useAuth((s) => s.user) || {};
  const isOnline = useDelivery((s) => s.isOnline);
  const signOut = useAuth((s) => s.signOut);
  const name = partner.name || user.name || 'Partner';

  const logout = () =>
    Alert.alert('Log out', 'Do you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          if (isOnline) await deliveryApi.setAvailability(false).catch(() => {});
          disconnectSocket();
          useDelivery.getState().setPartner(null);
          useDelivery.getState().setOnline(false);
          signOut();
        },
      },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#1F9D4B', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800' }}>{String(name).charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>{name}</Text>
          <Text style={{ color: '#64748B' }}>{partner.phone || user.phone ? `+91 ${String(partner.phone || user.phone).slice(-10)}` : ''}</Text>
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16 }}>
          <Row label="Delivery ID" value={partner.deliveryId || (partner._id ? `DP-${String(partner._id).slice(-8).toUpperCase()}` : '')} />
          <Row label="Status" value={partner.status} />
          <Row label="Vehicle" value={partner.vehicleType || partner.vehicleName} />
          <Row label="Vehicle number" value={partner.vehicleNumber} />
          <Row label="City" value={partner.city} />
        </View>

        <Pressable onPress={logout} style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 16, paddingVertical: 14 }}>
          <LogOut size={18} color="#DC2626" />
          <Text style={{ color: '#DC2626', fontWeight: '800' }}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
