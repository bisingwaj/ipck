import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer, toast, TopBar } from '../../components';
import { useFunds, useWallet } from '../../api/hooks';
import { useSendToFund } from '../../api/mutations';
import { apiMessage } from '../../api/errors';
import { RootStackParamList } from '../../navigation/types';

export default function GiveFundScreen() {
  const nav = useNavigation<any>();
  const { amount } = useRoute<RouteProp<RootStackParamList, 'GiveFund'>>().params;
  const funds = useFunds();
  const wallet = useWallet();
  const sendToFund = useSendToFund();
  const [picked, setPicked] = useState('general');

  const canWallet = wallet.balanceCoins >= amount;
  const fundName = funds.find(f => f.id === picked)?.name ?? picked;

  // Envoi depuis le wallet Amen → débite les coins (redeem), pas de paiement externe.
  const sendFromWallet = async () => {
    try {
      const d = await sendToFund.mutateAsync({ coins: amount, fundId: picked });
      nav.replace('GiveSuccess', { donationId: d.id, ref: d.ref, amount: d.amount, fundName });
    } catch (e) {
      toast.error('Gift not sent', apiMessage(e));
    }
  };

  return (
    <ScreenContainer
      footer={
        <View style={{ gap: 10 }}>
          <Button
            fullWidth
            leftIcon="pray"
            disabled={!canWallet || sendToFund.isPending}
            onPress={sendFromWallet}
          >
            {canWallet ? `Send $${amount} from Grace Reserve` : `Grace Reserve too low · ${wallet.balanceCoins} Blessings`}
          </Button>
          <Button variant="ghost" fullWidth onPress={() => nav.navigate('GiveMethod', { amount, fundId: picked })}>
            Pay with mobile money or card
          </Button>
        </View>
      }
    >
      <TopBar back title={`Give · $${amount}`} />
      <Text style={styles.eyebrow}>2 OF 3 · DESIGNATE</Text>
      <Text style={styles.h1}>Which fund?</Text>
      <Text style={styles.body}>Your gift goes to the work you choose. Paying from your Grace Reserve ({wallet.balanceCoins} Blessings) deducts your balance instantly.</Text>

      <View style={{ marginTop: 28, gap: 10 }}>
        {funds.map(f => {
          const on = picked === f.id;
          return (
            <Pressable key={f.id} onPress={() => setPicked(f.id)} style={[styles.row, on && { borderColor: tokens.primary, backgroundColor: tokens.primaryTint }]}>
              <View style={[styles.dot, { backgroundColor: f.accent + '33', borderColor: f.accent }]}>
                <View style={[styles.dotInner, { backgroundColor: f.accent }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={1} ellipsizeMode="tail">{f.name}</Text>
                <Text style={styles.rowSub} numberOfLines={2} ellipsizeMode="tail">{f.description}</Text>
              </View>
              {on && <Icon name="check" size={20} color={tokens.primary} strokeWidth={2.5} />}
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
  body: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 22, color: tokens.textSecondary, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: tokens.border },
  dot: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dotInner: { width: 12, height: 12, borderRadius: 4 },
  rowTitle: { fontFamily: fonts.uiBold, fontSize: 15, color: tokens.text },
  rowSub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
});
