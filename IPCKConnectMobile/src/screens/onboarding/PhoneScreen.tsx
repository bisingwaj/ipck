import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer, TopBar } from '../../components';

export default function PhoneScreen() {
  const nav = useNavigation<any>();
  const [phone, setPhone] = useState('');
  const valid = phone.replace(/\D/g, '').length >= 8;

  return (
    <ScreenContainer
      scroll={false}
      padded={false}
      footer={<Button fullWidth disabled={!valid} onPress={() => nav.navigate('OTP', { phone: '+243 ' + phone })}>Send code</Button>}
    >
      <TopBar back />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8 }}>
        <Text style={styles.eyebrow}>1 OF 4 · YOUR PHONE</Text>
        <Text style={styles.h1}>What's your phone number?</Text>
        <Text style={styles.body}>We'll send a 6-digit code to confirm it's you.</Text>

        <View style={styles.phoneRow}>
          <Pressable style={styles.cc}>
            <Text style={styles.ccFlag}>🇨🇩</Text>
            <Text style={styles.ccCode}>+243</Text>
            <Icon name="chevronD" size={14} color={tokens.textSecondary} />
          </Pressable>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="•• ••• ••••"
            keyboardType="phone-pad"
            placeholderTextColor={tokens.textTertiary}
            style={styles.input}
            autoFocus
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <Icon name="lock" size={14} color={tokens.textSecondary} />
          <Text style={styles.note}>Standard SMS rates may apply.</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary, marginTop: 16 },
  h1: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 8 },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: tokens.textSecondary, marginTop: 10 },
  phoneRow: { flexDirection: 'row', gap: 10, marginTop: 28 },
  cc: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: tokens.surface },
  ccFlag: { fontSize: 18 },
  ccCode: { fontFamily: fonts.uiBold, fontSize: 15, color: tokens.text },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 10, backgroundColor: tokens.surface, fontFamily: fonts.ui, fontSize: 18, color: tokens.text, letterSpacing: 1 },
  note: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary },
});
