import React from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AlertCircle, ArrowLeft, ChevronRight, HelpCircle, MessageCircle, Phone, ShieldCheck, Siren, XCircle } from 'lucide-react-native';
import { Text } from '../components/Text';

// 1:1 port of web Taxi/modules/user/pages/ride/Support.jsx (quick actions + "Choose a topic").
const soon = (t) => Alert.alert(t, 'Coming soon in the app.');

const ACTIONS = [
  { key: 'chat', title: 'Live chat', sub: 'Get quick help', Icon: MessageCircle, color: '#EA580C', glow: 'rgba(249,115,22,0.18)', onPress: () => soon('Live chat') },
  { key: 'call', title: 'Call support', sub: 'Talk to us', Icon: Phone, color: '#4F46E5', glow: 'rgba(99,102,241,0.18)', onPress: () => Linking.openURL('tel:+919876543210') },
  { key: 'sos', title: 'Emergency SOS', sub: 'Get safety help fast', Icon: Siren, color: '#E11D48', glow: 'rgba(239,68,68,0.18)', onPress: () => soon('Emergency SOS') },
];

const TOPICS = [
  { title: "Driver didn't arrive", Icon: XCircle, color: '#F43F5E', bg: 'rgba(255,241,242,0.7)' },
  { title: 'Safety concern', Icon: ShieldCheck, color: '#2563EB', bg: 'rgba(239,246,255,0.7)' },
  { title: 'I lost an item', Icon: HelpCircle, color: '#F97316', bg: 'rgba(255,247,237,0.7)' },
  { title: 'Payment failure', Icon: AlertCircle, color: '#1E293B', bg: 'rgba(248,250,252,0.7)' },
];

const glass = { backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', shadowColor: '#0F172A', shadowOpacity: 0.07, shadowRadius: 17, shadowOffset: { width: 0, height: 14 }, elevation: 3 };

export default function SupportScreen() {
  const navigation = useNavigation();
  return (
    <LinearGradient colors={['#F8FAFC', '#F3F4F6', '#EEF2F7']} locations={[0, 0.38, 1]} style={{ flex: 1 }}>
      {/* soft background glows */}
      <View pointerEvents="none" style={{ position: 'absolute', top: -80, right: -40, width: 192, height: 192, borderRadius: 96, backgroundColor: 'rgba(255,237,213,0.55)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', top: 224, left: -60, width: 224, height: 224, borderRadius: 112, backgroundColor: 'rgba(209,250,229,0.5)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', bottom: 96, right: -40, width: 176, height: 176, borderRadius: 88, backgroundColor: 'rgba(219,234,254,0.5)' }} />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.7)', shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
          <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => navigation.navigate('HomeTab')} style={{ padding: 8, marginLeft: -8 }}><ArrowLeft size={22} color="#0F172A" strokeWidth={3} /></Pressable>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2.6, color: '#94A3B8' }}>SUPPORT</Text>
              <Text numberOfLines={1} style={{ marginTop: 4, fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: -0.3, lineHeight: 18 }}>Help & Support</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 112, gap: 20 }}>
          <View style={{ gap: 12 }}>
            {ACTIONS.map((a) => (
              <Pressable key={a.key} onPress={a.onPress} style={({ pressed }) => [glass, { borderRadius: 16, padding: 16, overflow: 'hidden', transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                <View pointerEvents="none" style={{ position: 'absolute', left: 12, top: 4, width: 140, height: 100, borderRadius: 70, backgroundColor: a.glow }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' }}>
                    <a.Icon size={20} color={a.color} strokeWidth={2.6} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#0F172A', lineHeight: 16 }}>{a.title}</Text>
                    <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 11, fontWeight: '700', color: '#64748B' }}>{a.sub}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          <View>
            <Text style={{ marginBottom: 12, marginLeft: 4, fontSize: 10, fontWeight: '900', letterSpacing: 2.6, color: '#94A3B8' }}>CHOOSE A TOPIC</Text>
            <View style={{ gap: 10 }}>
              {TOPICS.map((t) => (
                <Pressable key={t.title} onPress={() => soon(t.title)} style={({ pressed }) => [glass, { borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: t.bg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' }}>
                      <t.Icon size={18} color={t.color} strokeWidth={2.6} />
                    </View>
                    <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: '900', color: '#0F172A', letterSpacing: -0.2 }}>{t.title}</Text>
                  </View>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={16} color="#CBD5E1" strokeWidth={3} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
