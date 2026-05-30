import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, ScreenContainer, TopBar } from '../../components';

export default function MyAppointmentsScreen() {
  const nav = useNavigation<any>();
  return (
    <ScreenContainer>
      <TopBar back title="My appointments" actions={[{ icon: 'plus', onPress: () => nav.navigate('BookTopic') }]} />

      <Text style={styles.section}>UPCOMING</Text>
      <View style={styles.card}>
        <Text style={styles.when} numberOfLines={1}>TUE 27 MAY · 2:00 PM</Text>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">Counseling</Text>
        <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">with Pastor Mukendi · Pastor's office</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          <Button variant="secondary" size="sm" style={{ flex: 1 }}>Reschedule</Button>
          <Button variant="danger" size="sm" style={{ flex: 1 }}>Cancel</Button>
        </View>
      </View>

      <Text style={[styles.section, { marginTop: 24 }]}>PAST</Text>
      <View style={[styles.card, { backgroundColor: tokens.surface }]}>
        <Text style={[styles.when, { fontSize: 10 }]} numberOfLines={1}>MON 3 FEB · 10:00 AM</Text>
        <Text style={[styles.title, { fontSize: 16 }]} numberOfLines={1} ellipsizeMode="tail">Prayer</Text>
        <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">with Pastor Esther</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginBottom: 10 },
  card: { padding: 18, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderSoft },
  when: { fontFamily: fonts.mono, fontSize: 11, color: tokens.primary, letterSpacing: 1.2 },
  title: { fontFamily: fonts.serifBold, fontSize: 20, color: tokens.editorialInk, marginTop: 4 },
  meta: { fontFamily: fonts.ui, fontSize: 13, color: tokens.textSecondary, marginTop: 2 },
});
