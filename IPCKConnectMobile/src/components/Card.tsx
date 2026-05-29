import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { tokens } from '../theme/tokens';

export function Card({ children, style, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <View style={[styles.card, padded && { padding: 16 }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.bg,
    borderRadius: tokens.radiusLg,
    borderWidth: 1,
    borderColor: tokens.borderSoft,
  },
});
