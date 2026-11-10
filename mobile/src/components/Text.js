import React from 'react';
import { StyleSheet, Text as RNText } from 'react-native';
import { fontForWeight } from '../theme';

// Drop-in replacement for react-native Text that uses Poppins and honours fontWeight.
export function Text({ style, ...props }) {
  const flat = StyleSheet.flatten(style) || {};
  return <RNText {...props} style={[{ fontFamily: fontForWeight(flat.fontWeight) }, style, { fontWeight: 'normal' }]} />;
}

export default Text;
