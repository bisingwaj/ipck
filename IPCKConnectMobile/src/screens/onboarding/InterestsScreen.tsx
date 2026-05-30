import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer, toast, TopBar } from '../../components';
import { useUpdateInterests } from '../../api/mutations';
import { apiMessage } from '../../api/errors';

const TOPICS = [
  'Daily teaching', 'Worship', 'Prayer', 'Marriage & family',
  'Singleness', 'Suffering & loss', 'Money', 'Work & calling',
  'Parenting', 'Race & justice', 'Doubt', 'Mission',
];

export default function InterestsScreen() {
  const nav = useNavigation<any>();
  const [picked, setPicked] = useState<string[]>(['Daily teaching']);
  const toggle = (t: string) => setPicked(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  const updateInterests = useUpdateInterests();

  const onContinue = async () => {
    try {
      await updateInterests.mutateAsync(picked);
      nav.navigate('NotifPermission');
    } catch (e) {
      toast.error('Take heart', apiMessage(e));
    }
  };

  return (
    <ScreenContainer
      footer={<Button fullWidth disabled={updateInterests.isPending} onPress={onContinue}>{picked.length ? `Continue (${picked.length})` : 'Skip'}</Button>}
    >
      <TopBar back />
      <Text style={styles.eyebrow}>4 OF 4 · INTERESTS</Text>
      <Text style={styles.h1}>What would you like more of?</Text>
      <Text style={styles.body}>Pick a few — we'll feature these in your daily devotional. You can change this anytime.</Text>

      <View style={styles.chips}>
        {TOPICS.map(t => {
          const on = picked.includes(t);
          return (
            <Pressable key={t} onPress={() => toggle(t)} style={[styles.chip, on && styles.chipOn]}>
              {on && <Icon name="check" size={14} color={tokens.primary} strokeWidth={2.5} />}
              <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary, marginTop: 16 },
  h1: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 8 },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: tokens.textSecondary, marginTop: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24 },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1.5, borderColor: tokens.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipOn: { borderColor: tokens.primary, backgroundColor: tokens.primaryTint },
  chipTxt: { fontFamily: fonts.uiMedium, fontSize: 14, color: tokens.text },
  chipTxtOn: { color: tokens.primary, fontFamily: fonts.uiBold },
});
