import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, ScreenContainer, TopBar } from '../../components';
import { pastDevotionals } from '../../data/mock';

export default function PastDevotionalsScreen() {
  const nav = useNavigation<any>();
  return (
    <ScreenContainer>
      <TopBar back title="Past devotionals" />
      <View>
        {pastDevotionals.map((d, i) => (
          <Pressable key={d.id} onPress={() => nav.navigate('Devotional', { devotionalId: d.id })} style={styles.row}>
            <View style={[styles.dot, d.read && { backgroundColor: tokens.primary }]}>
              {d.read && <Icon name="check" size={11} color="#fff" strokeWidth={2.5} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.date}>{d.date}</Text>
              <Text style={styles.title}>{d.title}</Text>
              <Text style={styles.ref}>{d.verseRef}</Text>
            </View>
            <Icon name="chevron" size={18} color={tokens.textTertiary} />
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: tokens.borderSoft },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: tokens.border, alignItems: 'center', justifyContent: 'center' },
  date: { fontFamily: fonts.uiBold, fontSize: 10, letterSpacing: 1.2, color: tokens.textSecondary },
  title: { fontFamily: fonts.serifMed, fontSize: 17, color: tokens.editorialInk, marginTop: 2 },
  ref: { fontFamily: fonts.mono, fontSize: 11, color: tokens.textSecondary, marginTop: 2 },
});
