import React from 'react';
import { View, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { AppText } from './AppText';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/typography';

// Canonical list-row layout: [leading] [title + optional subtitle, flex:1] [trailing].
// Guarantees the title never overflows or pushes the trailing action off-screen
// (mid uses minWidth:0 — essential on Android; trailing uses flexShrink:0).
// Pass `titleStyle`/`subtitleStyle` to keep each screen's existing typography.
export function TitleRow({
  leading, title, subtitle, trailing, titleStyle, subtitleStyle, titleLines = 1,
}: {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  titleLines?: 1 | 2;
}) {
  return (
    <View style={styles.row}>
      {leading}
      <View style={styles.mid}>
        <AppText clamp={titleLines} style={[styles.title, titleStyle]}>{title}</AppText>
        {!!subtitle && <AppText clamp={1} style={[styles.sub, subtitleStyle]}>{subtitle}</AppText>}
      </View>
      {!!trailing && <View style={styles.trailing}>{trailing}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mid: { flex: 1, minWidth: 0 },     // minWidth:0 lets the title shrink instead of pushing siblings
  trailing: { flexShrink: 0 },       // the action never gets squeezed by a long title
  title: { fontFamily: fonts.uiBold, fontSize: 15, color: tokens.text },
  sub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
});
