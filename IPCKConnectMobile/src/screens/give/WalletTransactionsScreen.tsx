import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, TopBar } from '../../components';
import { useWalletTransactions } from '../../api/hooks';
import { rewardLabel } from '../../api/format';

export default function WalletTransactionsScreen() {
  const txns = useWalletTransactions();

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <TopBar back title="All transactions" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {txns.length === 0 ? (
          <Text style={styles.empty}>No transactions yet.</Text>
        ) : (
          <View style={styles.list}>
            {txns.map((tx: any, i: number) => {
              const positive = tx.coins > 0;
              const icon =
                tx.kind === 'topup'  ? 'download' :
                tx.kind === 'redeem' ? 'arrow'    :
                tx.kind === 'refund' ? 'download' :
                tx.kind === 'reward' ? 'sparkle'  : 'pray';
              const lbl =
                tx.kind === 'topup'  ? `Top-up · ${tx.method ?? ''}`.trim() :
                tx.kind === 'redeem' ? `Sent to ${tx.fund ?? 'fund'}`       :
                tx.kind === 'refund' ? 'Refund' :
                tx.kind === 'reward' ? rewardLabel(tx.service) :
                `Amen${tx.service ? ` during ${tx.service}` : ''}`;
              return (
                <View key={tx.id} style={[styles.row, i < txns.length - 1 && { borderBottomWidth: 1, borderBottomColor: tokens.borderSoft }]}>
                  <View style={[styles.rowIcon, { backgroundColor: positive ? tokens.successTint : tokens.accentTint }]}>
                    <Icon name={icon as any} size={16} color={positive ? tokens.success : tokens.accent} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.rowLabel} numberOfLines={1}>{lbl}</Text>
                    <Text style={styles.rowSub}>{tx.when}{tx.fund && tx.kind === 'amen' ? ` · ${tx.fund}` : ''}</Text>
                  </View>
                  <Text style={[styles.rowAmt, positive && { color: tokens.success }]}>
                    {positive ? '+' : ''}{tx.coins}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { fontFamily: fonts.ui, fontSize: 14, color: tokens.textSecondary, textAlign: 'center', marginTop: 40 },
  list: { borderRadius: 14, borderWidth: 1, borderColor: tokens.borderSoft, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: tokens.bg },
  rowIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: fonts.uiMedium, fontSize: 14, color: tokens.text },
  rowSub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
  rowAmt: { fontFamily: fonts.mono, fontSize: 15, fontWeight: '600', color: tokens.text },
});
