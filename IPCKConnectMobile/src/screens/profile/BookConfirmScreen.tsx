import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer, toast, TopBar } from '../../components';
import { useCreateAppointment } from '../../api/mutations';
import { useAuth } from '../../auth/AuthContext';
import { apptWhen } from '../../api/format';
import { apiMessage } from '../../api/errors';
import { RootStackParamList } from '../../navigation/types';

export default function BookConfirmScreen() {
  const nav = useNavigation<any>();
  const { topicId, topicLabel, slotStart } = useRoute<RouteProp<RootStackParamList, 'BookConfirm'>>().params;
  const { user } = useAuth();
  const createAppt = useCreateAppointment();
  const [notes, setNotes] = useState('');

  const ROWS: [string, string][] = [
    ['Topic',      topicLabel],
    ['With',       'The pastoral team'],
    ['When',       apptWhen(slotStart)],
    ['Where',      "Pastor's office, IPCK"],
    ['Your phone', user?.phone ?? '—'],
  ];

  const onConfirm = async () => {
    try {
      await createAppt.mutateAsync({ topicId, slotStart, notes: notes.trim() || undefined });
      nav.replace('BookSuccess', { slotStart, topicLabel });
    } catch (e) {
      toast.error('Booking did not go through', apiMessage(e));
    }
  };

  return (
    <ScreenContainer
      footer={<Button fullWidth disabled={createAppt.isPending} onPress={onConfirm}>Confirm appointment</Button>}
    >
      <TopBar back title="Step 3 of 3" />
      <View style={styles.progress}>
        {[1,2,3].map(i => <View key={i} style={[styles.bar, styles.barOn]} />)}
      </View>
      <Text style={styles.h1}>Confirm appointment</Text>

      <View style={styles.summary}>
        {ROWS.map(([l, v]) => (
          <View key={l} style={styles.row}>
            <Text style={styles.lbl}>{l}</Text>
            <Text style={styles.val} numberOfLines={1} ellipsizeMode="tail">{v}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.fieldLbl}>A SHORT NOTE (OPTIONAL)</Text>
      <TextInput value={notes} onChangeText={setNotes} multiline placeholder="Anything Pastor should know in advance?" style={styles.textarea} placeholderTextColor={tokens.textTertiary} />

      <View style={styles.privacy}>
        <Icon name="lock" size={14} color={tokens.textSecondary} />
        <Text style={styles.privacyTxt}>What you share here is held in confidence by the pastoral team.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: 4, marginTop: 8 },
  bar: { flex: 1, height: 3, borderRadius: 99, backgroundColor: tokens.surface },
  barOn: { backgroundColor: tokens.primary },
  h1: { fontFamily: fonts.serifBold, fontSize: 24, color: tokens.editorialInk, letterSpacing: -0.4, marginTop: 18 },
  summary: { padding: 16, borderRadius: 14, backgroundColor: tokens.surface, marginTop: 18, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  lbl: { fontFamily: fonts.ui, fontSize: 13, color: tokens.textSecondary },
  val: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text },
  fieldLbl: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1, color: tokens.textSecondary, marginTop: 20, marginBottom: 8 },
  textarea: { minHeight: 100, padding: 14, borderRadius: 12, backgroundColor: tokens.surface, fontFamily: fonts.ui, fontSize: 14, color: tokens.text, textAlignVertical: 'top' },
  privacy: { flexDirection: 'row', gap: 8, marginTop: 14, padding: 12, borderRadius: 10, backgroundColor: tokens.surface, alignItems: 'flex-start' },
  privacyTxt: { flex: 1, fontFamily: fonts.ui, fontSize: 12, lineHeight: 18, color: tokens.textSecondary },
});
