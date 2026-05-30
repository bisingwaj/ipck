import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { BrandWordmark, Icon, ScreenContainer, TopBar, GeoArt } from '../../components';
import { useTodayDevotional, useSermons } from '../../api/hooks';

export default function TodayHomeScreen() {
  const nav = useNavigation<any>();
  const todayDevotional = useTodayDevotional();
  const sermons = useSermons();
  const liveSermon = sermons.find(s => s.live);
  return (
    <ScreenContainer>
      <TopBar
        left={<BrandWordmark size={15} />}
        right={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pressable onPress={() => nav.navigate('Streak')} style={styles.streak}>
            <Icon name="flame" size={14} color={tokens.accent} />
            <Text style={styles.streakNum}>12</Text>
          </Pressable>
          <Pressable onPress={() => nav.navigate('Notifications')} hitSlop={8}><Icon name="bell" size={22} /></Pressable>
        </View>}
      />

      <Text style={styles.date}>{todayDevotional.date.split(',')[1].trim()}</Text>

      {/* Live banner */}
      {liveSermon && (
        <Pressable onPress={() => nav.navigate('Live')} style={styles.live}>
          <View style={styles.liveDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.liveLbl}>LIVE NOW · SUNDAY SERVICE</Text>
            <Text style={styles.liveTitle}>{liveSermon.title}</Text>
          </View>
          <Icon name="chevron" size={20} color="#fff" />
        </Pressable>
      )}

      {/* Devotional card */}
      <Pressable onPress={() => nav.navigate('Devotional')} style={styles.devotional}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <GeoArt kind="verse" height={120} />
        </View>
        <View style={{ marginTop: 90, padding: 22 }}>
          <Text style={styles.eyebrow}>TODAY'S TEACHING</Text>
          <Text style={styles.devTitle}>{todayDevotional.title}</Text>
          <Text style={styles.devVerse}>{todayDevotional.verseText}</Text>
          <Text style={styles.devRef}>— {todayDevotional.verseRef}</Text>
          <View style={styles.readCta}>
            <Text style={styles.readCtaTxt}>Read · 3 min</Text>
            <Icon name="arrow" size={14} color={tokens.primary} />
          </View>
        </View>
      </Pressable>

      <Text style={styles.sectionLbl}>UP NEXT</Text>

      <Pressable onPress={() => nav.navigate('SermonDetail', { id: sermons[1].id })} style={styles.card}>
        <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: tokens.editorialInk, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="play" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardEyebrow}>LATEST SERMON</Text>
          <Text style={styles.cardTitle}>{sermons[1].title}</Text>
          <Text style={styles.cardSub}>{sermons[1].speaker} · {sermons[1].duration}</Text>
        </View>
      </Pressable>

      <Pressable onPress={() => nav.navigate('PrayerWall')} style={styles.card}>
        <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: tokens.accentTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="pray" size={22} color={tokens.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardEyebrow}>PRAYER WALL</Text>
          <Text style={styles.cardTitle}>5 new prayer requests</Text>
          <Text style={styles.cardSub}>Pray with your church family</Text>
        </View>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: tokens.surface },
  streakNum: { fontFamily: fonts.uiBold, fontSize: 13, color: tokens.editorialInk },
  date: { fontFamily: fonts.uiMedium, fontSize: 14, color: tokens.textSecondary, marginTop: 6, marginBottom: 12 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, backgroundColor: tokens.editorialInk, marginBottom: 14 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: tokens.error },
  liveLbl: { fontFamily: fonts.uiBold, fontSize: 10, letterSpacing: 1.2, color: '#fff', opacity: 0.7 },
  liveTitle: { fontFamily: fonts.serifMed, fontSize: 16, color: '#fff', marginTop: 2 },
  devotional: { borderRadius: 18, overflow: 'hidden', backgroundColor: tokens.surfaceTint, marginBottom: 24 },
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary },
  devTitle: { fontFamily: fonts.serifBold, fontSize: 26, lineHeight: 32, color: tokens.editorialInk, letterSpacing: -0.3, marginTop: 8 },
  devVerse: { fontFamily: fonts.serifItalic, fontSize: 17, lineHeight: 26, color: tokens.editorialInk, marginTop: 14 },
  devRef: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, color: tokens.textSecondary, marginTop: 8 },
  readCta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  readCtaTxt: { fontFamily: fonts.uiBold, fontSize: 14, color: tokens.primary },
  sectionLbl: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginBottom: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderSoft, marginBottom: 12 },
  cardEyebrow: { fontFamily: fonts.uiBold, fontSize: 10, letterSpacing: 1.2, color: tokens.textSecondary },
  cardTitle: { fontFamily: fonts.uiBold, fontSize: 15, color: tokens.text, marginTop: 2 },
  cardSub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
});
