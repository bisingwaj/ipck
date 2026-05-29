import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer } from '../../components';

export default function PrayedScreen() {
  const nav = useNavigation<any>();
  return (
    <ScreenContainer scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 24 }}>
        <View style={styles.checkCircle}>
          <Icon name="check" size={48} color={tokens.success} strokeWidth={2.5} />
        </View>
        <Text style={styles.h1}>Marked as prayed.</Text>
        <Text style={styles.body}>
          Your streak is now <Text style={{ fontFamily: fonts.uiBold, color: tokens.accent }}>13 days</Text>. See you tomorrow morning, Grace.
        </Text>
      </View>
      <Button fullWidth onPress={() => nav.popToTop()}>Back to today</Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  checkCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: tokens.successTint, alignItems: 'center', justifyContent: 'center' },
  h1: { fontFamily: fonts.serifBold, fontSize: 26, lineHeight: 32, color: tokens.editorialInk, letterSpacing: -0.3, textAlign: 'center' },
  body: { fontFamily: fonts.serifMed, fontSize: 17, lineHeight: 26, color: tokens.textSecondary, textAlign: 'center', maxWidth: 300 },
});
