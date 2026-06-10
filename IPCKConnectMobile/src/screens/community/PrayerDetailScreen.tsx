import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, ScreenContainer, toast, TopBar, Pill } from '../../components';
import { usePrayer, usePrayerWall } from '../../api/hooks';
import { usePrayForRequest, useCreateEncouragement } from '../../api/mutations';
import { colorFor } from '../../api/format';
import { USE_MOCKS } from '../../api/config';
import { useAuth } from '../../auth/AuthContext';

interface Encouragement { who: string; initials: string; text: string }

export default function PrayerDetailScreen() {
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const p = usePrayer(route.params?.id);
  const wall = usePrayerWall();
  const pray = usePrayForRequest();
  const encourage = useCreateEncouragement(route.params?.id);

  const [reply, setReply] = useState('');
  const [prayed, setPrayed] = useState(false);
  const [count, setCount] = useState(0);
  const [encouragements, setEncouragements] = useState<Encouragement[]>([]);
  const seeded = useRef(false);

  // Initialise l'état prié + le compteur + les encouragements depuis la prière, une seule fois.
  useEffect(() => {
    if (p && !seeded.current) {
      setPrayed(!!p.iPrayed);
      setCount(p.amen);
      if (p.encouragements) setEncouragements(p.encouragements.map(e => ({ who: e.who, initials: e.initials, text: e.text })));
      seeded.current = true;
    }
  }, [p]);

  if (!p) {
    return (
      <ScreenContainer>
        <TopBar back title="Prayer request" />
        <Text style={styles.ago}>Loading…</Text>
      </ScreenContainer>
    );
  }

  // Soutien à sens unique : on peut prier pour une requête une fois.
  const onPray = async () => {
    if (prayed) return;
    setPrayed(true);
    setCount(c => c + 1);
    try {
      const res = await pray.mutateAsync(p.id); // { amenCount, iPrayed, blessingsAwarded }
      if (!USE_MOCKS && res) { setPrayed(res.iPrayed); setCount(res.amenCount); }
      if (res && res.blessingsAwarded > 0) {
        toast.success(
          'Amen 🙏',
          `Thank you for lifting this need before the Lord. +${res.blessingsAwarded} Blessings have been added to your Grace Reserve. "The prayer of a righteous person is powerful." (James 5:16)`,
        );
      } else {
        toast.success('Amen 🙏', 'Thank you for lifting this need before the Lord.');
      }
    } catch {
      setPrayed(false);
      setCount(c => Math.max(0, c - 1));
      toast.error('Error', 'Could not register your prayer. Please try again.');
    }
  };

  const sendEncouragement = () => {
    const text = reply.trim();
    if (!text) return;
    const who = user
      ? `${user.firstName ?? ''} ${(user.lastName ?? '').charAt(0)}.`.trim() || 'You'
      : 'You';
    const initials = user
      ? `${(user.firstName ?? '?').charAt(0)}${(user.lastName ?? '').charAt(0)}`.toUpperCase()
      : 'YOU';
    setEncouragements(e => [...e, { who, initials, text }]); // optimiste
    setReply('');
    encourage.mutate(text); // persiste (no-op en mode mocks)
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <TopBar back title="Prayer request" actions={[{ icon: 'flag', onPress: () => toast.success('Reported', 'Thank you — our team will review this prayerfully and with care.') }]} />
      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
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

        <Pressable
          onPress={onPray}
          disabled={prayed}
          style={[styles.bigBtn, prayed && { backgroundColor: tokens.success }]}
        >
          <Icon name={prayed ? 'check' : 'pray'} size={20} color={prayed ? '#fff' : tokens.primary} strokeWidth={prayed ? 2.5 : 2} />
          <Text style={[styles.bigBtnTxt, prayed && { color: '#fff' }]}>
            {prayed ? 'You prayed for this' : 'I\'m praying'}
          </Text>
        </Pressable>

        <Text style={styles.amen}>
          <Text style={styles.amenNum}>{count}</Text> {count === 1 ? 'person' : 'people'} prayed
        </Text>

        <Text style={styles.section}>WORDS OF ENCOURAGEMENT</Text>
        {encouragements.length === 0 ? (
          <Text style={styles.emptyTxt}>Be the first to encourage them.</Text>
        ) : (
          encouragements.map((e, i) => (
            <View key={i} style={[styles.reply, i > 0 && { marginTop: 10 }]}>
              <View style={[styles.miniAvt, { backgroundColor: colorFor(e.who) }]}><Text style={styles.miniAvtTxt}>{e.initials}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.replyWho} numberOfLines={1} ellipsizeMode="tail">{e.who}</Text>
                <Text style={styles.replyTxt}>{e.text}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput value={reply} onChangeText={setReply} onSubmitEditing={sendEncouragement} returnKeyType="send" placeholder="A word of encouragement…" style={styles.input} placeholderTextColor={tokens.textTertiary} />
          <Pressable style={styles.send} onPress={sendEncouragement}><Icon name="send" size={18} color="#fff" /></Pressable>
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
  bigBtnLocked: { backgroundColor: tokens.surface },
  bigBtnTxt: { fontFamily: fonts.uiBold, fontSize: 16, color: tokens.primary },
  amen: { fontFamily: fonts.ui, fontSize: 13, color: tokens.textSecondary, textAlign: 'center', marginTop: 10 },
  amenNum: { fontFamily: fonts.uiBold, color: tokens.text },
  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginTop: 28, marginBottom: 12 },
  emptyTxt: { fontFamily: fonts.ui, fontSize: 14, color: tokens.textSecondary },
  reply: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, backgroundColor: tokens.surface },
  miniAvt: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  miniAvtTxt: { fontFamily: fonts.uiBold, fontSize: 11, color: '#fff' },
  replyWho: { fontFamily: fonts.uiBold, fontSize: 13, color: tokens.text },
  replyTxt: { fontFamily: fonts.serif, fontSize: 14, color: tokens.text, marginTop: 2 },
  composer: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: tokens.borderSoft, backgroundColor: tokens.bg },
  input: { flex: 1, backgroundColor: tokens.surface, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 99, fontFamily: fonts.ui, fontSize: 14, color: tokens.text },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: tokens.primary, alignItems: 'center', justifyContent: 'center' },
});
