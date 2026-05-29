import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, ScreenContainer, TopBar } from '../../components';

const DAYS = [
  { d: 'Mon 26', slots: ['10:00', '14:00'] },
  { d: 'Tue 27', slots: ['09:00', '11:00', '14:00', '15:30'] },
  { d: 'Wed 28', slots: ['10:00', '14:00', '16:00'] },
  { d: 'Thu 29', slots: ['11:00'] },
];

export default function BookSlotScreen() {
  const nav = useNavigation<any>();
  const [slot, setSlot] = useState('Tue 27-14:00');

  return (
    <ScreenContainer
      footer={<Button fullWidth onPress={() => nav.navigate('BookConfirm')}>Continue</Button>}
    >
      <TopBar back title="Step 2 of 3" />
      <View style={styles.progress}>
        {[1,2,3].map(i => <View key={i} style={[styles.bar, i <= 2 && styles.barOn]} />)}
      </View>
      <View style={styles.summary}>
        <Text style={styles.summaryTxt}>Booking · Counseling</Text>
      </View>
      <Text style={styles.h1}>Pick a time</Text>
      <Text style={styles.sub}>Pastor Mukendi · this week</Text>

      <View style={{ marginTop: 20, gap: 14 }}>
        {DAYS.map(d => (
          <View key={d.d}>
            <Text style={styles.day}>{d.d}</Text>
            <View style={styles.slotRow}>
              {d.slots.map(s => {
                const id = d.d + '-' + s;
                const on = slot === id;
                return (
                  <Pressable key={s} onPress={() => setSlot(id)} style={[styles.slot, on && styles.slotOn]}>
                    <Text style={[styles.slotTxt, on && { color: '#fff' }]}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: 4, marginTop: 8 },
  bar: { flex: 1, height: 3, borderRadius: 99, backgroundColor: tokens.surface },
  barOn: { backgroundColor: tokens.primary },
  summary: { padding: 12, borderRadius: 10, backgroundColor: tokens.surface, marginTop: 14 },
  summaryTxt: { fontFamily: fonts.uiBold, fontSize: 13, color: tokens.text },
  h1: { fontFamily: fonts.serifBold, fontSize: 24, color: tokens.editorialInk, letterSpacing: -0.4, marginTop: 18 },
  sub: { fontFamily: fonts.ui, fontSize: 13, color: tokens.textSecondary, marginTop: 6 },
  day: { fontFamily: fonts.uiBold, fontSize: 13, color: tokens.text, marginBottom: 8 },
  slotRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  slot: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: tokens.border },
  slotOn: { backgroundColor: tokens.primary, borderColor: tokens.primary },
  slotTxt: { fontFamily: fonts.uiBold, fontSize: 13, color: tokens.text },
});
