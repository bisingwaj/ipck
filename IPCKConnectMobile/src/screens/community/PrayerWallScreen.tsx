import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, ScreenContainer, toast, TopBar, Pill } from '../../components';
import { usePrayerWall } from '../../api/hooks';
import { usePrayForRequest } from '../../api/mutations';

export default function PrayerWallScreen() {
  const nav = useNavigation<any>();
  const prayerWall = usePrayerWall();
  const pray = usePrayForRequest();
  const [prayedId, setPrayedId] = useState<string | null>(null);
  // Le mur se valide une fois par jour : soutenir une intention valide tout le mur
  // et verrouille l'accès au soutien (notification du gain de Blessings).
  const validated = !!prayedId || prayerWall.some(p => p.iPrayed);

  const onPray = (id: string) => {
    if (validated) return; // mur déjà validé → verrouillé
    setPrayedId(id); // optimiste : verrouille tout le mur
    pray.mutate(id, {
      onSuccess: (res) => {
        if (res && res.blessingsAwarded > 0) {
          toast.success(
            'Amen 🙏',
            `Thank you for standing in the gap. ${res.blessingsAwarded} Blessings have been added to your Grace Reserve. The prayer wall is sealed for today. "Carry each other's burdens." (Galatians 6:2)`,
          );
        }
      },
      onError: () => setPrayedId(null), // rollback si échec
    });
  };

  return (
    <ScreenContainer>
      <TopBar back title="Prayer wall" actions={[{ icon: 'filter', onPress: () => toast.info('Coming soon', 'Filters are on their way.') }]} />

      <Pressable onPress={() => nav.navigate('SubmitPrayer')} style={styles.cta}>
        <View style={styles.ctaIcon}><Icon name="plus" size={20} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaTitle} numberOfLines={1} ellipsizeMode="tail">Share a prayer request</Text>
          <Text style={styles.ctaSub} numberOfLines={2} ellipsizeMode="tail">Publicly, anonymously, or privately to the pastor</Text>
        </View>
        <Icon name="chevron" size={18} color={tokens.textTertiary} />
      </Pressable>

      {validated && (
        <View style={styles.lockedBanner}>
          <View style={styles.lockedIcon}><Icon name="check" size={16} color={tokens.success} strokeWidth={3} /></View>
          <Text style={styles.lockedTxt}>
            <Text style={styles.lockedBold}>Prayer wall validated today.</Text> +5 Blessings earned — come back tomorrow.
          </Text>
        </View>
      )}

      {prayerWall.map(p => {
        const mine = prayedId === p.id || p.iPrayed; // l'intention que l'utilisateur a soutenue
        return (
          <Pressable key={p.id} onPress={() => nav.navigate('PrayerDetail', { id: p.id })} style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View style={[styles.avt, { backgroundColor: p.color }]}>
                <Text style={styles.avtTxt}>{p.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.who} numberOfLines={1} ellipsizeMode="tail">{p.who}</Text>
                <Text style={styles.ago} numberOfLines={1}>{p.ago} ago</Text>
              </View>
              {p.visibility === 'anon' && <Pill tone="muted">ANONYMOUS</Pill>}
            </View>
            <Text style={styles.text}>{p.text}</Text>
            <View style={styles.cardFoot}>
              {validated ? (
                mine ? (
                  <View style={[styles.amenBtn, styles.amenBtnOn]}>
                    <Icon name="check" size={14} color="#fff" strokeWidth={3} />
                    <Text style={[styles.amenTxt, { color: '#fff' }]}>You prayed</Text>
                  </View>
                ) : (
                  <View style={styles.amenBtnLocked}>
                    <Icon name="lock" size={13} color={tokens.textTertiary} />
                    <Text style={[styles.amenTxt, { color: tokens.textTertiary }]}>Validated today</Text>
                  </View>
                )
              ) : (
                <Pressable onPress={() => onPray(p.id)} style={styles.amenBtn}>
                  <Icon name="pray" size={14} color={tokens.text} />
                  <Text style={styles.amenTxt}>I'll pray</Text>
                </Pressable>
              )}
              <Text style={styles.count}>{p.amen + (mine && !p.iPrayed ? 1 : 0)} prayed</Text>
            </View>
          </Pressable>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cta: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: tokens.surfaceTint, marginBottom: 16 },
  ctaIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: tokens.primary, alignItems: 'center', justifyContent: 'center' },
  ctaTitle: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text },
  ctaSub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderSoft, marginBottom: 12, backgroundColor: tokens.bg },
  avt: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avtTxt: { fontFamily: fonts.uiBold, fontSize: 11, color: '#fff' },
  who: { fontFamily: fonts.uiBold, fontSize: 13, color: tokens.text },
  ago: { fontFamily: fonts.ui, fontSize: 11, color: tokens.textSecondary, marginTop: 1 },
  text: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 22, color: tokens.text, fontStyle: 'italic' },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: tokens.borderSoft, borderStyle: 'dashed' },
  amenBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: tokens.surface },
  amenBtnOn: { backgroundColor: tokens.success },
  amenBtnLocked: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: tokens.surface, opacity: 0.6 },
  amenTxt: { fontFamily: fonts.uiBold, fontSize: 12, color: tokens.text },
  count: { fontFamily: fonts.uiMedium, fontSize: 12, color: tokens.textSecondary, marginLeft: 'auto' },
  lockedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: tokens.successTint, marginBottom: 16 },
  lockedIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center' },
  lockedTxt: { flex: 1, fontFamily: fonts.ui, fontSize: 13, lineHeight: 19, color: tokens.editorialInk },
  lockedBold: { fontFamily: fonts.uiBold },
});
