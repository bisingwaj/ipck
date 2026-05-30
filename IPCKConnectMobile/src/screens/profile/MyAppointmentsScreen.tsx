import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, confirm, ScreenContainer, toast, TopBar } from '../../components';
import { useMyAppointments, Appointment } from '../../api/hooks';
import { useCancelAppointment } from '../../api/mutations';
import { apptWhen } from '../../api/format';
import { apiMessage } from '../../api/errors';

function pastorName(a: Appointment): string {
  if (!a.pastor) return 'the pastoral team';
  return `${a.pastor.firstName ?? ''} ${a.pastor.lastName ?? ''}`.trim() || 'the pastoral team';
}

export default function MyAppointmentsScreen() {
  const nav = useNavigation<any>();
  const appointments = useMyAppointments();
  const cancel = useCancelAppointment();

  const now = Date.now();
  const upcoming = appointments.filter(a => a.status !== 'cancelled' && new Date(a.slotStart).getTime() >= now);
  const past = appointments.filter(a => a.status === 'cancelled' || new Date(a.slotStart).getTime() < now);

  const onCancel = async (a: Appointment) => {
    const ok = await confirm({
      title: 'Cancel appointment',
      message: 'Are you sure you want to cancel this appointment?',
      confirmLabel: 'Cancel appointment',
      cancelLabel: 'Keep it',
      destructive: true,
    });
    if (!ok) return;
    try {
      await cancel.mutateAsync(a.id);
    } catch (e) {
      toast.error('Take heart', apiMessage(e));
    }
  };

  return (
    <ScreenContainer>
      <TopBar back title="My appointments" actions={[{ icon: 'plus', onPress: () => nav.navigate('BookTopic') }]} />

      <Text style={styles.section}>UPCOMING</Text>
      {upcoming.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTxt}>No upcoming appointments.</Text>
          <Button size="sm" leftIcon="plus" onPress={() => nav.navigate('BookTopic')} style={{ marginTop: 12 }}>Book one</Button>
        </View>
      ) : (
        upcoming.map(a => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.when} numberOfLines={1}>{apptWhen(a.slotStart).toUpperCase()}</Text>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{a.topic?.label ?? 'Appointment'}</Text>
            <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">with {pastorName(a)}{a.location ? ` · ${a.location}` : ''}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <Button variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => toast.info('Reschedule', 'Please cancel, then choose a new time.')}>Reschedule</Button>
              <Button variant="danger" size="sm" style={{ flex: 1 }} disabled={cancel.isPending} onPress={() => onCancel(a)}>Cancel</Button>
            </View>
          </View>
        ))
      )}

      {past.length > 0 && (
        <>
          <Text style={[styles.section, { marginTop: 24 }]}>PAST</Text>
          {past.map(a => (
            <View key={a.id} style={[styles.card, { backgroundColor: tokens.surface }]}>
              <Text style={[styles.when, { fontSize: 10 }]} numberOfLines={1}>{apptWhen(a.slotStart).toUpperCase()}</Text>
              <Text style={[styles.title, { fontSize: 16 }]} numberOfLines={1} ellipsizeMode="tail">{a.topic?.label ?? 'Appointment'}{a.status === 'cancelled' ? ' · cancelled' : ''}</Text>
              <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">with {pastorName(a)}</Text>
            </View>
          ))}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginBottom: 10 },
  empty: { padding: 18, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderSoft, alignItems: 'flex-start' },
  emptyTxt: { fontFamily: fonts.ui, fontSize: 14, color: tokens.textSecondary },
  card: { padding: 18, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderSoft, marginBottom: 12 },
  when: { fontFamily: fonts.mono, fontSize: 11, color: tokens.primary, letterSpacing: 1.2 },
  title: { fontFamily: fonts.serifBold, fontSize: 20, color: tokens.editorialInk, marginTop: 4 },
  meta: { fontFamily: fonts.ui, fontSize: 13, color: tokens.textSecondary, marginTop: 2 },
});
