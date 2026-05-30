import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer, TopBar } from '../../components';
import { usePaymentMethods } from '../../api/hooks';

export default function GiveMethodScreen() {
  const nav = useNavigation<any>();
  const paymentMethods = usePaymentMethods();
  const [picked, setPicked] = useState('mpesa');
  const m = paymentMethods.find(x => x.id === picked)!;
  return (
    <ScreenContainer
      footer={<Button fullWidth onPress={() => nav.navigate(m.kind === 'card' ? 'GiveCard' : 'GiveMomoConfirm')}>Continue</Button>}
    >
      <TopBar back title="Give · $50 · General" />
      <Text style={styles.eyebrow}>3 OF 3 · METHOD</Text>
      <Text style={styles.h1}>How will you pay?</Text>

      <View style={{ marginTop: 28, gap: 10 }}>
        {paymentMethods.map(p => {
          const on = picked === p.id;
          return (
            <Pressable key={p.id} onPress={() => setPicked(p.id)} style={[styles.row, on && { borderColor: tokens.primary, backgroundColor: tokens.primaryTint }]}>
              <View style={[styles.logo, { backgroundColor: p.color }]}>
                <Text style={styles.logoTxt}>{p.logo}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{p.name}</Text>
                <Text style={styles.rowSub}>{p.kind === 'card' ? 'Visa, Mastercard' : (p.instant ? 'Instant prompt' : 'May take a few hours')}</Text>
              </View>
              {on && <Icon name="check" size={20} color={tokens.primary} strokeWidth={2.5} />}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.note}>
        <Icon name="lock" size={14} color={tokens.textSecondary} />
        <Text style={styles.noteTxt}>Payments are secured by your provider. We never store your phone PIN or card details.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary, marginTop: 8 },
  h1: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: tokens.border },
  logo: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoTxt: { fontFamily: fonts.uiBold, fontSize: 16, color: '#fff' },
  rowTitle: { fontFamily: fonts.uiBold, fontSize: 15, color: tokens.text },
  rowSub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
  note: { flexDirection: 'row', gap: 10, marginTop: 24, padding: 14, borderRadius: 10, backgroundColor: tokens.surface, alignItems: 'flex-start' },
  noteTxt: { flex: 1, fontFamily: fonts.ui, fontSize: 12, lineHeight: 18, color: tokens.textSecondary },
});
