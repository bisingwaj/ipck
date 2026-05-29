import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, ScreenContainer, TopBar } from '../../components';

export default function OTPScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const phone = route.params?.phone || '+243 •• ••• ••••';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = useRef<(TextInput | null)[]>([]);
  const filled = digits.every(d => d.length === 1);

  const update = (i: number, v: string) => {
    const next = [...digits]; next[i] = v.replace(/\D/g, '').slice(-1); setDigits(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  return (
    <ScreenContainer
      scroll={false}
      padded={false}
      footer={<Button fullWidth disabled={!filled} onPress={() => nav.navigate('ProfileSetup')}>Confirm</Button>}
    >
      <TopBar back />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8 }}>
        <Text style={styles.eyebrow}>2 OF 4 · VERIFY</Text>
        <Text style={styles.h1}>Enter the 6-digit code</Text>
        <Text style={styles.body}>We sent it to {phone}.</Text>

        <View style={styles.row}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={el => (refs.current[i] = el)}
              value={d}
              onChangeText={v => update(i, v)}
              keyboardType="number-pad"
              maxLength={1}
              style={[styles.cell, d && styles.cellFilled]}
              autoFocus={i === 0}
            />
          ))}
        </View>

        <Pressable style={{ marginTop: 24 }}><Text style={styles.resend}>Resend code in 0:48</Text></Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary, marginTop: 16 },
  h1: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 8 },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: tokens.textSecondary, marginTop: 10 },
  row: { flexDirection: 'row', gap: 10, marginTop: 28, justifyContent: 'space-between' },
  cell: { width: 46, height: 56, borderRadius: 10, backgroundColor: tokens.surface, textAlign: 'center', fontFamily: fonts.uiBold, fontSize: 22, color: tokens.text, borderWidth: 1.5, borderColor: 'transparent' },
  cellFilled: { borderColor: tokens.primary, backgroundColor: tokens.primaryTint },
  resend: { fontFamily: fonts.uiBold, fontSize: 13, color: tokens.textSecondary, textAlign: 'center' },
});
