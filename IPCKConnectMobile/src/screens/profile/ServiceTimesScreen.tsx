import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, ScreenContainer, TopBar } from '../../components';

const SERVICES = [
  { t: '9:00 AM',  n: 'Family service', d: 'Shorter, kid-friendly. Sunday School in parallel.' },
  { t: '11:00 AM', n: 'Main service',   d: 'Full liturgy. Young Adults gathering in parallel.' },
];

export default function ServiceTimesScreen() {
  return (
    <ScreenContainer>
      <TopBar back title="Service times" />
      {SERVICES.map((s, i) => (
        <View key={s.t} style={[styles.row, i === 0 && { borderBottomWidth: 1, borderBottomColor: tokens.borderSoft }]}>
          <View style={{ width: 96 }}>
            <Text style={styles.time}>{s.t.split(' ')[0]}</Text>
            <Text style={styles.amPm}>{s.t.split(' ')[1]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{s.n}</Text>
            <Text style={styles.desc} numberOfLines={2} ellipsizeMode="tail">{s.d}</Text>
          </View>
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
        <Button variant="secondary" leftIcon="globe" style={{ flex: 1 }}>Directions</Button>
        <Button leftIcon="bell" style={{ flex: 1 }}>Remind me</Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16, paddingVertical: 22, alignItems: 'flex-start' },
  time: { fontFamily: fonts.serifBold, fontSize: 32, color: tokens.editorialInk, letterSpacing: -0.5 },
  amPm: { fontFamily: fonts.uiBold, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
  name: { fontFamily: fonts.serifMed, fontSize: 18, color: tokens.text },
  desc: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 20, color: tokens.textSecondary, marginTop: 4 },
});
