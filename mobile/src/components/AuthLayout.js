import React from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { colors, radius } from '../theme';

// Same look as the web AuthLayout on mobile: dark rounded header with logo, white card below.
export default function AuthLayout({ title, subtitle, children, onBack }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={styles.hero}>
        <View style={[styles.glow, { backgroundColor: `${colors.primary}1A`, top: -80, right: -80, width: 256, height: 256 }]} />
        <View style={[styles.glow, { backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -40, width: 160, height: 160 }]} />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
            <View style={{ width: '100%', paddingHorizontal: 24, paddingTop: 8, alignItems: 'flex-start', minHeight: 44 }}>
              {onBack ? (
                <Pressable onPress={onBack} style={styles.back}>
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                </Pressable>
              ) : null}
            </View>

            <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 24, paddingHorizontal: 24 }}>
              <View style={styles.logoBox}>
                <Image source={require('../../assets/brand/logo.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>Eqosy</Text>
                <View style={[styles.pill, { backgroundColor: colors.primary }]}>
                  <Ionicons name="car" size={12} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>{colors.appLabel}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              {title ? (
                <View style={{ marginBottom: 28 }}>
                  <Text style={{ fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 }}>{title}</Text>
                  {subtitle ? <Text style={{ color: colors.muted, fontSize: 14, marginTop: 6 }}>{subtitle}</Text> : null}
                </View>
              ) : null}
              {children}
            </View>

            <Text style={{ fontSize: 12, color: colors.faint, marginVertical: 24 }}>Need assistance? Contact Support</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 300, backgroundColor: colors.ink,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden',
  },
  glow: { position: 'absolute', borderRadius: 999 },
  back: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  logoBox: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  card: {
    width: '90%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 24, padding: 24,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 12 },
  },
});
