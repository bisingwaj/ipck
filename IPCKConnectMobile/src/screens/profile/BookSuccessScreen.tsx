import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer, toast } from '../../components';
import { apptWhen } from '../../api/format';
import { RootStackParamList } from '../../navigation/types';

export default function BookSuccessScreen() {
  const nav = useNavigation<any>();
  const { slotStart, topicLabel } = useRoute<RouteProp<RootStackParamList, 'BookSuccess'>>().params;
  return (
    <ScreenContainer scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 18 }}>
        <View style={styles.circle}>
          <Icon name="check" size={48} color={tokens.success} strokeWidth={2.5} />
        </View>
        <Text style={styles.h1}>You're booked.</Text>
        <Text style={styles.body}>
          {topicLabel} · {apptWhen(slotStart)} with the pastoral team. You'll get an SMS confirmation and a reminder the day before.
        </Text>
      </View>
      <View style={{ gap: 10 }}>
        <Button fullWidth leftIcon="cal" onPress={() => toast.info('Coming soon', 'Adding to your calendar will be available soon.')}>Add to calendar</Button>
        <Button variant="ghost" fullWidth onPress={() => nav.navigate('MyAppointments')}>See my appointments</Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  circle: { width: 96, height: 96, borderRadius: 48, backgroundColor: tokens.successTint, alignItems: 'center', justifyContent: 'center' },
  h1: { fontFamily: fonts.serifBold, fontSize: 28, color: tokens.editorialInk, letterSpacing: -0.4, textAlign: 'center' },
  body: { fontFamily: fonts.serifMed, fontSize: 16, lineHeight: 24, color: tokens.textSecondary, textAlign: 'center', maxWidth: 320 },
  ref: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.2, color: tokens.textSecondary },
});
