import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

// Exact ports of the web HomeHeader SVG icons (viewBox 64x64). Inactive = white outline.
const SIZE = 32;
const INK = '#2D1B00';

export function BurgerIcon({ isActive, size = SIZE }) {
  if (isActive) {
    return (
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Path d="M12 30C12 18 20 12 32 12C44 12 52 18 52 30H12Z" fill="#F4A261" stroke={INK} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M10 32C10 32 14 36 21 36C28 36 30 32 35 32C40 32 43 36 48 36C53 36 54 32 54 32" fill="#2A9D8F" stroke={INK} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M10 36L14 40L50 40L54 36" fill="#E9C46A" stroke={INK} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <Rect x={14} y={40} width={36} height={6} rx={3} fill="#8B5E3C" stroke={INK} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M16 46C16 52 22 54 32 54C42 54 48 52 48 46H16Z" fill="#F4A261" stroke={INK} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  const p = { stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" opacity={0.65}>
      <Path d="M12 30C12 18 20 12 32 12C44 12 52 18 52 30H12Z" {...p} />
      <Path d="M10 32C10 32 14 36 21 36C28 36 30 32 35 32C40 32 43 36 48 36C53 36 54 32 54 32" {...p} />
      <Path d="M10 36L14 40L50 40L54 36" {...p} />
      <Rect x={14} y={40} width={36} height={6} rx={3} {...p} />
      <Path d="M16 46C16 52 22 54 32 54C42 54 48 52 48 46H16Z" {...p} />
    </Svg>
  );
}

export function TaxiIcon({ isActive, size = SIZE }) {
  if (isActive) {
    return (
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Rect x={22} y={10} width={20} height={7} rx={2} fill="#1E293B" stroke="#0F172A" strokeWidth={2} />
        <Rect x={26} y={11.5} width={12} height={4} rx={1} fill="#FBBF24" />
        <Path d="M14 24H50L46 17H18L14 24Z" fill="#2563EB" stroke="#0F172A" strokeWidth={2.5} strokeLinejoin="round" />
        <Path d="M12 24H52C54.2 24 56 25.8 56 28V38C56 40.2 54.2 42 52 42H12C9.8 42 8 40.2 8 38V28C8 25.8 9.8 24 12 24Z" fill="#3B82F6" stroke="#0F172A" strokeWidth={2.5} strokeLinejoin="round" />
        <Path d="M18 28H46" stroke="#93C5FD" strokeWidth={2} strokeLinecap="round" />
        <Rect x={20} y={30} width={10} height={6} rx={1} fill="#DBEAFE" stroke="#0F172A" strokeWidth={1.5} />
        <Rect x={34} y={30} width={10} height={6} rx={1} fill="#DBEAFE" stroke="#0F172A" strokeWidth={1.5} />
        <Circle cx={18} cy={42} r={5} fill="#1E293B" stroke="#0F172A" strokeWidth={2} />
        <Circle cx={46} cy={42} r={5} fill="#1E293B" stroke="#0F172A" strokeWidth={2} />
        <Circle cx={18} cy={42} r={2} fill="#E2E8F0" />
        <Circle cx={46} cy={42} r={2} fill="#E2E8F0" />
        <Rect x={28} y={44} width={8} height={3} rx={1} fill="#64748B" />
      </Svg>
    );
  }
  const p = { stroke: '#fff', strokeWidth: 2.5, strokeLinejoin: 'round' };
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" opacity={0.7}>
      <Rect x={22} y={10} width={20} height={7} rx={2} {...p} />
      <Path d="M14 24H50L46 17H18L14 24Z" {...p} />
      <Path d="M12 24H52C54.2 24 56 25.8 56 28V38C56 40.2 54.2 42 52 42H12C9.8 42 8 40.2 8 38V28C8 25.8 9.8 24 12 24Z" {...p} />
      <Circle cx={18} cy={42} r={5} {...p} />
      <Circle cx={46} cy={42} r={5} {...p} />
    </Svg>
  );
}

export function GroceryIcon({ isActive, size = SIZE }) {
  if (isActive) {
    return (
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Path d="M10 18H14L18 44H48L52 18H58" stroke="#14532D" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M18 44H48L46 50C45.4 52.2 43.5 54 41 54H25C22.5 54 20.6 52.2 20 50L18 44Z" fill="#86EFAC" stroke="#14532D" strokeWidth={2.5} strokeLinejoin="round" />
        <Circle cx={24} cy={58} r={3} fill="#14532D" />
        <Circle cx={42} cy={58} r={3} fill="#14532D" />
        <Path d="M22 26H42C43.1 26 44 26.9 44 28V34C44 35.1 43.1 36 42 36H22C20.9 36 20 35.1 20 34V28C20 26.9 20.9 26 22 26Z" fill="#FEF9C3" stroke="#14532D" strokeWidth={2} />
        <Path d="M28 22C28 19 30 16 33 16C36 16 38 19 38 22" fill="#EF4444" stroke="#14532D" strokeWidth={2} />
        <Path d="M33 16V22" stroke="#14532D" strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M46 30C48 28 50 28 52 30C54 32 54 34 52 36" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round" />
      </Svg>
    );
  }
  const p = { stroke: '#fff', strokeWidth: 2.5 };
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" opacity={0.7}>
      <Path d="M10 18H14L18 44H48L52 18H58" {...p} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 44H48L46 50C45.4 52.2 43.5 54 41 54H25C22.5 54 20.6 52.2 20 50L18 44Z" {...p} strokeLinejoin="round" />
      <Circle cx={24} cy={58} r={3} fill="#fff" />
      <Circle cx={42} cy={58} r={3} fill="#fff" />
      <Path d="M28 22C28 19 30 16 33 16C36 16 38 19 38 22" {...p} />
    </Svg>
  );
}

export const VERTICAL_ICONS = { food: BurgerIcon, taxi: TaxiIcon, grocery: GroceryIcon };
