import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/typography';

type Tone = 'info' | 'success' | 'warning' | 'error' | 'muted' | 'live';

export function Pill({ children, tone = 'muted' }: { children: React.ReactNode; tone?: Tone }) {
  const palette = {
    info: { bg: tokens.primaryTint, fg: tokens.primary },
    success: { bg: tokens.successTint, fg: tokens.success },
    warning: { bg: tokens.warningTint, fg: '#B07A14' },
    error: { bg: tokens.errorTint, fg: tokens.error },
    muted: { bg: tokens.surface, fg: tokens.textSecondary },
    live: { bg: tokens.error, fg: '#fff' },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.txt, { color: palette.fg }]} numberOfLines={1} ellipsizeMode="tail">{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  txt: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 0.5 },
});
