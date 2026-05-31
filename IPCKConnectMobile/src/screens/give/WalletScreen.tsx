import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, toast, TopBar, Skeleton } from '../../components';
import { useWallet } from '../../api/hooks';
import { rewardLabel } from '../../api/format';

export default function WalletScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const wallet = useWallet();

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <TopBar back title="Grace Reserve" actions={[{ icon: 'help', onPress: () => toast.info('Grace Reserve', 'Blessings are pre-loaded credit (1 Blessing = 1 USD) you can give in one tap during a live service. Every Blessing is a true gift that settles into the fund you choose. "Freely you have received; freely give." (Matthew 10:8)') }]}/>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Balance hero */}
        <View style={styles.hero}>
          {/* Decorative hands */}
          <View style={styles.heroHands}>
            <Icon name="pray" size={26} color={tokens.accent}/>
          </View>
          <Text style={styles.heroEyebrow}>YOUR BALANCE</Text>
          {wallet.isLoading ? (
            <View style={{ marginTop: 6, gap: 8 }}>
              <Skeleton width={140} height={40} radius={10} light />
              <Skeleton width={200} height={14} radius={7} light />
            </View>
          ) : (
            <>
              <View style={styles.heroAmtRow}>
                <Text style={styles.heroAmt}>{wallet.balanceCoins}</Text>
                <Text style={styles.heroUnit}>Blessings</Text>
              </View>
              <Text style={styles.heroEq} numberOfLines={1} ellipsizeMode="tail">≈ ${wallet.balanceCoins} USD · default fund: {wallet.defaultFund}</Text>
            </>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' }}>
            <Button style={{ flex: 1 }} leftIcon="plus" onPress={() => nav.navigate('WalletTopup')}>Top up</Button>
            <Button variant="secondary" style={{ flex: 1 }} leftIcon="give" onPress={() => nav.navigate('GiveAmount')}>Send to fund</Button>
          </View>
        </View>

        {/* What are amen coins */}
        <View style={styles.explainer}>
          <View style={styles.explainerIcon}><Icon name="help" size={14} color={tokens.primary}/></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.explainerTitle} numberOfLines={1} ellipsizeMode="tail">What is Grace Reserve?</Text>
            <Text style={styles.explainerBody}>
              Blessings are pre-loaded credit you can give in real-time during a live service — one quick tap, no phone prompt.
              {'\n\n'}
              <Text style={{ fontFamily: fonts.uiBold, color: tokens.text }}>Every Blessing is a real gift.</Text> Blessings settle into the fund you choose (default: General), and you get a receipt. You can also send your balance directly to any fund anytime.
            </Text>
          </View>
        </View>

        {/* Recent activity */}
        <Text style={styles.section}>RECENT ACTIVITY</Text>
        <View style={styles.list}>
          {wallet.recent.map((tx, i) => {
            const positive = tx.coins > 0;
            const icon =
              tx.kind === 'topup'  ? 'download' :
              tx.kind === 'redeem' ? 'arrow'    :
              tx.kind === 'refund' ? 'download' :
              tx.kind === 'reward' ? 'sparkle'  : 'pray';
            const lbl =
              tx.kind === 'topup'  ? `Top-up · ${tx.method}` :
              tx.kind === 'redeem' ? `Sent to ${tx.fund}`    :
              tx.kind === 'refund' ? 'Refund' :
              tx.kind === 'reward' ? rewardLabel(tx.service) :
              `Amen during ${tx.service}`;
            return (
              <View key={tx.id} style={[styles.row, i < wallet.recent.length - 1 && { borderBottomWidth: 1, borderBottomColor: tokens.borderSoft }]}>
                <View style={[styles.rowIcon, { backgroundColor: positive ? tokens.successTint : tokens.accentTint }]}>
                  <Icon name={icon as any} size={16} color={positive ? tokens.success : tokens.accent}/>
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

        <Pressable style={styles.seeAll} onPress={() => nav.navigate('WalletTransactions')}>
          <Text style={styles.seeAllTxt}>See all transactions</Text>
          <Icon name="chevron" size={14} color={tokens.primary}/>
        </Pressable>

        {/* Privacy note */}
        <View style={styles.privacy}>
          <Icon name="lock" size={14} color={tokens.textSecondary}/>
          <Text style={styles.privacyTxt}>
            Your Grace Reserve history is private. Blessing totals during a service are public; individual senders are public only if you opt in (default: name shown).
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', padding: 28, paddingTop: 22, margin: 20, borderRadius: 20, backgroundColor: tokens.editorialInk, position: 'relative', overflow: 'hidden' },
  heroHands: { position: 'absolute', top: 18, right: 22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,176,32,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroEyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.65)', alignSelf: 'flex-start' },
  heroAmtRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 8, alignSelf: 'flex-start' },
  heroAmt: { fontFamily: fonts.serifBold, fontSize: 64, color: '#fff', letterSpacing: -2 },
  heroUnit: { fontFamily: fonts.serifMed, fontSize: 16, color: tokens.accent },
  heroEq: { fontFamily: fonts.ui, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6, alignSelf: 'flex-start' },

  explainer: { flexDirection: 'row', gap: 12, padding: 16, marginHorizontal: 20, borderRadius: 12, backgroundColor: tokens.primaryTint, alignItems: 'flex-start' },
  explainerIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  explainerTitle: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text },
  explainerBody: { fontFamily: fonts.ui, fontSize: 12.5, lineHeight: 19, color: tokens.textSecondary, marginTop: 6 },

  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, paddingHorizontal: 20, marginTop: 24, marginBottom: 8 },
  list: { marginHorizontal: 20, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderSoft, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: tokens.bg },
  rowIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: fonts.uiMedium, fontSize: 14, color: tokens.text },
  rowSub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
  rowAmt: { fontFamily: fonts.mono, fontSize: 15, fontWeight: '600', color: tokens.text },

  seeAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, marginTop: 6 },
  seeAllTxt: { fontFamily: fonts.uiBold, fontSize: 13, color: tokens.primary },

  privacy: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, margin: 20, borderRadius: 10, backgroundColor: tokens.surface },
  privacyTxt: { flex: 1, fontFamily: fonts.ui, fontSize: 12, lineHeight: 18, color: tokens.textSecondary },
});
