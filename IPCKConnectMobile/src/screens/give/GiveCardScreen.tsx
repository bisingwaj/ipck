import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Field, ScreenContainer, TopBar } from '../../components';

export default function GiveCardScreen() {
  const nav = useNavigation<any>();
  return (
    <ScreenContainer
      footer={<Button fullWidth onPress={() => nav.navigate('GiveSuccess')}>Give $50</Button>}
    >
      <TopBar back title="Card payment" />
      <Text style={styles.h1}>Your card details</Text>
      <Text style={styles.body}>Processed securely via Stripe.</Text>

      <View style={{ marginTop: 22 }}>
        <Field label="Card number" placeholder="1234 5678 9012 3456" keyboardType="number-pad" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Expiry" placeholder="MM/YY" keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label="CVC" placeholder="123" keyboardType="number-pad" secureTextEntry /></View>
        </View>
        <Field label="Cardholder name" placeholder="Grace Mbuyi" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: fonts.serifBold, fontSize: 26, color: tokens.editorialInk, letterSpacing: -0.4, marginTop: 8 },
  body: { fontFamily: fonts.ui, fontSize: 14, color: tokens.textSecondary, marginTop: 6 },
});
