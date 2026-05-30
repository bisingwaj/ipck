import React from 'react';
import { View, Text, StyleSheet, ScrollView, Share } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, TopBar } from '../../components';
import { useDonation, useFunds } from '../../api/hooks';
import { shortDate, fundLabel } from '../../api/format';
import { RootStackParamList } from '../../navigation/types';

export default function GiveReceiptScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { donationId } = useRoute<RouteProp<RootStackParamList, 'GiveReceipt'>>().params;
  const donation = useDonation(donationId);
  const funds = useFunds();

  const amountStr = donation ? `$${donation.amount}.00` : '—';
  const fundName = donation ? (funds.find(f => f.id === donation.fundId)?.name ?? fundLabel(donation.fundId)) : '—';
  const rows: [string, string, boolean?][] = [
    ['Reference', donation?.ref ?? '—', true],
    ['Amount', amountStr],
    ['Fund', fundName],
    ['Method', donation?.method ?? '—'],
    ['Date', donation ? shortDate(donation.createdAt) : '—'],
    ['Status', donation?.status ?? '—'],
  ];

  const onShare = () => {
    Share.share({ message: `IPCK gift receipt ${donation?.ref ?? ''} — ${amountStr} to ${fundName}` }).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <TopBar back title="Receipt" actions={[{ icon: 'share', onPress: onShare }]} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={styles.receipt}>
          <View style={styles.receiptHead}>
            <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: tokens.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="church" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.org}>IPCK · Kinshasa</Text>
              <Text style={styles.orgSub}>International Protestant Church of Kinshasa</Text>
            </View>
          </View>

          <View style={styles.amount}>
            <Text style={styles.amountLbl}>RECEIVED WITH THANKS</Text>
            <Text style={styles.amountVal}>{amountStr}</Text>
          </View>

          {rows.map(([l, v, sep]) => (
            <View key={l} style={[styles.row, sep && { borderTopWidth: 1, borderTopColor: tokens.borderSoft, paddingTop: 14, marginTop: 14 }]}>
              <Text style={styles.rowLbl}>{l}</Text>
              <Text style={styles.rowVal}>{v}</Text>
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerTxt}>
              This receipt is for your records. Year-end giving statements are available each January.
            </Text>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.btmBtn, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Button fullWidth onPress={() => nav.popToTop()}>Done</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  receipt: { backgroundColor: tokens.bg, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderSoft, padding: 22 },
  receiptHead: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: tokens.borderSoft },
  org: { fontFamily: fonts.uiBold, fontSize: 15, color: tokens.text },
  orgSub: { fontFamily: fonts.ui, fontSize: 11, color: tokens.textSecondary, marginTop: 2 },
  amount: { paddingVertical: 22, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: tokens.borderSoft, borderStyle: 'dashed' },
  amountLbl: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary },
  amountVal: { fontFamily: fonts.serifBold, fontSize: 48, color: tokens.editorialInk, letterSpacing: -1, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLbl: { fontFamily: fonts.ui, fontSize: 13, color: tokens.textSecondary },
  rowVal: { fontFamily: fonts.uiBold, fontSize: 13, color: tokens.text },
  footer: { paddingTop: 18, marginTop: 14, borderTopWidth: 1, borderTopColor: tokens.borderSoft, borderStyle: 'dashed' },
  footerTxt: { fontFamily: fonts.serifItalic, fontSize: 12, color: tokens.textSecondary, lineHeight: 18 },
  btmBtn: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: tokens.bg, borderTopWidth: 1, borderTopColor: tokens.borderSoft },
});
