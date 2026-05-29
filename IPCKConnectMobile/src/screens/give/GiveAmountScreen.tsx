import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, ScreenContainer, TopBar } from '../../components';

const PRESETS = [10, 25, 50, 100, 200, 500];

export default function GiveAmountScreen() {
  const nav = useNavigation<any>();
  const [amount, setAmount] = useState('50');

  return (
    <ScreenContainer
      footer={<Button fullWidth disabled={!Number(amount)} onPress={() => nav.navigate('GiveFund')}>Continue</Button>}
    >
      <TopBar back title="Give" />
      <Text style={styles.eyebrow}>1 OF 3 · AMOUNT</Text>
      <Text style={styles.h1}>How much would you like to give?</Text>

      <View style={styles.amountWrap}>
        <Text style={styles.currency}>$</Text>
        <TextInput
          value={amount}
          onChangeText={t => setAmount(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          style={styles.amountInput}
        />
      </View>

      <Text style={styles.usdEq}>Approx. {(Number(amount) * 2700).toLocaleString()} CDF</Text>

      <View style={styles.presets}>
        {PRESETS.map(p => {
          const on = String(p) === amount;
          return (
            <Pressable key={p} onPress={() => setAmount(String(p))} style={[styles.preset, on && styles.presetOn]}>
              <Text style={[styles.presetTxt, on && { color: '#fff' }]}>{'$' + p}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary, marginTop: 8 },
  h1: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 8 },
  amountWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 36 },
  currency: { fontFamily: fonts.serifBold, fontSize: 40, color: tokens.textSecondary, marginRight: 4 },
  amountInput: { fontFamily: fonts.serifBold, fontSize: 76, color: tokens.editorialInk, letterSpacing: -2, minWidth: 120, textAlign: 'center' },
  usdEq: { fontFamily: fonts.uiMedium, fontSize: 13, color: tokens.textSecondary, textAlign: 'center', marginTop: 4 },
  presets: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 36 },
  preset: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 99, borderWidth: 1.5, borderColor: tokens.border, minWidth: 78, alignItems: 'center' },
  presetOn: { backgroundColor: tokens.primary, borderColor: tokens.primary },
  presetTxt: { fontFamily: fonts.uiBold, fontSize: 15, color: tokens.text },
});
