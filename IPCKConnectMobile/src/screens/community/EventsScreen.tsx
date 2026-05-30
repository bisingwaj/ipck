import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, ScreenContainer, TopBar } from '../../components';
import { useEvents } from '../../api/hooks';

export default function EventsScreen() {
  const nav = useNavigation<any>();
  const events = useEvents();
  return (
    <ScreenContainer>
      <TopBar back title="Events" actions={[{ icon: 'cal' }]} />
      {events.map(e => (
        <Pressable key={e.id} onPress={() => nav.navigate('EventDetail', { id: e.id })} style={styles.row}>
          <View style={[styles.date, { backgroundColor: e.color + '22' }]}>
            <Text style={[styles.day, { color: e.color }]}>{e.when.match(/\d+/)?.[0]}</Text>
            <Text style={[styles.month, { color: e.color }]}>{e.when.split(' ')[2]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">{e.name}</Text>
            <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">{e.when.split('·')[1]?.trim()}</Text>
            <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">{e.loc} · {e.rsvp}{e.cap ? ` / ${e.cap}` : ''} RSVP</Text>
          </View>
          <Icon name="chevron" size={18} color={tokens.textTertiary} />
        </Pressable>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: tokens.borderSoft },
  date: { width: 64, height: 64, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  day: { fontFamily: fonts.serifBold, fontSize: 24 },
  month: { fontFamily: fonts.uiBold, fontSize: 10, letterSpacing: 1, marginTop: 2 },
  name: { fontFamily: fonts.uiBold, fontSize: 15, color: tokens.text },
  meta: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
});
