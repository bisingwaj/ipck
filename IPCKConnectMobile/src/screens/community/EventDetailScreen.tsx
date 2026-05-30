import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, toast, TopBar, GeoArt } from '../../components';
import { useEvent } from '../../api/hooks';
import { useRsvpEvent } from '../../api/mutations';
import { apiMessage } from '../../api/errors';

export default function EventDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const id = route.params?.id;
  const e = useEvent(id);
  const rsvpMut = useRsvpEvent(id);
  const [rsvp, setRsvp] = useState<boolean>((e as any)?.myRsvp === 'going');

  if (!e) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg }}>
        <TopBar back />
        <Text style={[styles.body, { padding: 20 }]}>Loading…</Text>
      </View>
    );
  }

  const onRsvp = async () => {
    const next = !rsvp;
    setRsvp(next);
    try {
      await rsvpMut.mutateAsync(next ? 'going' : 'cancelled');
    } catch (err) {
      setRsvp(!next);
      toast.error('Take heart', apiMessage(err));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <TopBar back actions={[{ icon: 'share', onPress: () => Share.share({ message: `${e.name} — ${e.when} · ${e.loc ?? ''}` }).catch(() => {}) }]} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 18 }}>
          <GeoArt kind="community" height={180} />
        </View>
        <Text style={styles.title}>{e.name}</Text>
        <View style={styles.metaRow}>
          <Icon name="cal" size={16} color={tokens.textSecondary} />
          <Text style={styles.metaTxt}>{e.when}</Text>
        </View>
        <View style={styles.metaRow}>
          <Icon name="pin" size={16} color={tokens.textSecondary} />
          <Text style={styles.metaTxt}>{e.loc}</Text>
        </View>
        <View style={styles.metaRow}>
          <Icon name="profile" size={16} color={tokens.textSecondary} />
          <Text style={styles.metaTxt}>{e.rsvp}{e.cap ? ` of ${e.cap}` : ''} attending</Text>
        </View>

        <Text style={styles.section}>ABOUT</Text>
        <Text style={styles.body}>{e.description}</Text>

        <Text style={styles.section}>WHAT TO EXPECT</Text>
        <Text style={styles.body}>
          We start on time. Light refreshments served. Children are welcome — Sunday School is in parallel.
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Button fullWidth onPress={onRsvp} disabled={rsvpMut.isPending} variant={rsvp ? 'secondary' : 'primary'} leftIcon={rsvp ? 'check' : undefined}>
          {rsvp ? 'You\'re going · tap to cancel' : 'I\'ll be there'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, color: tokens.editorialInk, letterSpacing: -0.4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  metaTxt: { fontFamily: fonts.ui, fontSize: 14, color: tokens.text },
  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginTop: 26, marginBottom: 10 },
  body: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 24, color: tokens.text },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: tokens.bg, borderTopWidth: 1, borderTopColor: tokens.borderSoft },
});
