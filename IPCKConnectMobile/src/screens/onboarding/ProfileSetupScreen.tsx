import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Field, Icon, ScreenContainer, TopBar } from '../../components';

const AGE_GROUPS = ['16–25', '26–40', '41–60', '60+'];

export default function ProfileSetupScreen() {
  const nav = useNavigation<any>();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [age, setAge] = useState<string | null>(null);

  return (
    <ScreenContainer
      footer={<Button fullWidth disabled={!first || !last || !age} onPress={() => nav.navigate('Interests')}>Continue</Button>}
    >
      <TopBar back />
      <Text style={styles.eyebrow}>3 OF 4 · YOUR NAME</Text>
      <Text style={styles.h1}>What should we call you?</Text>
      <Text style={styles.body}>So your pastor and small group know who you are.</Text>

      <View style={{ marginTop: 28 }}>
        <Field label="First name" value={first} onChangeText={setFirst} placeholder="Grace" autoFocus />
        <Field label="Last name"  value={last}  onChangeText={setLast}  placeholder="Mbuyi" />
        <Text style={styles.fieldLabel}>AGE GROUP</Text>
        <View style={styles.ageRow}>
          {AGE_GROUPS.map(g => {
            const on = age === g;
            return (
              <Pressable key={g} onPress={() => setAge(g)} style={[styles.age, on && styles.ageOn]}>
                <Text style={[styles.ageTxt, on && styles.ageTxtOn]}>{g}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.privacyNote}>
          <Icon name="lock" size={14} color={tokens.textSecondary} />
          <Text style={styles.privacyText}>Only your name is visible to your group. Age is private to the pastoral team.</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary, marginTop: 16 },
  h1: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 8 },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: tokens.textSecondary, marginTop: 10 },
  fieldLabel: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1, color: tokens.textSecondary, marginBottom: 8 },
  ageRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  age: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 99, borderWidth: 1.5, borderColor: tokens.border },
  ageOn: { borderColor: tokens.primary, backgroundColor: tokens.primaryTint },
  ageTxt: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.text },
  ageTxtOn: { color: tokens.primary },
  privacyNote: { flexDirection: 'row', gap: 8, marginTop: 24, padding: 14, borderRadius: 10, backgroundColor: tokens.surface, alignItems: 'flex-start' },
  privacyText: { flex: 1, fontFamily: fonts.ui, fontSize: 12, lineHeight: 18, color: tokens.textSecondary },
});
