import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer, TopBar } from '../../components';
import { useFunds } from '../../api/hooks';

export default function GiveFundScreen() {
  const nav = useNavigation<any>();
  const funds = useFunds();
  const [picked, setPicked] = useState('general');
  return (
    <ScreenContainer
      footer={<Button fullWidth onPress={() => nav.navigate('GiveMethod')}>Continue</Button>}
    >
      <TopBar back title="Give · $50" />
      <Text style={styles.eyebrow}>2 OF 3 · DESIGNATE</Text>
      <Text style={styles.h1}>Which fund?</Text>
      <Text style={styles.body}>Your gift goes to the work you choose.</Text>

      <View style={{ marginTop: 28, gap: 10 }}>
        {funds.map(f => {
          const on = picked === f.id;
          return (
            <Pressable key={f.id} onPress={() => setPicked(f.id)} style={[styles.row, on && { borderColor: tokens.primary, backgroundColor: tokens.primaryTint }]}>
              <View style={[styles.dot, { backgroundColor: f.accent + '33', borderColor: f.accent }]}>
                <View style={[styles.dotInner, { backgroundColor: f.accent }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={1} ellipsizeMode="tail">{f.name}</Text>
                <Text style={styles.rowSub} numberOfLines={2} ellipsizeMode="tail">{f.description}</Text>
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
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary, marginTop: 8 },
  h1: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, color: tokens.editorialInk, letterSpacing: -0.5, marginTop: 8 },
  body: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 22, color: tokens.textSecondary, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: tokens.border },
  dot: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dotInner: { width: 12, height: 12, borderRadius: 4 },
  rowTitle: { fontFamily: fonts.uiBold, fontSize: 15, color: tokens.text },
  rowSub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
});
