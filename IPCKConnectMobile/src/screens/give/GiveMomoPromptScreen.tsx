import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, ScreenContainer } from '../../components';

export default function GiveMomoPromptScreen() {
  const nav = useNavigation<any>();
  useEffect(() => {
    const t = setTimeout(() => nav.replace('GiveSuccess'), 3500);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <ScreenContainer scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 22 }}>
        <View style={styles.bigCircle}>
          <Icon name="phone" size={48} color={tokens.success} />
        </View>
        <Text style={styles.h1}>Check your phone</Text>
        <Text style={styles.body}>
          We sent a prompt to <Text style={styles.bold}>+243 •• ••• ••28</Text>. Enter your M-Pesa PIN to confirm.
        </Text>
        <ActivityIndicator color={tokens.primary} />
        <Text style={styles.waiting}>Waiting for confirmation…</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bigCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: tokens.successTint, alignItems: 'center', justifyContent: 'center' },
  h1: { fontFamily: fonts.serifBold, fontSize: 26, color: tokens.editorialInk, letterSpacing: -0.4, textAlign: 'center' },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: tokens.textSecondary, textAlign: 'center', maxWidth: 280 },
  bold: { fontFamily: fonts.uiBold, color: tokens.text },
  waiting: { fontFamily: fonts.uiMedium, fontSize: 13, color: tokens.textSecondary },
});
