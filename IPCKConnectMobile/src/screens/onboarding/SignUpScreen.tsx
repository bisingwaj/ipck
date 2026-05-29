import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer, TopBar } from '../../components';

export default function SignUpScreen() {
  const nav = useNavigation<any>();
  return (
    <ScreenContainer scroll={false} padded={false}>
      <TopBar back onBack={() => nav.goBack()} />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8 }}>
        <Text style={styles.eyebrow}>JOIN IPCK CONNECT</Text>
        <Text style={styles.h1}>Welcome home.</Text>
        <Text style={styles.body}>
          One quick step to get started. We'll only ever ask for what we need.
        </Text>

        <View style={{ gap: 12, marginTop: 36 }}>
          <Pressable style={styles.method} onPress={() => nav.navigate('Phone')}>
            <Icon name="phone" size={22} color={tokens.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>Continue with phone</Text>
              <Text style={styles.methodSub}>We'll text you a 6-digit code</Text>
            </View>
            <Icon name="chevron" size={18} color={tokens.textSecondary} />
          </Pressable>

          <Pressable style={styles.method}>
            <Icon name="mail" size={22} color={tokens.text} />
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>Continue with email</Text>
              <Text style={styles.methodSub}>For overseas members</Text>
            </View>
            <Icon name="chevron" size={18} color={tokens.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.privacyNote}>
          <Icon name="lock" size={16} color={tokens.textSecondary} />
          <Text style={styles.privacyText}>
            We never sell your data. Private prayer requests stay between you and the pastoral team.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary, marginTop: 24 },
  h1: { fontFamily: fonts.serifBold, fontSize: 34, lineHeight: 40, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 8 },
  body: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 24, color: tokens.textSecondary, marginTop: 14 },
  method: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 14, borderWidth: 1.5, borderColor: tokens.border, backgroundColor: tokens.bg },
  methodTitle: { fontFamily: fonts.uiBold, fontSize: 15, color: tokens.text },
  methodSub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
  privacyNote: { flexDirection: 'row', gap: 10, marginTop: 28, padding: 14, borderRadius: 10, backgroundColor: tokens.surface, alignItems: 'flex-start' },
  privacyText: { flex: 1, fontFamily: fonts.ui, fontSize: 12, lineHeight: 18, color: tokens.textSecondary },
});
