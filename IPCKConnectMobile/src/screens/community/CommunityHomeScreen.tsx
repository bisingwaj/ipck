import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, ScreenContainer, TopBar, Pill } from '../../components';
import { useMyGroups, usePrayerWall, useEvents } from '../../api/hooks';

export default function CommunityHomeScreen() {
  const nav = useNavigation<any>();
  const myGroups = useMyGroups();
  const prayerWall = usePrayerWall();
  const events = useEvents();
  return (
    <ScreenContainer>
      <TopBar
        titleLarge="Community"
        actions={[{ icon: 'search', onPress: () => {} }]}
      />

      {/* My groups */}
      <View style={styles.sectionHead}>
        <Text style={styles.section}>YOUR GROUPS</Text>
        <Pressable onPress={() => nav.navigate('GroupsList')}><Text style={styles.seeAll}>See all</Text></Pressable>
      </View>

      {myGroups.map(g => (
        <Pressable key={g.id} onPress={() => nav.navigate('GroupChat', { id: g.id })} style={styles.groupRow}>
          <View style={[styles.groupAvt, { backgroundColor: g.color }]}>
            <Icon name="community" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={styles.groupName} numberOfLines={1} ellipsizeMode="tail">{g.name}</Text>
              {g.unread > 0 && <View style={[styles.unreadDot, { flexShrink: 0 }]}><Text style={styles.unreadTxt}>{g.unread}</Text></View>}
            </View>
            <Text style={styles.groupLast} numberOfLines={1}>{g.lastMessage}</Text>
          </View>
        </Pressable>
      ))}

      {/* Prayer wall */}
      <Pressable onPress={() => nav.navigate('PrayerWall')} style={styles.prayerCard}>
        <View style={styles.prayerIcon}><Icon name="pray" size={24} color={tokens.accent} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.prayerTitle} numberOfLines={1} ellipsizeMode="tail">Prayer wall</Text>
          <Text style={styles.prayerSub} numberOfLines={2} ellipsizeMode="tail">{prayerWall.length} requests · pray with your church family</Text>
        </View>
        <Icon name="chevron" size={18} color={tokens.textTertiary} />
      </Pressable>

      {/* Upcoming events */}
      <View style={styles.sectionHead}>
        <Text style={styles.section}>UPCOMING EVENTS</Text>
        <Pressable onPress={() => nav.navigate('Events')}><Text style={styles.seeAll}>See all</Text></Pressable>
      </View>

      {events.slice(0, 2).map(e => (
        <Pressable key={e.id} onPress={() => nav.navigate('EventDetail', { id: e.id })} style={styles.eventRow}>
          <View style={[styles.eventDate, { backgroundColor: e.color + '22' }]}>
            <Text style={[styles.eventDay, { color: e.color }]}>{e.when.match(/\d+/)?.[0]}</Text>
            <Text style={[styles.eventMonth, { color: e.color }]}>{e.when.split(' ')[2]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventName} numberOfLines={1} ellipsizeMode="tail">{e.name}</Text>
            <Text style={styles.eventMeta} numberOfLines={1} ellipsizeMode="tail">{e.when.split('·')[1]?.trim()} · {e.loc}</Text>
          </View>
        </Pressable>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 10 },
  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary },
  seeAll: { fontFamily: fonts.uiBold, fontSize: 12, color: tokens.primary },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  groupAvt: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  groupName: { fontFamily: fonts.uiBold, fontSize: 15, color: tokens.text, flexShrink: 1 },
  groupLast: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
  unreadDot: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 99, backgroundColor: tokens.primary, minWidth: 18, alignItems: 'center' },
  unreadTxt: { fontFamily: fonts.uiBold, fontSize: 10, color: '#fff' },
  prayerCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, backgroundColor: tokens.accentTint, marginTop: 8 },
  prayerIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  prayerTitle: { fontFamily: fonts.uiBold, fontSize: 16, color: tokens.editorialInk },
  prayerSub: { fontFamily: fonts.ui, fontSize: 12, color: '#806014', marginTop: 2 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  eventDate: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  eventDay: { fontFamily: fonts.serifBold, fontSize: 22 },
  eventMonth: { fontFamily: fonts.uiBold, fontSize: 9, letterSpacing: 1, marginTop: 2 },
  eventName: { fontFamily: fonts.uiBold, fontSize: 15, color: tokens.text },
  eventMeta: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
});
