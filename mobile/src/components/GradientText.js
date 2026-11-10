import React from 'react';
import { Text } from './Text';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// CSS "bg-clip-text + gradient" look, done per letter (no masked view needed).
export default function GradientText({ text, stops, style }) {
  const rgb = stops.map(hex);
  const at = (t) => {
    const scaled = t * (rgb.length - 1);
    const i = Math.min(rgb.length - 2, Math.floor(scaled));
    const lt = scaled - i;
    const [a, b] = [rgb[i], rgb[i + 1]];
    return `rgb(${[0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * lt)).join(',')})`;
  };
  const chars = String(text).split('');
  return (
    <Text style={style}>
      {chars.map((ch, i) => (
        <Text key={i} style={{ color: at(i / Math.max(1, chars.length - 1)) }}>{ch}</Text>
      ))}
    </Text>
  );
}
