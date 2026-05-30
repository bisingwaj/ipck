import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer } from '../../components';
import { RootStackParamList } from '../../navigation/types';

export default function PrayedScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'Prayed'>>();
  const streakCount = route.params?.streakCount;
  const blessings = route.params?.blessings ?? 0;
  return (
    <ScreenContainer scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 24 }}>
        <View style={styles.checkCircle}>
          <Icon name="check" size={48} color={tokens.success} strokeWidth={2.5} />
        </View>
        <Text style={styles.h1}>Today's teaching validated.</Text>

        {blessings > 0 && (
          <View style={styles.blessings}>
            <Icon name="sparkle" size={18} color={tokens.accent} />
            <Text style={styles.blessingsTxt}>
              <Text style={styles.blessingsNum}>+{blessings} Blessings</Text> added to your Grace Reserve
            </Text>
          </View>
        )}

        <Text style={styles.body}>
          {streakCount != null ? (
            <>Your streak is now <Text style={{ fontFamily: fonts.uiBold, color: tokens.accent }}>{streakCount} days</Text>. See you tomorrow morning.</>
          ) : (
            <>See you tomorrow morning.</>
          )}
        </Text>
      </View>
      <Button fullWidth onPress={() => nav.popToTop()}>Back to today</Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  checkCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: tokens.successTint, alignItems: 'center', justifyContent: 'center' },
  h1: { fontFamily: fonts.serifBold, fontSize: 26, lineHeight: 32, color: tokens.editorialInk, letterSpacing: -0.3, textAlign: 'center' },
  blessings: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, backgroundColor: tokens.accentTint },
  blessingsTxt: { fontFamily: fonts.ui, fontSize: 14, color: tokens.editorialInk },
  blessingsNum: { fontFamily: fonts.uiBold, color: tokens.editorialInk },
  body: { fontFamily: fonts.serifMed, fontSize: 17, lineHeight: 26, color: tokens.textSecondary, textAlign: 'center', maxWidth: 300 },
});
