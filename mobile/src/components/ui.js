import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from './Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors, radius, fonts } from '../theme';

export function Screen({ children, style, edges = ['top', 'bottom'] }) {
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      {children}
    </SafeAreaView>
  );
}

// Web-style page header (white bar, bordered back button, bold title). Replaces the native stack header.
export function ScreenHeader({ title, navigation }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
        style={{ width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
      >
        <ArrowLeft size={18} color="#0F172A" />
      </Pressable>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>{title}</Text>
    </View>
  );
}

export function Button({ title, onPress, disabled, loading, variant = 'dark', style }) {
  const bg = variant === 'primary' ? colors.primary : variant === 'light' ? colors.surface : colors.ink;
  const fg = variant === 'light' ? colors.text : '#fff';
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: off ? '#E5E7EB' : bg, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={off ? '#9CA3AF' : fg} />
      ) : (
        <Text style={[styles.btnText, { color: off ? '#9CA3AF' : fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({ label, style, prefix, ...props }) {
  return (
    <View style={{ marginBottom: 16 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={{ justifyContent: 'center' }}>
        {prefix ? (
          <Text style={{ position: 'absolute', left: 16, zIndex: 1, fontSize: 17, fontWeight: '600', color: colors.muted }}>{prefix}</Text>
        ) : null}
        <TextInput placeholderTextColor="#9CA3AF" {...props} style={[styles.input, style]} />
      </View>
    </View>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return (
    <View style={styles.errBox}>
      <Text style={styles.errText}>{children}</Text>
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Center({ children }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>{children}</View>;
}

const styles = StyleSheet.create({
  btn: { height: 54, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  input: {
    height: 54, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, paddingHorizontal: 16, fontSize: 17, fontFamily: fonts.semibold, color: colors.text,
  },
  errBox: { backgroundColor: colors.dangerBg, borderRadius: radius.sm, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FEE2E2' },
  errText: { color: colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
});
