import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer, TopBar } from '../../components';

export default function ContactScreen() {
  const nav = useNavigation<any>();
  return (
    <ScreenContainer>
      <TopBar back title="Contact" />

      <Pressable style={styles.primary}>
        <View style={styles.primaryIcon}><Icon name="phone" size={20} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.primaryTitle}>Call the office</Text>
          <Text style={styles.primarySub}>+243 82 354 9260</Text>
        </View>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <Pressable style={styles.secondary}>
          <View style={[styles.secondaryIcon, { backgroundColor: '#25D366' }]}><Icon name="whatsapp" size={18} color="#fff" /></View>
          <Text style={styles.secondaryTitle}>WhatsApp</Text>
          <Text style={styles.secondarySub}>Office line</Text>
        </Pressable>
        <Pressable style={styles.secondary}>
          <View style={[styles.secondaryIcon, { backgroundColor: tokens.primary }]}><Icon name="mail" size={18} color="#fff" /></View>
          <Text style={styles.secondaryTitle}>Email</Text>
          <Text style={styles.secondarySub}>office@ipck.org</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => nav.navigate('BookTopic')} style={styles.book}>
        <View style={styles.bookIcon}><Icon name="cal" size={20} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bookTitle}>Book with the pastor</Text>
          <Text style={styles.bookSub}>Counseling, prayer, marriage…</Text>
        </View>
        <Icon name="chevron" size={18} color="#806014" />
      </Pressable>

      <View style={styles.hours}>
        <Text style={styles.hoursTitle}>Office hours</Text>
        <Text style={styles.hoursSub}>Tue–Fri · 9 AM – 2 PM</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  primary: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 14, backgroundColor: tokens.primary, marginTop: 8 },
  primaryIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  primaryTitle: { fontFamily: fonts.uiBold, fontSize: 15, color: '#fff' },
  primarySub: { fontFamily: fonts.mono, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  secondary: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: tokens.border, gap: 6 },
  secondaryIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  secondaryTitle: { fontFamily: fonts.uiBold, fontSize: 13, color: tokens.text, marginTop: 4 },
  secondarySub: { fontFamily: fonts.ui, fontSize: 11, color: tokens.textSecondary },
  book: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, backgroundColor: tokens.accentTint, marginTop: 16 },
  bookIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: tokens.accent, alignItems: 'center', justifyContent: 'center' },
  bookTitle: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.editorialInk },
  bookSub: { fontFamily: fonts.ui, fontSize: 11, color: '#806014', marginTop: 2 },
  hours: { padding: 14, borderRadius: 10, backgroundColor: tokens.surface, marginTop: 16 },
  hoursTitle: { fontFamily: fonts.uiBold, fontSize: 13, color: tokens.text },
  hoursSub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 4 },
});
