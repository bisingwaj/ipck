import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { BrandMark } from '../../components';

export default function SplashScreen() {
  const nav = useNavigation<any>();
  useEffect(() => { const t = setTimeout(() => nav.replace('Onboarding'), 1100); return () => clearTimeout(t); }, [nav]);
  return (
    <View style={styles.wrap}>
      <BrandMark size={72} />
      <Text style={styles.brand}>IPCK <Text style={styles.italic}>Connect</Text></Text>
      <Text style={styles.tag}>Your church, every day</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bg, gap: 14 },
  brand: { fontFamily: fonts.serifBold, fontSize: 32, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 8 },
  italic: { fontFamily: fonts.serifItalic, color: tokens.textSecondary },
  tag: { fontFamily: fonts.ui, fontSize: 14, color: tokens.textSecondary },
});
