import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, ScreenContainer, TopBar } from '../../components';
import { useGiftHistory } from '../../api/hooks';

export default function GiveHistoryScreen() {
  const nav = useNavigation<any>();
  const giftHistory = useGiftHistory();
  const total = giftHistory.reduce((s, g) => s + g.amount, 0);
  return (
    <ScreenContainer>
      <TopBar back title="Giving history" actions={[{ icon: 'filter' }]} />

      <View style={styles.summary}>
        <Text style={styles.summaryLbl}>GIVEN THIS YEAR</Text>
        <Text style={styles.summaryAmt}>${total}</Text>
        <Text style={styles.summaryNote}>{giftHistory.length} gifts</Text>
      </View>

      <Text style={styles.section}>RECENT GIFTS</Text>
      {giftHistory.map(g => (
        <Pressable key={g.id} onPress={() => nav.navigate('GiveReceipt', { donationId: g.id })} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowDate} numberOfLines={1}>{g.date}</Text>
            <Text style={styles.rowFund} numberOfLines={1} ellipsizeMode="tail">{g.fund} · {g.method}</Text>
          </View>
          <Text style={styles.rowAmt}>${g.amount}</Text>
          <Icon name="chevron" size={16} color={tokens.textTertiary} />
        </Pressable>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summary: { padding: 22, borderRadius: 16, backgroundColor: tokens.surfaceTint, alignItems: 'center', marginBottom: 22 },
  summaryLbl: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary },
  summaryAmt: { fontFamily: fonts.serifBold, fontSize: 44, color: tokens.editorialInk, letterSpacing: -0.8, marginTop: 6 },
  summaryNote: { fontFamily: fonts.uiMedium, fontSize: 13, color: tokens.textSecondary, marginTop: 4 },
  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: tokens.borderSoft },
  rowDate: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text },
  rowFund: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
  rowAmt: { fontFamily: fonts.uiBold, fontSize: 15, color: tokens.text },
});
