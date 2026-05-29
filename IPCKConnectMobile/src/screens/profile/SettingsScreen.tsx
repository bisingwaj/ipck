import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { ScreenContainer, TopBar } from '../../components';

export default function SettingsScreen() {
  return (
    <ScreenContainer>
      <TopBar back title="Settings" />
      <Text style={styles.section}>NOTIFICATIONS</Text>
      <Row title="Daily teaching" sub="Verse at 07:00 CAT" defaultOn />
      <Row title="Service reminders" sub="Sunday morning" defaultOn />
      <Row title="Live alerts" sub="When the stream goes live" defaultOn />
      <Row title="Group activity" sub="Replies in your groups" defaultOn />
      <Row title="Prayer requests" sub="New requests on the wall" />

      <Text style={styles.section}>READING</Text>
      <Row title="Bible translation" sub="NIV" />
      <Row title="Language" sub="English" />

      <Text style={styles.section}>DATA</Text>
      <Row title="Low-data mode" sub="Compress audio and video" />
      <Row title="Download over Wi-Fi only" sub="Sermon downloads" defaultOn />
    </ScreenContainer>
  );
}

function Row({ title, sub, defaultOn }: { title: string; sub: string; defaultOn?: boolean }) {
  return (
    <View style={rowStyles.row}>
      <View style={{ flex: 1 }}>
        <Text style={rowStyles.title}>{title}</Text>
        <Text style={rowStyles.sub}>{sub}</Text>
      </View>
      <Switch value={defaultOn} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginTop: 20, marginBottom: 6 },
});
const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: tokens.borderSoft },
  title: { fontFamily: fonts.uiMedium, fontSize: 14, color: tokens.text },
  sub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
});
