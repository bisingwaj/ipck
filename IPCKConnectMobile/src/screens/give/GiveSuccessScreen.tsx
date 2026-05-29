import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer } from '../../components';

export default function GiveSuccessScreen() {
  const nav = useNavigation<any>();
  return (
    <ScreenContainer scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 18 }}>
        <View style={styles.circle}>
          <Icon name="check" size={56} color={tokens.success} strokeWidth={3} />
        </View>
        <Text style={styles.h1}>Thank you, Grace.</Text>
        <Text style={styles.body}>
          Your gift of <Text style={styles.bold}>$50</Text> to the <Text style={styles.bold}>General fund</Text> was received. The kingdom advances because of givers like you.
        </Text>
        <Text style={styles.ref}>REF · GFT-024-381</Text>
      </View>
      <View style={{ gap: 10 }}>
        <Button fullWidth onPress={() => nav.navigate('GiveReceipt')}>See receipt</Button>
        <Button variant="ghost" fullWidth onPress={() => nav.popToTop()}>Back to Give</Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  circle: { width: 112, height: 112, borderRadius: 56, backgroundColor: tokens.successTint, alignItems: 'center', justifyContent: 'center' },
  h1: { fontFamily: fonts.serifBold, fontSize: 30, color: tokens.editorialInk, letterSpacing: -0.5, textAlign: 'center' },
  body: { fontFamily: fonts.serifMed, fontSize: 17, lineHeight: 26, color: tokens.textSecondary, textAlign: 'center', maxWidth: 320 },
  bold: { fontFamily: fonts.serifBold, color: tokens.text },
  ref: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.2, color: tokens.textSecondary },
});
