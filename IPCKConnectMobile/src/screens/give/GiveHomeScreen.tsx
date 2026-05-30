import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer, toast, TopBar, GeoArt } from '../../components';
import { useWallet } from '../../api/hooks';

export default function GiveHomeScreen() {
  const nav = useNavigation<any>();
  const wallet = useWallet();
  return (
    <ScreenContainer>
      <TopBar
        titleLarge="Give"
        actions={[{ icon: 'help', onPress: () => toast.info('Give with joy', 'Offer your tithes and offerings via Airtel Money, M-Pesa, Orange Money, Afrimoney or card. Your Grace Reserve lets you bless in one tap during a live service. "God loves a cheerful giver." (2 Corinthians 9:7)') }]}
      />

      {/* Amen Wallet — primary surface */}
      <Pressable onPress={() => nav.navigate('Wallet')} style={styles.wallet}>
        <View style={styles.walletHands}>
          <Icon name="pray" size={20} color={tokens.accent}/>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.walletEyebrow}>YOUR GRACE RESERVE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <Text style={styles.walletAmt}>{wallet.balanceCoins}</Text>
            <Text style={styles.walletUnit}>Blessings · ≈ ${wallet.balanceCoins}</Text>
          </View>
          <Text style={styles.walletSub}>Use during live · or send to a fund anytime</Text>
        </View>
        <Icon name="chevron" size={18} color="rgba(255,255,255,0.55)"/>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 16 }}>
        <Button leftIcon="plus" style={{ flex: 1 }} onPress={() => nav.navigate('WalletTopup')}>Top up</Button>
        <Button variant="secondary" leftIcon="give" style={{ flex: 1 }} onPress={() => nav.navigate('GiveAmount')}>Send to fund</Button>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <GeoArt kind="give" height={150} />
        <View style={styles.heroBody}>
          <Text style={styles.heroEyebrow}>WITH GLADNESS</Text>
          <Text style={styles.heroTitle}>Give with joy.</Text>
          <Text style={styles.heroBodyTxt}>
            Tithes and offerings via Airtel Money, M-Pesa, Orange Money, Afrimoney, or card.
          </Text>
        </View>
      </View>

      {/* Quick links */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <Pressable onPress={() => nav.navigate('GiveHistory')} style={styles.tile}>
          <Icon name="cal" size={20} color={tokens.primary} />
          <Text style={styles.tileTitle}>History</Text>
          <Text style={styles.tileSub}>Your last gifts</Text>
        </Pressable>
        <Pressable onPress={() => toast.info('Year-end statement', 'Your 2025 giving statement will be available in January.')} style={styles.tile}>
          <Icon name="download" size={20} color={tokens.primary} />
          <Text style={styles.tileTitle}>Statement</Text>
          <Text style={styles.tileSub}>Year-end · 2025</Text>
        </Pressable>
      </View>

      {/* Recurring gift status */}
      <View style={styles.recurring}>
        <View style={{ flex: 1 }}>
          <Text style={styles.recurringLbl} numberOfLines={1}>YOUR RECURRING GIFT</Text>
          <Text style={styles.recurringTitle} numberOfLines={1} ellipsizeMode="tail">$50 monthly · General fund</Text>
          <Text style={styles.recurringSub} numberOfLines={1} ellipsizeMode="tail">Next reminder: 21 Jun · M-Pesa</Text>
        </View>
        <Icon name="chevron" size={18} color={tokens.textTertiary} />
      </View>

      {/* Why we give */}
      <Text style={styles.section}>WHY WE GIVE</Text>
      <View style={styles.whyCard}>
        <Text style={styles.whyVerse}>
          "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
        </Text>
        <Text style={styles.whyRef}>2 CORINTHIANS 9:7</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({

  // Amen Wallet
  wallet: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 18, backgroundColor: tokens.editorialInk, marginTop: 12, marginBottom: 6 },
  walletHands: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,176,32,0.2)', alignItems: 'center', justifyContent: 'center' },
  walletEyebrow: { fontFamily: fonts.uiBold, fontSize: 10, letterSpacing: 1.4, color: 'rgba(255,255,255,0.6)' },
  walletAmt: { fontFamily: fonts.serifBold, fontSize: 32, color: '#fff', letterSpacing: -0.6 },
  walletUnit: { fontFamily: fonts.ui, fontSize: 12, color: tokens.accent },
  walletSub: { fontFamily: fonts.ui, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  hero: { borderRadius: 18, overflow: 'hidden', backgroundColor: tokens.surfaceTint },
  heroBody: { padding: 22 },
  heroEyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.success },
  heroTitle: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, color: tokens.editorialInk, letterSpacing: -0.4, marginTop: 6 },
  heroBodyTxt: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 22, color: tokens.text, marginTop: 8 },
  tile: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: tokens.borderSoft, gap: 6 },
  tileTitle: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text, marginTop: 4 },
  tileSub: { fontFamily: fonts.ui, fontSize: 11, color: tokens.textSecondary },
  recurring: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 12, backgroundColor: tokens.accentTint, marginTop: 16 },
  recurringLbl: { fontFamily: fonts.uiBold, fontSize: 10, letterSpacing: 1.2, color: '#B07A14' },
  recurringTitle: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.editorialInk, marginTop: 4 },
  recurringSub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginTop: 24, marginBottom: 10 },
  whyCard: { padding: 18, borderRadius: 14, backgroundColor: tokens.surface },
  whyVerse: { fontFamily: fonts.serifItalic, fontSize: 16, lineHeight: 24, color: tokens.editorialInk },
  whyRef: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, color: tokens.textSecondary, marginTop: 10 },
});
