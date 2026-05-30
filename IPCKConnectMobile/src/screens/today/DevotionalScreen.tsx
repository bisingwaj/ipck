import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, TopBar } from '../../components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTodayDevotional } from '../../api/hooks';

type Section = 'read' | 'prayer' | 'apply';

const TABS: { id: Section; label: string }[] = [
  { id: 'read',   label: 'Read' },
  { id: 'prayer', label: 'Pray' },
  { id: 'apply',  label: 'Apply' },
];

export default function DevotionalScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const todayDevotional = useTodayDevotional();
  const [section, setSection] = useState<Section>('read');
  const [doneApply, setDoneApply] = useState<number[]>([]);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <TopBar
        back
        actions={[
          { icon: 'translate', onPress: () => {} },
          { icon: 'share', onPress: () => {} },
          { icon: 'bookmark', onPress: () => {} },
        ]}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.date}>{todayDevotional.date}</Text>
        <Text style={styles.title}>{todayDevotional.title}</Text>

        <View style={styles.verseBlock}>
          <Text style={styles.verse}>{todayDevotional.verseText}</Text>
          <Text style={styles.verseRef}>{todayDevotional.verseRef.toUpperCase()}</Text>
        </View>

        {/* Section switcher — three small steps for the day */}
        <View style={styles.steps}>
          {TABS.map((t, i) => {
            const on = section === t.id;
            return (
              <Pressable key={t.id} onPress={() => setSection(t.id)} style={[styles.step, on && styles.stepOn]}>
                <Text style={[styles.stepNum, on && { color: tokens.primary }]}>0{i + 1}</Text>
                <Text style={[styles.stepLabel, on && { color: tokens.editorialInk, fontFamily: fonts.uiBold }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {section === 'read' && (
          <>
            <Text style={styles.body}>{todayDevotional.body}</Text>
            <View style={styles.reflection}>
              <Text style={styles.reflectionEyebrow}>A QUESTION FOR TODAY</Text>
              <Text style={styles.reflectionBody}>
                Where in your life right now is the wait the hardest? What would it look like to trust God there?
              </Text>
            </View>
          </>
        )}

        {section === 'prayer' && (
          <View>
            <View style={styles.prayerEyebrowRow}>
              <Icon name="pray" size={16} color={tokens.primary}/>
              <Text style={styles.eyebrow}>A PRAYER TO PRAY TODAY</Text>
            </View>
            <Text style={styles.prayer}>{todayDevotional.prayer}</Text>

            <View style={styles.divider}/>

            <Text style={styles.subhead}>Pray with us</Text>
            <Text style={styles.subbody}>
              You can read this prayer out loud, slowly. Pause where it lands. There is no rush.
            </Text>
          </View>
        )}

        {section === 'apply' && (
          <View>
            <View style={styles.prayerEyebrowRow}>
              <Icon name="sparkle" size={16} color={tokens.accent}/>
              <Text style={styles.eyebrow}>{todayDevotional.applyTitle.toUpperCase()}</Text>
            </View>
            <Text style={styles.subbody}>
              Three small things you can do before the day ends.
            </Text>

            <View style={{ marginTop: 18, gap: 10 }}>
              {todayDevotional.applySteps.map((step, i) => {
                const done = doneApply.includes(i);
                return (
                  <Pressable
                    key={i}
                    onPress={() => setDoneApply(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i])}
                    style={[styles.applyRow, done && styles.applyRowDone]}
                  >
                    <View style={[styles.applyCheck, done && styles.applyCheckOn]}>
                      {done && <Icon name="check" size={14} color="#fff" strokeWidth={3}/>}
                    </View>
                    <Text style={[styles.applyTxt, done && styles.applyTxtDone]}>{step}</Text>
                  </Pressable>
                );
              })}
            </View>

            {doneApply.length === todayDevotional.applySteps.length && (
              <View style={styles.allDone}>
                <Icon name="check" size={20} color={tokens.success} strokeWidth={2.5}/>
                <Text style={styles.allDoneTxt}>You walked all three. Carry it into tomorrow.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Button fullWidth leftIcon="pray" onPress={() => nav.navigate('Prayed')}>
          {section === 'apply' ? "I'll walk this today" : section === 'prayer' ? 'Amen — I prayed' : 'I prayed today'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  date: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginTop: 8 },
  title: { fontFamily: fonts.serifBold, fontSize: 34, lineHeight: 40, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 12 },
  verseBlock: { borderLeftWidth: 3, borderLeftColor: tokens.primary, paddingLeft: 16, marginTop: 28 },
  verse: { fontFamily: fonts.serifItalic, fontSize: 19, lineHeight: 28, color: tokens.editorialInk },
  verseRef: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.2, color: tokens.textSecondary, marginTop: 14 },

  steps: { flexDirection: 'row', gap: 8, marginTop: 32, marginBottom: 8 },
  step: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: tokens.border, backgroundColor: tokens.bg },
  stepOn: { borderColor: tokens.primary, backgroundColor: tokens.primaryTint },
  stepNum: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.4, color: tokens.textSecondary },
  stepLabel: { fontFamily: fonts.uiMedium, fontSize: 15, color: tokens.text, marginTop: 4 },

  body: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 28, color: tokens.text, marginTop: 22 },
  reflection: { marginTop: 28, padding: 18, borderRadius: 14, backgroundColor: tokens.surfaceTint },
  reflectionEyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary, marginBottom: 8 },
  reflectionBody: { fontFamily: fonts.serifMed, fontSize: 17, lineHeight: 26, color: tokens.editorialInk },

  prayerEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22 },
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary },
  prayer: { fontFamily: fonts.serifItalic, fontSize: 19, lineHeight: 30, color: tokens.editorialInk, marginTop: 14 },
  divider: { height: 1, backgroundColor: tokens.borderSoft, marginVertical: 26 },
  subhead: { fontFamily: fonts.serifMed, fontSize: 18, color: tokens.editorialInk },
  subbody: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 22, color: tokens.textSecondary, marginTop: 8 },

  applyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: tokens.borderSoft, backgroundColor: tokens.bg },
  applyRowDone: { backgroundColor: tokens.successTint, borderColor: tokens.successTint },
  applyCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: tokens.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  applyCheckOn: { backgroundColor: tokens.success, borderColor: tokens.success },
  applyTxt: { flex: 1, fontFamily: fonts.serifMed, fontSize: 16, lineHeight: 24, color: tokens.text },
  applyTxtDone: { color: tokens.textSecondary, textDecorationLine: 'line-through' as any },
  allDone: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, backgroundColor: tokens.successTint, marginTop: 18 },
  allDoneTxt: { flex: 1, fontFamily: fonts.serifMed, fontSize: 14, lineHeight: 20, color: tokens.success },

  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: tokens.bg, borderTopWidth: 1, borderTopColor: tokens.borderSoft },
});
