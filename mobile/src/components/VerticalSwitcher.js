import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { VERTICALS, getVerticalTheme } from '../theme';
import { useVertical } from '../store/vertical';
import { VERTICAL_ICONS } from './VerticalIcons';

const R = 18; // corner radius of the "curvy" active tab (web: .curvy-active-tab)

// Inverse corners that blend the active tab into the strip below it.
function Fillet({ side, color }) {
  const d =
    side === 'left'
      ? `M${R},0 A${R},${R} 0 0 1 0,${R} L${R},${R} Z`
      : `M0,0 A${R},${R} 0 0 0 ${R},${R} L0,${R} Z`;
  const pos = side === 'left' ? { right: '100%' } : { left: '100%' };
  return (
    <Svg width={R} height={R} style={[{ position: 'absolute', bottom: 0 }, pos]} pointerEvents="none">
      <Path d={d} fill={color} />
    </Svg>
  );
}

/**
 * EqosyFood | EqosyTaxi | EqosyGrocery tab strip (web: HomeHeader vertical tabs).
 * `onChange` lets a screen react to the switch; the store is always updated.
 */
export default function VerticalSwitcher({ onChange }) {
  const active = useVertical((s) => s.active);
  const setActive = useVertical((s) => s.setActive);
  const theme = getVerticalTheme(active);

  const pick = (id) => {
    if (id === active) return;
    Haptics.selectionAsync().catch(() => {});
    setActive(id);
    onChange?.(id);
  };

  return (
    <View style={[styles.row, { backgroundColor: theme.theme }]}>
      {VERTICALS.map((id) => {
        const isActive = id === active;
        const Icon = VERTICAL_ICONS[id];
        const vt = getVerticalTheme(id);
        return (
          <View key={id} style={[styles.cell, { zIndex: isActive ? 20 : 10 }]}>
            <Pressable
              onPress={() => pick(id)}
              style={[
                styles.tab,
                isActive
                  ? { backgroundColor: theme.activeTab, borderTopLeftRadius: 28, borderTopRightRadius: 28 }
                  : { backgroundColor: theme.inactiveTabBg, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
              ]}
            >
              <View style={{ marginBottom: 6 }}>
                <Icon isActive={isActive} />
              </View>
              <Text style={[styles.label, { color: isActive ? '#fff' : 'rgba(255,255,255,0.75)' }]}>{vt.name}</Text>
            </Pressable>
            {isActive ? (
              <>
                <Fillet side="left" color={theme.activeTab} />
                <Fillet side="right" color={theme.activeTab} />
              </>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, paddingHorizontal: 12, overflow: 'visible' },
  cell: { flex: 1, alignItems: 'center' },
  tab: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 10 },
  label: { fontSize: 10, fontWeight: '700', lineHeight: 12 },
});
