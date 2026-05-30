import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer, TopBar } from '../../components';
import { useStreak } from '../../api/hooks';

export default function StreakScreen() {
  const nav = useNavigation<any>();
  const streak = useStreak();
  return (
    <ScreenContainer scroll={false}>
      <TopBar back title="Your streak" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <View style={styles.flameCircle}>
          <Icon name="flame" size={72} color={tokens.accent} />
        </View>
        <Text style={styles.num}>{streak.count}</Text>
        <Text style={styles.label}>days walking with Jesus</Text>
        <View style={styles.gridRow}>
          {['M','T','W','T','F','S','S'].map((d, i) => {
            const on = streak.days[i] ?? false;
            return (
              <View key={i} style={styles.day}>
                <View style={[styles.dayDot, on && { backgroundColor: tokens.accent }]} />
                <Text style={styles.dayLbl}>{d}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.body}>
          You're doing beautifully. Just one more verse to keep it going tomorrow.
        </Text>
      </View>
      <Button fullWidth onPress={() => nav.goBack()}>Back to today</Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flameCircle: { width: 144, height: 144, borderRadius: 72, backgroundColor: tokens.accentTint, alignItems: 'center', justifyContent: 'center' },
  num: { fontFamily: fonts.serifBold, fontSize: 64, color: tokens.editorialInk, letterSpacing: -1 },
  label: { fontFamily: fonts.serifMed, fontSize: 18, color: tokens.textSecondary },
  gridRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  day: { alignItems: 'center', gap: 4 },
  dayDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: tokens.border },
  dayLbl: { fontFamily: fonts.uiBold, fontSize: 10, color: tokens.textSecondary },
  body: { fontFamily: fonts.serifMed, fontSize: 16, lineHeight: 24, color: tokens.text, textAlign: 'center', maxWidth: 280, marginTop: 18 },
});
