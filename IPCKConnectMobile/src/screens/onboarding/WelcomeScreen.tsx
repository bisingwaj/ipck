import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, GeoArt, ScreenContainer } from '../../components';

export default function WelcomeScreen() {
  const nav = useNavigation<any>();
  return (
    <ScreenContainer scroll={false} padded={false}>
      <View style={{ flex: 1 }}>
        <GeoArt kind="community" height={260} />
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <Text style={styles.eyebrow}>WELCOME HOME</Text>
          <Text style={styles.h1}>Glad you're here, Grace.</Text>
          <Text style={styles.body}>
            Your daily teaching is ready, and your church family is one tap away.
          </Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: 36 }}>
        <Button fullWidth onPress={() => nav.replace('Main')}>Open my Today</Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary, marginTop: 16 },
  h1: { fontFamily: fonts.serifBold, fontSize: 32, lineHeight: 38, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 8 },
  body: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 24, color: tokens.textSecondary, marginTop: 12 },
});
