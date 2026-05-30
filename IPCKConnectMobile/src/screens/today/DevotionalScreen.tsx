import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, toast, TopBar } from '../../components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTodayDevotional } from '../../api/hooks';
import { useMarkDevotionalRead } from '../../api/mutations';
import { apiMessage } from '../../api/errors';

type Section = 'read' | 'prayer' | 'apply';

const TABS: { id: Section; label: string }[] = [
  { id: 'read',   label: 'Read' },
  { id: 'prayer', label: 'Pray' },
  { id: 'apply',  label: 'Apply' },
];
const ORDER: Section[] = ['read', 'prayer', 'apply'];

export default function DevotionalScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const todayDevotional = useTodayDevotional();
  const [section, setSection] = useState<Section>('read');
  const [reached, setReached] = useState(0); // étape la plus avancée atteinte
  const [doneApply, setDoneApply] = useState<number[]>([]);
  const markRead = useMarkDevotionalRead();

  // Parcours séquentiel : on avance étape par étape, retour libre vers les étapes
  // déjà atteintes, mais pas de saut au-delà de la progression.
  const idx = ORDER.indexOf(section);
  const isLast = idx === ORDER.length - 1;
  const goNext = () => {
    const n = Math.min(idx + 1, ORDER.length - 1);
    setReached(r => Math.max(r, n));
    setSection(ORDER[n]);
  };
  const onBack = () => (idx > 0 ? setSection(ORDER[idx - 1]) : nav.goBack());

  const onShare = () => {
    Share.share({
      message: `${todayDevotional.title} — ${todayDevotional.verseRef}\n\n${todayDevotional.verseText}`,
    }).catch(() => {});
  };

  // Déjà validé aujourd'hui → teaching verrouillé pour la journée.
  const validated = !!todayDevotional.read;

  // Validation finale du Today's teaching → crédite la récompense d'engagement.
  const onValidate = async () => {
    try {
      const res = await markRead.mutateAsync(todayDevotional.id);
      nav.navigate('Prayed', { streakCount: res.streakCount, blessings: res.blessingsAwarded });
      if (res.blessingsAwarded > 0) {
        toast.success(
          'Well done, faithful one! 🙌',
          `You've received ${res.blessingsAwarded} Blessings for seeking the Lord today — added to your Grace Reserve. "Draw near to God, and He will draw near to you." (James 4:8)`,
        );
      }
    } catch (e) {
      toast.error('Take heart', apiMessage(e));
    }
  };

  // État verrouillé : la dévotion a déjà été validée pour la journée.
  if (validated) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg }}>
        <TopBar
          back
          actions={[
            { icon: 'share', onPress: onShare },
            { icon: 'bookmark', onPress: () => toast.success('Saved', 'Added to your favorites to revisit and be fed again.') },
          ]}
        />
        <View style={styles.doneWrap}>
          <View style={styles.doneCircle}>
            <Icon name="check" size={44} color={tokens.success} strokeWidth={2.5} />
          </View>
          <Text style={styles.doneEyebrow}>{todayDevotional.date}</Text>
          <Text style={styles.doneTitle}>Today's teaching is complete</Text>

          <View style={styles.doneVerse}>
            <Text style={styles.verse}>{todayDevotional.verseText}</Text>
            <Text style={styles.verseRef}>{todayDevotional.verseRef.toUpperCase()}</Text>
          </View>

          <View style={styles.doneBlessings}>
            <Icon name="sparkle" size={16} color={tokens.accent} />
            <Text style={styles.doneBlessingsTxt}>+10 Blessings earned today</Text>
          </View>
          <Text style={styles.doneSub}>You've read, prayed and applied it. Come back tomorrow for a new teaching.</Text>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <Button fullWidth variant="secondary" onPress={() => nav.goBack()}>Back to today</Button>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <TopBar
        back
        onBack={onBack}
        actions={[
          { icon: 'translate', onPress: () => toast.info('Coming soon', 'Translation is on its way.') },
          { icon: 'share', onPress: onShare },
          { icon: 'bookmark', onPress: () => toast.success('Saved', 'Added to your favorites to revisit and be fed again.') },
        ]}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.date}>{todayDevotional.date}</Text>
        <Text style={styles.title}>{todayDevotional.title}</Text>

        <View style={styles.verseBlock}>
          <Text style={styles.verse}>{todayDevotional.verseText}</Text>
          <Text style={styles.verseRef}>{todayDevotional.verseRef.toUpperCase()}</Text>
        </View>

        {/* Parcours en étapes — Read → Pray → Apply (séquentiel) */}
        <View style={styles.steps}>
          {TABS.map((t, i) => {
            const on = i === idx;
            const done = i < reached && i !== idx;
            return (
              <Pressable
                key={t.id}
                onPress={() => i <= reached && setSection(t.id)}
                disabled={i > reached}
                style={[styles.step, on && styles.stepOn, done && styles.stepDone]}
              >
                <View style={styles.stepNumRow}>
                  {done
                    ? <Icon name="check" size={13} color={tokens.success} strokeWidth={3} />
                    : <Text style={[styles.stepNum, on && { color: tokens.primary }]}>0{i + 1}</Text>}
                </View>
                <Text style={[styles.stepLabel, (on || done) && { color: tokens.editorialInk, fontFamily: fonts.uiBold }]}>{t.label}</Text>
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

            {/* Confirmation finale avant validation */}
            <View style={styles.confirmCard}>
              <View style={styles.confirmIcon}><Icon name="sparkle" size={18} color={tokens.accent}/></View>
              <Text style={styles.confirmTxt}>
                By validating, you confirm you've <Text style={styles.confirmBold}>read, prayed and applied</Text> today's verse.
                {' '}<Text style={styles.confirmBold}>+10 Blessings</Text> will be added to your Grace Reserve.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        {isLast ? (
          <Button fullWidth leftIcon="check" onPress={onValidate} disabled={markRead.isPending}>
            Validate today's teaching
          </Button>
        ) : (
          <Button fullWidth rightIcon="chevron" onPress={goNext}>
            {section === 'read' ? 'Continue to prayer' : 'Continue to apply'}
          </Button>
        )}
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
  stepDone: { borderColor: tokens.successTint, backgroundColor: tokens.successTint },
  stepNumRow: { height: 16, justifyContent: 'center' },
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

  confirmCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 16, borderRadius: 14, backgroundColor: tokens.accentTint, marginTop: 22 },
  confirmIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center' },
  confirmTxt: { flex: 1, fontFamily: fonts.ui, fontSize: 13.5, lineHeight: 20, color: tokens.editorialInk },
  confirmBold: { fontFamily: fonts.uiBold },

  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: tokens.bg, borderTopWidth: 1, borderTopColor: tokens.borderSoft },

  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 14 },
  doneCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: tokens.successTint, alignItems: 'center', justifyContent: 'center' },
  doneEyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginTop: 4 },
  doneTitle: { fontFamily: fonts.serifBold, fontSize: 27, lineHeight: 33, color: tokens.editorialInk, letterSpacing: -0.4, textAlign: 'center' },
  doneVerse: { borderLeftWidth: 3, borderLeftColor: tokens.primary, paddingLeft: 16, marginTop: 8, alignSelf: 'stretch' },
  doneBlessings: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 99, backgroundColor: tokens.accentTint, marginTop: 8 },
  doneBlessingsTxt: { fontFamily: fonts.uiBold, fontSize: 13, color: tokens.editorialInk },
  doneSub: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 21, color: tokens.textSecondary, textAlign: 'center', maxWidth: 300 },
});
