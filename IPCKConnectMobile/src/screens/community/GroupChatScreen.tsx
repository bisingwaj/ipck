import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, toast, TopBar } from '../../components';
import { useGroup, useGroupMessages } from '../../api/hooks';
import { useSendGroupMessage } from '../../api/mutations';
import { apiMessage } from '../../api/errors';

interface ChatMsg { who: string; text: string; time: string; mine: boolean }

// Conversation de démonstration affichée quand le backend ne renvoie pas de messages (mode mocks).
const MOCK_MESSAGES: ChatMsg[] = [
  { who: 'Pastor Esther', text: "Sisters — let's pause for a moment and lift Mama Joseph in prayer. Her husband is in hospital.", time: '08:42', mine: false },
  { who: 'Grace Mbuyi', text: 'Praying right now 🙏', time: '08:44', mine: false },
  { who: 'You', text: 'Lord, please be near to her and to Joseph. Cover them with peace.', time: '08:45', mine: true },
  { who: 'Marie-Anne', text: "Amen. I'll bring food over this evening. Anyone else free to help?", time: '08:52', mine: false },
];

function hhmm(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function GroupChatScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const id = route.params?.id;
  const group = useGroup(id);
  const fetched = useGroupMessages(id);
  const send = useSendGroupMessage(id);
  const [msg, setMsg] = useState('');
  const [localSent, setLocalSent] = useState<ChatMsg[]>([]);

  const usingServer = fetched.length > 0;
  const messages: ChatMsg[] = usingServer
    ? fetched.map(m => ({ who: m.who, text: m.text, time: hhmm(m.at), mine: m.mine }))
    : [...MOCK_MESSAGES, ...localSent];

  const onSend = async () => {
    const text = msg.trim();
    if (!text) return;
    setMsg('');
    try {
      await send.mutateAsync(text);
      // En mode serveur, l'invalidation rafraîchit la liste ; sinon on affiche en local.
      if (!usingServer) setLocalSent(s => [...s, { who: 'You', text, time: hhmm(new Date().toISOString()), mine: true }]);
    } catch (e) {
      setMsg(text);
      toast.error('Message not sent', apiMessage(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <TopBar
        left={<Pressable onPress={() => nav.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Icon name="chevronL" size={22} />
          <View style={[styles.miniAvt, { backgroundColor: group?.color ?? tokens.primary }]}>
            <Icon name="community" size={14} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.headTitle} numberOfLines={1} ellipsizeMode="tail">{group?.name ?? 'Group'}</Text>
            <Text style={styles.headSub} numberOfLines={1}>{group?.members ?? 0} members</Text>
          </View>
        </Pressable>}
        actions={[{ icon: 'dots', onPress: () => group && toast.info(group.name, `${group.members} members walking together`) }]}
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        {messages.map((m, i) => (
          <View key={i} style={[styles.bubble, m.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
            {!m.mine && <Text style={styles.bubbleWho}>{m.who}</Text>}
            <Text style={[styles.bubbleTxt, m.mine && { color: '#fff' }]}>{m.text}</Text>
            <Text style={[styles.bubbleAgo, m.mine && { color: 'rgba(255,255,255,0.7)' }]}>{m.time}</Text>
          </View>
        ))}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable style={styles.plusBtn} onPress={() => toast.info('Coming soon', 'Attachments are on their way.')}><Icon name="plus" size={20} color={tokens.textSecondary} /></Pressable>
          <TextInput value={msg} onChangeText={setMsg} onSubmitEditing={onSend} returnKeyType="send" placeholder="Write a message…" style={styles.composerInput} placeholderTextColor={tokens.textTertiary} />
          <Pressable style={styles.send} onPress={onSend} disabled={send.isPending}><Icon name="send" size={18} color="#fff" /></Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  miniAvt: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  headTitle: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text },
  headSub: { fontFamily: fonts.ui, fontSize: 11, color: tokens.textSecondary },
  bubble: { padding: 12, borderRadius: 14, maxWidth: '80%' },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: tokens.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: tokens.surface, borderBottomLeftRadius: 4 },
  bubbleWho: { fontFamily: fonts.uiBold, fontSize: 11, color: tokens.primary, marginBottom: 2 },
  bubbleTxt: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 20, color: tokens.text },
  bubbleAgo: { fontFamily: fonts.mono, fontSize: 10, color: tokens.textSecondary, marginTop: 4, textAlign: 'right' },
  composer: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: tokens.borderSoft, backgroundColor: tokens.bg, alignItems: 'center' },
  plusBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: tokens.surface, alignItems: 'center', justifyContent: 'center' },
  composerInput: { flex: 1, backgroundColor: tokens.surface, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 99, fontFamily: fonts.ui, fontSize: 14, color: tokens.text },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: tokens.primary, alignItems: 'center', justifyContent: 'center' },
});
