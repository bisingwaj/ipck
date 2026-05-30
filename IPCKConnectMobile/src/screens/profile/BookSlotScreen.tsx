import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, ScreenContainer, TopBar } from '../../components';
import { useAppointmentSlots, ApptDay } from '../../api/hooks';
import { RootStackParamList } from '../../navigation/types';

/** Créneaux de secours (mode mocks / backend vide) : prochains jours ouvrés. */
function buildFallbackDays(): ApptDay[] {
  const out: ApptDay[] = [];
  const base = new Date();
  let added = 0;
  for (let offset = 1; offset < 14 && added < 4; offset++) {
    const d = new Date(base);
    d.setDate(d.getDate() + offset);
    if (d.getDay() === 0) continue;
    const slots = [10, 14, 16].map(h => {
      const s = new Date(d);
      s.setHours(h, 0, 0, 0);
      return { start: s.toISOString(), available: true };
    });
    out.push({ day: d.toISOString().slice(0, 10), slots });
    added++;
  }
  return out;
}

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export default function BookSlotScreen() {
  const nav = useNavigation<any>();
  const { topicId, topicLabel } = useRoute<RouteProp<RootStackParamList, 'BookSlot'>>().params;
  const backendDays = useAppointmentSlots();
  const fallback = useMemo(() => buildFallbackDays(), []);
  const days = backendDays.length ? backendDays : fallback;
  const [slotStart, setSlotStart] = useState('');

  // Présélectionne le premier créneau disponible.
  useEffect(() => {
    if (slotStart) return;
    for (const d of days) {
      const a = d.slots.find(s => s.available);
      if (a) { setSlotStart(a.start); return; }
    }
  }, [days, slotStart]);

  return (
    <ScreenContainer
      footer={<Button fullWidth disabled={!slotStart} onPress={() => nav.navigate('BookConfirm', { topicId, topicLabel, slotStart })}>Continue</Button>}
    >
      <TopBar back title="Step 2 of 3" />
      <View style={styles.progress}>
        {[1,2,3].map(i => <View key={i} style={[styles.bar, i <= 2 && styles.barOn]} />)}
      </View>
      <View style={styles.summary}>
        <Text style={styles.summaryTxt} numberOfLines={1} ellipsizeMode="tail">Booking · {topicLabel}</Text>
      </View>
      <Text style={styles.h1}>Pick a time</Text>
      <Text style={styles.sub}>With the pastoral team · next 2 weeks</Text>

      <View style={{ marginTop: 20, gap: 14 }}>
        {days.map(d => {
          const available = d.slots.filter(s => s.available);
          if (available.length === 0) return null;
          return (
            <View key={d.day}>
              <Text style={styles.day}>{dayLabel(d.day)}</Text>
              <View style={styles.slotRow}>
                {available.map(s => {
                  const on = slotStart === s.start;
                  return (
                    <Pressable key={s.start} onPress={() => setSlotStart(s.start)} style={[styles.slot, on && styles.slotOn]}>
                      <Text style={[styles.slotTxt, on && { color: '#fff' }]}>{timeLabel(s.start)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
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
