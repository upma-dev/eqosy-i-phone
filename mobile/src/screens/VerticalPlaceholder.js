import React from 'react';
import { View } from 'react-native';
import { Text } from '../components/Text';
import VerticalHeader from '../components/VerticalHeader';
import { useVertical } from '../store/vertical';
import { getVerticalTheme } from '../theme';

// Temporary screen for tabs that are ported in a later phase.
// withHeader=true on each vertical's home tab so the EqosyFood/Taxi/Grocery switcher is always reachable.
export default function VerticalPlaceholder({ title, note, withHeader = false }) {
  const active = useVertical((s) => s.active);
  const theme = getVerticalTheme(active);
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {withHeader ? <VerticalHeader /> : null}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.accent }} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' }}>{title}</Text>
        <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 6 }}>{note || 'Coming soon in the app.'}</Text>
      </View>
    </View>
  );
}
