import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Field, Icon, ScreenContainer, TopBar } from '../../components';
import { useFunds, usePaymentMethods } from '../../api/hooks';
import { RootStackParamList } from '../../navigation/types';

export default function GiveMomoConfirmScreen() {
  const nav = useNavigation<any>();
  const { amount, fundId, method } = useRoute<RouteProp<RootStackParamList, 'GiveMomoConfirm'>>().params;
  const funds = useFunds();
  const paymentMethods = usePaymentMethods();
  const [phone, setPhone] = useState('•• ••• ••28');
  const [recurring, setRecurring] = useState(false);
  const fundName = funds.find(f => f.id === fundId)?.name ?? fundId;
  const methodName = paymentMethods.find(m => m.id === method)?.name ?? method;

  return (
    <ScreenContainer
      footer={<Button fullWidth onPress={() => nav.navigate('GiveMomoPrompt', { amount, fundId, method })}>Send prompt to my phone</Button>}
    >
      <TopBar back title={`Confirm · ${methodName}`} />
      <Text style={styles.h1}>One last check.</Text>

      <View style={styles.summary}>
        <Row label="Amount" value={`$${amount}.00`} big />
        <Row label="Fund" value={fundName} />
        <Row label="Method" value={methodName} />
      </View>

      <Field label="M-Pesa number" value={phone} onChangeText={setPhone} />

      <Pressable onPress={() => setRecurring(r => !r)} style={styles.recurring}>
        <View style={[styles.checkbox, recurring && { backgroundColor: tokens.primary, borderColor: tokens.primary }]}>
          {recurring && <Icon name="check" size={14} color="#fff" strokeWidth={3} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.recurringTitle}>Make this a monthly gift</Text>
          <Text style={styles.recurringSub}>We'll send a friendly reminder on the 24th. M-Pesa requires you to approve each prompt — that's a provider limit, not ours.</Text>
        </View>
      </Pressable>
    </ScreenContainer>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={[styles.row, big && { borderBottomWidth: 1, borderBottomColor: tokens.borderSoft, paddingBottom: 14, marginBottom: 14 }]}>
      <Text style={styles.rowLbl}>{label}</Text>
      <Text style={[styles.rowVal, big && styles.rowValBig]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 16 },
  summary: { padding: 16, borderRadius: 14, backgroundColor: tokens.surface, marginTop: 22, marginBottom: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowLbl: { fontFamily: fonts.ui, fontSize: 13, color: tokens.textSecondary },
  rowVal: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text },
  rowValBig: { fontFamily: fonts.serifBold, fontSize: 26, color: tokens.editorialInk, letterSpacing: -0.3 },
  recurring: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: tokens.borderSoft, alignItems: 'flex-start', marginTop: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: tokens.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  recurringTitle: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text },
  recurringSub: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 18, color: tokens.textSecondary, marginTop: 4 },
});
