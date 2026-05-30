import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, ScreenContainer, TopBar, Pill } from '../../components';
import { usePrayerWall } from '../../api/hooks';

export default function PrayerWallScreen() {
  const nav = useNavigation<any>();
  const prayerWall = usePrayerWall();
  const [prayed, setPrayed] = useState<string[]>(prayerWall.filter(p => p.iPrayed).map(p => p.id));
  const toggle = (id: string) => setPrayed(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <ScreenContainer>
      <TopBar back title="Prayer wall" actions={[{ icon: 'filter' }]} />

      <Pressable onPress={() => nav.navigate('SubmitPrayer')} style={styles.cta}>
        <View style={styles.ctaIcon}><Icon name="plus" size={20} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaTitle}>Share a prayer request</Text>
          <Text style={styles.ctaSub}>Publicly, anonymously, or privately to the pastor</Text>
        </View>
        <Icon name="chevron" size={18} color={tokens.textTertiary} />
      </Pressable>

      {prayerWall.map(p => {
        const did = prayed.includes(p.id);
        return (
          <Pressable key={p.id} onPress={() => nav.navigate('PrayerDetail', { id: p.id })} style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View style={[styles.avt, { backgroundColor: p.color }]}>
                <Text style={styles.avtTxt}>{p.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.who}>{p.who}</Text>
                <Text style={styles.ago}>{p.ago} ago</Text>
              </View>
              {p.visibility === 'anon' && <Pill tone="muted">ANONYMOUS</Pill>}
            </View>
            <Text style={styles.text}>{p.text}</Text>
            <View style={styles.cardFoot}>
              <Pressable onPress={() => toggle(p.id)} style={[styles.amenBtn, did && styles.amenBtnOn]}>
                <Icon name="pray" size={14} color={did ? '#fff' : tokens.text} />
                <Text style={[styles.amenTxt, did && { color: '#fff' }]}>{did ? 'You prayed' : 'I\'ll pray'}</Text>
              </Pressable>
              <Text style={styles.count}>{p.amen + (did && !p.iPrayed ? 1 : 0)} prayed</Text>
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
  amenBtnOn: { backgroundColor: tokens.primary },
  amenTxt: { fontFamily: fonts.uiBold, fontSize: 12, color: tokens.text },
  count: { fontFamily: fonts.uiMedium, fontSize: 12, color: tokens.textSecondary, marginLeft: 'auto' },
});
