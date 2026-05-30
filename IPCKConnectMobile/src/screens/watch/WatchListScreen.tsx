import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, ScreenContainer, TopBar, GeoArt, Pill } from '../../components';
import { useSermons } from '../../api/hooks';

const FILTERS = ['All', 'Latest', 'Anchored series', 'Pastor Mukendi', 'Pastor Esther'];

export default function WatchListScreen() {
  const nav = useNavigation<any>();
  const sermons = useSermons();
  const [filter, setFilter] = useState('All');
  const live = sermons.find(s => s.live);

  return (
    <ScreenContainer>
      <TopBar
        left={<Text style={styles.pageTitle}>Watch</Text>}
        actions={[{ icon: 'search', onPress: () => {} }]}
      />

      {/* Live banner */}
      {live && (
        <Pressable onPress={() => nav.navigate('Live')} style={styles.liveBanner}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <GeoArt kind="live" height={160} />
          </View>
          <View style={styles.liveOverlay} />
          <View style={{ flex: 1, padding: 18, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pill tone="live">● LIVE NOW</Pill>
              <Pill tone="muted">612 watching</Pill>
            </View>
            <View>
              <Text style={styles.liveEyebrow}>SUNDAY SERVICE</Text>
              <Text style={styles.liveTitle}>{live.title}</Text>
              <Text style={styles.liveSpeaker}>{live.speaker}</Text>
            </View>
          </View>
        </Pressable>
      )}

      {/* Filters */}
      <View style={styles.filters}>
        {FILTERS.map(f => {
          const on = filter === f;
          return (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filter, on && styles.filterOn]}>
              <Text style={[styles.filterTxt, on && { color: '#fff' }]}>{f}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>RECENT</Text>
      {sermons.map(s => (
        <Pressable key={s.id} onPress={() => nav.navigate('SermonDetail', { id: s.id })} style={styles.row}>
          <View style={styles.thumb}>
            <Icon name="play" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowSeries}>{s.series.toUpperCase()}</Text>
            <Text style={styles.rowTitle}>{s.title}</Text>
            <Text style={styles.rowMeta}>{s.speaker} · {s.duration} · {s.date}</Text>
          </View>
          <Icon name="bookmark" size={18} color={tokens.textTertiary} />
        </Pressable>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontFamily: fonts.serifBold, fontSize: 26, color: tokens.editorialInk, letterSpacing: -0.4 },
  liveBanner: { height: 160, borderRadius: 14, overflow: 'hidden', marginBottom: 18, flexDirection: 'row' },
  liveOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(20,24,31,0.5)' } as any,
  liveEyebrow: { fontFamily: fonts.uiBold, fontSize: 10, letterSpacing: 1.4, color: 'rgba(255,255,255,0.7)' },
  liveTitle: { fontFamily: fonts.serifBold, fontSize: 20, color: '#fff', marginTop: 4 },
  liveSpeaker: { fontFamily: fonts.uiMedium, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: tokens.surface },
  filterOn: { backgroundColor: tokens.primary },
  filterTxt: { fontFamily: fonts.uiBold, fontSize: 12, color: tokens.text },
  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: tokens.borderSoft },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: tokens.editorialInk, alignItems: 'center', justifyContent: 'center' },
  rowSeries: { fontFamily: fonts.uiBold, fontSize: 10, letterSpacing: 1.2, color: tokens.primary },
  rowTitle: { fontFamily: fonts.serifMed, fontSize: 16, color: tokens.editorialInk, marginTop: 2 },
  rowMeta: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
});
