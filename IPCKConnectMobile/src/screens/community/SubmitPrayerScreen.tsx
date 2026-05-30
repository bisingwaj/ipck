import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer, TopBar } from '../../components';

const OPTIONS = [
  { id: 'public',  label: 'Share publicly',         sub: 'With my name. Others can pray with me.',         icon: 'globe' as const },
  { id: 'anon',    label: 'Share anonymously',      sub: 'Without my name. Others can still pray.',         icon: 'eyeOff' as const },
  { id: 'private', label: 'Private to the pastor',  sub: 'Only the pastoral team will see this.',           icon: 'lock' as const },
];

export default function SubmitPrayerScreen() {
  const nav = useNavigation<any>();
  const [text, setText] = useState('');
  const [vis, setVis] = useState('public');

  return (
    <ScreenContainer
      footer={<Button fullWidth disabled={!text.trim()} onPress={() => nav.goBack()} leftIcon="send">Submit prayer request</Button>}
    >
      <TopBar back title="Share a prayer" actions={[{ label: 'Cancel', onPress: () => nav.goBack() }]} />
      <Text style={styles.h1}>What would you like prayer for?</Text>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Write your request…"
        multiline
        autoFocus
        placeholderTextColor={tokens.textTertiary}
        style={styles.textarea}
      />

      <Text style={styles.label}>VISIBILITY</Text>
      <View style={{ gap: 10 }}>
        {OPTIONS.map(o => {
          const on = vis === o.id;
          return (
            <Pressable key={o.id} onPress={() => setVis(o.id)} style={[styles.opt, on && styles.optOn]}>
              <View style={[styles.optIcon, on && { backgroundColor: tokens.primary }]}>
                <Icon name={o.icon} size={18} color={on ? '#fff' : tokens.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optTitle, on && { color: tokens.primary }]} numberOfLines={1} ellipsizeMode="tail">{o.label}</Text>
                <Text style={styles.optSub} numberOfLines={2} ellipsizeMode="tail">{o.sub}</Text>
              </View>
              {on && <Icon name="check" size={20} color={tokens.primary} strokeWidth={2.5} />}
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: fonts.serifBold, fontSize: 22, color: tokens.editorialInk, letterSpacing: -0.3, marginTop: 8 },
  textarea: { minHeight: 140, padding: 16, borderRadius: 14, backgroundColor: tokens.surface, fontFamily: fonts.serif, fontSize: 16, lineHeight: 24, color: tokens.text, marginTop: 18, textAlignVertical: 'top' },
  label: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginTop: 24, marginBottom: 10 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: tokens.border },
  optOn: { borderColor: tokens.primary, backgroundColor: tokens.primaryTint },
  optIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: tokens.primaryTint, alignItems: 'center', justifyContent: 'center' },
  optTitle: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text },
  optSub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
});
