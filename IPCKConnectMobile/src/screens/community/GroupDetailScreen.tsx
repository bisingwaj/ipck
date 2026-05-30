import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer, toast, TopBar } from '../../components';
import { useGroup } from '../../api/hooks';
import { useJoinGroup } from '../../api/mutations';
import { apiMessage } from '../../api/errors';

export default function GroupDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;
  const group = useGroup(id);
  const join = useJoinGroup();

  if (!group) {
    return (
      <ScreenContainer>
        <TopBar back />
        <Text style={styles.meta}>Loading…</Text>
      </ScreenContainer>
    );
  }

  // isMember vaut false uniquement si le backend le dit explicitement (mock → undefined → on autorise).
  const isMember = (group as any).isMember !== false;

  const openChat = () => nav.navigate('GroupChat', { id: group.id });
  const joinThenChat = async () => {
    try {
      await join.mutateAsync(group.id);
      openChat();
    } catch (e) {
      toast.error('Take heart', apiMessage(e));
    }
  };

  return (
    <ScreenContainer>
      <TopBar back actions={[{ icon: 'dots', onPress: () => toast.info(group.name, `${group.members} members · led by ${group.leader}`) }]} />
      <View style={{ alignItems: 'center', paddingVertical: 18 }}>
        <View style={[styles.avt, { backgroundColor: group.color }]}>
          <Icon name="community" size={32} color="#fff" />
        </View>
        <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">{group.name}</Text>
        <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">{group.members} members · led by {group.leader}</Text>
      </View>

      {isMember ? (
        <Button fullWidth leftIcon="send" onPress={openChat}>Open chat</Button>
      ) : (
        <Button fullWidth leftIcon="community" disabled={join.isPending} onPress={joinThenChat}>Join to chat</Button>
      )}

      <Text style={styles.section}>ABOUT</Text>
      <View style={styles.aboutRow}><Icon name="cal" size={16} color={tokens.textSecondary} /><Text style={styles.aboutTxt}>Meets {group.meets}</Text></View>
      <View style={styles.aboutRow}><Icon name="pin" size={16} color={tokens.textSecondary} /><Text style={styles.aboutTxt}>IPCK · Main hall, Room A</Text></View>
      <View style={styles.aboutRow}><Icon name="profile" size={16} color={tokens.textSecondary} /><Text style={styles.aboutTxt}>Led by {group.leader}</Text></View>

      <Text style={styles.section}>WHAT WE DO</Text>
      <Text style={styles.about}>
        We gather weekly to study Scripture, pray for one another, and walk through life together. Our heart is to be a place where you are known and not just attended.
      </Text>

      <Text style={styles.section}>MEMBERS · {group.members}</Text>
      <View style={styles.avtRow}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={[styles.miniAvt, { backgroundColor: ['#1F6FEB','#FFB020','#1FB36A','#5B3FB8'][i % 4] }]}>
            <Text style={styles.miniAvtTxt}>{['GM','JK','PT','EM','NB','MA','BS','CL'][i]}</Text>
          </View>
        ))}
        <View style={[styles.miniAvt, { backgroundColor: tokens.surface }]}>
          <Text style={[styles.miniAvtTxt, { color: tokens.textSecondary }]}>+{group.members - 8}</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  avt: { width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  name: { fontFamily: fonts.serifBold, fontSize: 24, color: tokens.editorialInk, letterSpacing: -0.3, textAlign: 'center' },
  meta: { fontFamily: fonts.ui, fontSize: 13, color: tokens.textSecondary, marginTop: 4 },
  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginTop: 26, marginBottom: 10 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  aboutTxt: { fontFamily: fonts.ui, fontSize: 14, color: tokens.text },
  about: { fontFamily: fonts.serifMed, fontSize: 15, lineHeight: 24, color: tokens.text },
  avtRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  miniAvt: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  miniAvtTxt: { fontFamily: fonts.uiBold, fontSize: 11, color: '#fff' },
});
