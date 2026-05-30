import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer } from '../../components';
import { registerPushToken } from '../../api/push';

export default function NotifPermissionScreen() {
  const nav = useNavigation<any>();
  const onAllow = async () => {
    await registerPushToken();
    nav.navigate('Welcome');
  };
  return (
    <ScreenContainer scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 18 }}>
        <View style={styles.iconCircle}>
          <Icon name="bell" size={48} color={tokens.primary} />
        </View>
        <Text style={styles.h1}>Daily teaching, on time.</Text>
        <Text style={styles.body}>
          Get a notification each morning when your devotional is ready, and a reminder before Sunday service.
        </Text>
        <View style={styles.notifPreview}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: tokens.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="verse" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.notifTitle}>IPCK CONNECT · 7:00 AM</Text>
            <Text style={styles.notifBody}>Today's verse · "When the wait feels long" — Romans 8:28</Text>
          </View>
        </View>
      </View>

      <View style={{ gap: 10, paddingHorizontal: 24, paddingBottom: 36 }}>
        <Button fullWidth onPress={onAllow}>Allow notifications</Button>
        <Button variant="ghost" fullWidth onPress={() => nav.navigate('Welcome')}>Not now</Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: tokens.primaryTint, alignItems: 'center', justifyContent: 'center' },
  h1: { fontFamily: fonts.serifBold, fontSize: 26, lineHeight: 32, color: tokens.editorialInk, letterSpacing: -0.5, textAlign: 'center' },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: tokens.textSecondary, textAlign: 'center', maxWidth: 320 },
  notifPreview: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 12, backgroundColor: tokens.bg, borderWidth: 1, borderColor: tokens.borderSoft, marginTop: 14, width: '100%' },
  notifTitle: { fontFamily: fonts.uiBold, fontSize: 11, color: tokens.textSecondary, letterSpacing: 0.8 },
  notifBody: { fontFamily: fonts.uiMedium, fontSize: 13, color: tokens.text, marginTop: 2 },
});
