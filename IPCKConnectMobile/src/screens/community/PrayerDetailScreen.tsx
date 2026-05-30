import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, ScreenContainer, TopBar, Pill, Button } from '../../components';
import { usePrayerWall } from '../../api/hooks';

export default function PrayerDetailScreen() {
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const prayerWall = usePrayerWall();
  const p = prayerWall.find(x => x.id === route.params?.id) || prayerWall[0];
  const [reply, setReply] = useState('');
  const [did, setDid] = useState(p.iPrayed);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <TopBar back title="Prayer request" actions={[{ icon: 'flag' }]} />
      <View style={{ flex: 1, padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <View style={[styles.avt, { backgroundColor: p.color }]}>
            <Text style={styles.avtTxt}>{p.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.who} numberOfLines={1} ellipsizeMode="tail">{p.who}</Text>
            <Text style={styles.ago} numberOfLines={1}>{p.ago} ago</Text>
          </View>
          {p.visibility === 'anon' && <Pill tone="muted">ANONYMOUS</Pill>}
        </View>

        <Text style={styles.text}>"{p.text}"</Text>

        <Pressable onPress={() => setDid(d => !d)} style={[styles.bigBtn, did && { backgroundColor: tokens.success }]}>
          <Icon name="pray" size={20} color={did ? '#fff' : tokens.primary} />
          <Text style={[styles.bigBtnTxt, did && { color: '#fff' }]}>{did ? 'You prayed for this' : 'I\'m praying'}</Text>
        </Pressable>

        <Text style={styles.amen}><Text style={styles.amenNum}>{p.amen + (did && !p.iPrayed ? 1 : 0)}</Text> people prayed</Text>

        <Text style={styles.section}>WORDS OF ENCOURAGEMENT</Text>
        <View style={styles.reply}>
          <View style={[styles.miniAvt, { backgroundColor: '#FFB020' }]}><Text style={styles.miniAvtTxt}>EM</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.replyWho} numberOfLines={1} ellipsizeMode="tail">Esther M.</Text>
            <Text style={styles.replyTxt}>Standing with you in this. He is faithful.</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput value={reply} onChangeText={setReply} placeholder="A word of encouragement…" style={styles.input} placeholderTextColor={tokens.textTertiary} />
          <Pressable style={styles.send}><Icon name="send" size={18} color="#fff" /></Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  avt: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avtTxt: { fontFamily: fonts.uiBold, fontSize: 14, color: '#fff' },
  who: { fontFamily: fonts.uiBold, fontSize: 16, color: tokens.text },
  ago: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
  text: { fontFamily: fonts.serifItalic, fontSize: 19, lineHeight: 28, color: tokens.editorialInk, marginVertical: 14 },
  bigBtn: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 14, backgroundColor: tokens.primaryTint, marginTop: 14 },
  bigBtnTxt: { fontFamily: fonts.uiBold, fontSize: 16, color: tokens.primary },
  amen: { fontFamily: fonts.ui, fontSize: 13, color: tokens.textSecondary, textAlign: 'center', marginTop: 10 },
  amenNum: { fontFamily: fonts.uiBold, color: tokens.text },
  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginTop: 28, marginBottom: 12 },
  reply: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, backgroundColor: tokens.surface },
  miniAvt: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  miniAvtTxt: { fontFamily: fonts.uiBold, fontSize: 11, color: '#fff' },
  replyWho: { fontFamily: fonts.uiBold, fontSize: 13, color: tokens.text },
  replyTxt: { fontFamily: fonts.serif, fontSize: 14, color: tokens.text, marginTop: 2 },
  composer: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: tokens.borderSoft, backgroundColor: tokens.bg },
  input: { flex: 1, backgroundColor: tokens.surface, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 99, fontFamily: fonts.ui, fontSize: 14, color: tokens.text },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: tokens.primary, alignItems: 'center', justifyContent: 'center' },
});
