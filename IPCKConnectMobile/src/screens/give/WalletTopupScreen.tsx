import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer, TopBar } from '../../components';
import { paymentMethods } from '../../data/mock';

const PRESETS = [10, 25, 50, 100, 200, 500];

export default function WalletTopupScreen() {
  const nav = useNavigation<any>();
  const [amount, setAmount] = useState(50);
  const [method, setMethod] = useState('mpesa');
  const m = paymentMethods.find(x => x.id === method)!;

  return (
    <ScreenContainer
      footer={
        <Button
          fullWidth
          leftIcon="pray"
          onPress={() => nav.navigate(m.kind === 'card' ? 'GiveCard' : 'GiveMomoPrompt')}
        >
          Top up {amount} amen coins
        </Button>
      }
    >
      <TopBar back title="Top up wallet"/>

      <Text style={styles.eyebrow}>AMEN WALLET · TOP UP</Text>
      <Text style={styles.h1}>How many coins?</Text>
      <Text style={styles.body}>
        1 amen coin = 1 USD. Coins never expire. They settle into your default fund when used.
      </Text>

      {/* Amount display */}
      <View style={styles.amtWrap}>
        <View style={styles.amtHands}><Icon name="pray" size={20} color={tokens.accent}/></View>
        <Text style={styles.amt}>{amount}</Text>
        <Text style={styles.amtUnit}>coins</Text>
      </View>
      <Text style={styles.usdEq}>≈ ${amount} USD · ~{(amount * 2700).toLocaleString()} CDF</Text>

      {/* Presets */}
      <View style={styles.presets}>
        {PRESETS.map(p => {
          const on = amount === p;
          return (
            <Pressable key={p} onPress={() => setAmount(p)} style={[styles.preset, on && styles.presetOn]}>
              <Text style={[styles.presetTxt, on && { color: '#fff' }]}>+{p}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Method */}
      <Text style={styles.section}>PAY WITH</Text>
      <View style={{ gap: 8 }}>
        {paymentMethods.map(p => {
          const on = method === p.id;
          return (
            <Pressable key={p.id} onPress={() => setMethod(p.id)} style={[styles.method, on && styles.methodOn]}>
              <View style={[styles.methodLogo, { backgroundColor: p.color }]}>
                <Text style={styles.methodLogoTxt}>{p.logo}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodName}>{p.name}</Text>
                <Text style={styles.methodSub}>{p.kind === 'card' ? 'Visa, Mastercard · instant' : p.instant ? 'Instant prompt' : 'May take a few hours'}</Text>
              </View>
              {on && <Icon name="check" size={20} color={tokens.primary} strokeWidth={2.5}/>}
            </Pressable>
          );
        })}
      </View>

      {/* Receipt summary */}
      <View style={styles.summary}>
        <Row label="Top-up" value={`${amount} coins`}/>
        <Row label="Method" value={m.name}/>
        <Row label="You'll be charged" value={`$${amount}`} bold/>
      </View>
    </ScreenContainer>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLbl}>{label}</Text>
      <Text style={[styles.rowVal, bold && { fontFamily: fonts.uiBold, color: tokens.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.accent, marginTop: 12 },
  h1: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 8 },
  body: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 22, color: tokens.textSecondary, marginTop: 10 },

  amtWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 32 },
  amtHands: { width: 56, height: 56, borderRadius: 28, backgroundColor: tokens.accentTint, alignItems: 'center', justifyContent: 'center' },
  amt: { fontFamily: fonts.serifBold, fontSize: 76, color: tokens.editorialInk, letterSpacing: -2 },
  amtUnit: { fontFamily: fonts.serifMed, fontSize: 16, color: tokens.textSecondary, alignSelf: 'flex-end', paddingBottom: 16 },
  usdEq: { fontFamily: fonts.uiMedium, fontSize: 12, color: tokens.textSecondary, textAlign: 'center', marginTop: 2 },

  presets: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 },
  preset: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 99, borderWidth: 1.5, borderColor: tokens.border, minWidth: 70, alignItems: 'center' },
  presetOn: { backgroundColor: tokens.accent, borderColor: tokens.accent },
  presetTxt: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text },

  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginTop: 28, marginBottom: 10 },
  method: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: tokens.border },
  methodOn: { borderColor: tokens.primary, backgroundColor: tokens.primaryTint },
  methodLogo: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  methodLogoTxt: { fontFamily: fonts.uiBold, fontSize: 14, color: '#fff' },
  methodName: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text },
  methodSub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },

  summary: { padding: 14, borderRadius: 12, backgroundColor: tokens.surface, marginTop: 22, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLbl: { fontFamily: fonts.ui, fontSize: 13, color: tokens.textSecondary },
  rowVal: { fontFamily: fonts.uiMedium, fontSize: 13, color: tokens.text },
});
