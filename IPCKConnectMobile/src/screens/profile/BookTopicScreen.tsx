import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, ScreenContainer, TopBar } from '../../components';

const TOPICS = [
  { id: 'counseling', t: 'Counseling',          d: 'Pastoral conversation about life, relationships, faith.' },
  { id: 'prayer',     t: 'Prayer',               d: 'Pray together about a specific need.' },
  { id: 'marriage',   t: 'Marriage / family',    d: 'Pre-marital, marriage, or family conversation.' },
  { id: 'baptism',    t: 'Baptism',              d: "Discuss baptism — yours or your child's." },
  { id: 'general',    t: 'General',              d: "Doesn't fit a category — we'll route it." },
];

export default function BookTopicScreen() {
  const nav = useNavigation<any>();
  const [topic, setTopic] = useState('counseling');
  return (
    <ScreenContainer
      footer={<Button fullWidth onPress={() => nav.navigate('BookSlot')}>Continue</Button>}
    >
      <TopBar back title="Step 1 of 3" />
      <View style={styles.progress}>
        {[1,2,3].map(i => <View key={i} style={[styles.bar, i === 1 && styles.barOn]} />)}
      </View>
      <Text style={styles.h1}>What is this about?</Text>

      <View style={{ marginTop: 22, gap: 10 }}>
        {TOPICS.map(t => {
          const on = topic === t.id;
          return (
            <Pressable key={t.id} onPress={() => setTopic(t.id)} style={[styles.row, on && styles.rowOn]}>
              <View style={[styles.radio, on && { borderColor: tokens.primary }]}>
                {on && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, on && { color: tokens.primary }]} numberOfLines={1} ellipsizeMode="tail">{t.t}</Text>
                <Text style={styles.rowSub} numberOfLines={2} ellipsizeMode="tail">{t.d}</Text>
              </View>
            </Pressable>
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
  h1: { fontFamily: fonts.serifBold, fontSize: 24, color: tokens.editorialInk, letterSpacing: -0.4, marginTop: 18 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: tokens.border },
  rowOn: { borderColor: tokens.primary, backgroundColor: tokens.primaryTint },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: tokens.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: tokens.primary },
  rowTitle: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text },
  rowSub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2, lineHeight: 18 },
});
