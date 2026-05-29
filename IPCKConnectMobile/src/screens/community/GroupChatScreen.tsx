import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, TopBar } from '../../components';
import { allGroups } from '../../data/mock';

const MESSAGES = [
  { who: 'Pastor Esther', t: "Sisters — let's pause for a moment and lift Mama Joseph in prayer. Her husband is in hospital.", ago: '08:42', mine: false },
  { who: 'Grace Mbuyi', t: 'Praying right now 🙏', ago: '08:44', mine: false },
  { who: 'You', t: 'Lord, please be near to her and to Joseph. Cover them with peace.', ago: '08:45', mine: true },
  { who: 'Marie-Anne', t: "Amen. I'll bring food over this evening. Anyone else free to help?", ago: '08:52', mine: false },
  { who: 'You', t: 'I can drop a meal tomorrow afternoon if needed.', ago: '09:01', mine: true },
  { who: 'Pastor Esther', t: 'Beautiful. I\'ll text you both to coordinate. Thank you, dear ones.', ago: '09:05', mine: false },
];

export default function GroupChatScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const group = allGroups.find(g => g.id === route.params?.id) || allGroups[0];
  const [msg, setMsg] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <TopBar
        back
        left={<Pressable onPress={() => nav.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="chevronL" size={22} />
          <View style={[styles.miniAvt, { backgroundColor: group.color }]}>
            <Icon name="community" size={14} color="#fff" />
          </View>
          <View>
            <Text style={styles.headTitle}>{group.name}</Text>
            <Text style={styles.headSub}>{group.members} members</Text>
          </View>
        </Pressable>}
        actions={[{ icon: 'dots' }]}
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        {MESSAGES.map((m, i) => (
          <View key={i} style={[styles.bubble, m.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
            {!m.mine && <Text style={styles.bubbleWho}>{m.who}</Text>}
            <Text style={[styles.bubbleTxt, m.mine && { color: '#fff' }]}>{m.t}</Text>
            <Text style={[styles.bubbleAgo, m.mine && { color: 'rgba(255,255,255,0.7)' }]}>{m.ago}</Text>
          </View>
        ))}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable style={styles.plusBtn}><Icon name="plus" size={20} color={tokens.textSecondary} /></Pressable>
          <TextInput value={msg} onChangeText={setMsg} placeholder="Write a message…" style={styles.composerInput} placeholderTextColor={tokens.textTertiary} />
          <Pressable style={styles.send}><Icon name="send" size={18} color="#fff" /></Pressable>
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
