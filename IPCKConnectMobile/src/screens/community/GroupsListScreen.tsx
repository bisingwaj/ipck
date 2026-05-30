import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, ScreenContainer, TopBar } from '../../components';
import { useAllGroups, useMyGroups } from '../../api/hooks';

export default function GroupsListScreen() {
  const nav = useNavigation<any>();
  const allGroups = useAllGroups();
  const myGroups = useMyGroups();
  const [tab, setTab] = useState<'mine' | 'discover'>('mine');
  const list = tab === 'mine' ? myGroups : allGroups.filter(g => !myGroups.find(m => m.id === g.id));

  return (
    <ScreenContainer>
      <TopBar back title="Groups" actions={[{ icon: 'search' }]} />
      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('mine')} style={[styles.tab, tab === 'mine' && styles.tabOn]}>
          <Text style={[styles.tabTxt, tab === 'mine' && styles.tabTxtOn]}>My groups</Text>
        </Pressable>
        <Pressable onPress={() => setTab('discover')} style={[styles.tab, tab === 'discover' && styles.tabOn]}>
          <Text style={[styles.tabTxt, tab === 'discover' && styles.tabTxtOn]}>Discover</Text>
        </Pressable>
      </View>

      {list.map(g => (
        <Pressable key={g.id} onPress={() => nav.navigate('GroupDetail', { id: g.id })} style={styles.row}>
          <View style={[styles.avt, { backgroundColor: g.color }]}>
            <Icon name="community" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{g.name}</Text>
            <Text style={styles.meta}>{g.members} members · {g.meets}</Text>
          </View>
          {tab === 'discover' && <View style={styles.joinBtn}><Text style={styles.joinTxt}>Join</Text></View>}
          {tab === 'mine' && <Icon name="chevron" size={18} color={tokens.textTertiary} />}
        </Pressable>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 99, backgroundColor: tokens.surface, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 99 },
  tabOn: { backgroundColor: tokens.bg },
  tabTxt: { fontFamily: fonts.uiBold, fontSize: 13, color: tokens.textSecondary },
  tabTxtOn: { color: tokens.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: tokens.borderSoft },
  avt: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.uiBold, fontSize: 15, color: tokens.text },
  meta: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
  joinBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, backgroundColor: tokens.primaryTint },
  joinTxt: { fontFamily: fonts.uiBold, fontSize: 12, color: tokens.primary },
});
