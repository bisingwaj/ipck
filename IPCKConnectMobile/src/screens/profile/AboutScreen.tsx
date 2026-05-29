import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { GeoArt, ScreenContainer, TopBar } from '../../components';

export default function AboutScreen() {
  return (
    <ScreenContainer>
      <TopBar back actions={[{ icon: 'share' }]} />
      <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 18 }}>
        <GeoArt kind="verse" height={160} />
      </View>
      <Text style={styles.eyebrow}>EST. 1986</Text>
      <Text style={styles.h1}>International Protestant Church of Kinshasa</Text>
      <Text style={styles.body}>
        A multi-cultural, English-speaking Protestant church in the heart of Kinshasa. For forty years we have gathered every Sunday to worship, learn from Scripture, and serve our city — together.
      </Text>
      <Text style={[styles.body, { color: tokens.textSecondary, marginTop: 14 }]}>
        We are a community of expats, locals, students and families from every continent — held together by the gospel and grace.
      </Text>

      <View style={styles.servicesCard}>
        <Text style={styles.servicesEyebrow}>SUNDAYS</Text>
        <View style={{ flexDirection: 'row', gap: 28, marginTop: 6 }}>
          <View>
            <Text style={styles.servicesTime}>9:00 AM</Text>
            <Text style={styles.servicesLabel}>Family service</Text>
          </View>
          <View>
            <Text style={styles.servicesTime}>11:00 AM</Text>
            <Text style={styles.servicesLabel}>Main service</Text>
          </View>
        </View>
      </View>

      <Text style={styles.section}>FOLLOW IPCK</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {['Facebook', 'Instagram', 'YouTube'].map(s => (
          <Pressable key={s} style={styles.social}>
            <Text style={styles.socialTxt}>{s}</Text>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary },
  h1: { fontFamily: fonts.serifBold, fontSize: 30, lineHeight: 36, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 6 },
  body: { fontFamily: fonts.serifMed, fontSize: 16, lineHeight: 26, color: tokens.text, marginTop: 14 },
  servicesCard: { padding: 18, borderRadius: 14, backgroundColor: tokens.surfaceTint, marginTop: 24 },
  servicesEyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary },
  servicesTime: { fontFamily: fonts.serifBold, fontSize: 22, color: tokens.editorialInk, letterSpacing: -0.3 },
  servicesLabel: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginTop: 24, marginBottom: 10 },
  social: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: tokens.border, alignItems: 'center' },
  socialTxt: { fontFamily: fonts.uiBold, fontSize: 12, color: tokens.text },
});
