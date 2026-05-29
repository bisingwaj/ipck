import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, Icon, ScreenContainer, TopBar, GeoArt, Pill } from '../../components';
import { sermons } from '../../data/mock';

export default function SermonDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;
  const sermon = sermons.find(s => s.id === id) || sermons[0];
  const [playing, setPlaying] = useState(false);

  return (
    <ScreenContainer>
      <TopBar back actions={[{ icon: 'share' }, { icon: 'download' }, { icon: 'bookmark' }]} />

      {/* Hero */}
      <View style={styles.hero}>
        <GeoArt kind="live" height={200} />
        <View style={styles.heroOverlay} />
        <Pressable onPress={() => setPlaying(p => !p)} style={styles.playBtn}>
          <Icon name={playing ? 'pause' : 'play'} size={28} color={tokens.editorialInk} />
        </Pressable>
      </View>

      <Text style={styles.eyebrow}>{sermon.series.toUpperCase()}</Text>
      <Text style={styles.title}>{sermon.title}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaTxt}>{sermon.speaker}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaTxt}>{sermon.duration}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaTxt}>{sermon.date}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '24%' }]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={styles.time}>00:08:42</Text>
          <Text style={styles.time}>{sermon.duration}</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 24 }}>
        <Button variant="secondary" size="sm" leftIcon="bookmark" style={{ flex: 1 }}>Save</Button>
        <Button variant="secondary" size="sm" leftIcon="download" style={{ flex: 1 }}>Download</Button>
        <Button variant="secondary" size="sm" leftIcon="share" style={{ flex: 1 }}>Share</Button>
      </View>

      {/* Notes */}
      <Text style={styles.section}>SERMON NOTES</Text>
      <View style={styles.notes}>
        <Text style={styles.notesH}>Three things grace teaches us</Text>
        <View style={styles.bullet}><Text style={styles.bulletNum}>1.</Text><Text style={styles.bulletTxt}>We were not saved by what we did.</Text></View>
        <View style={styles.bullet}><Text style={styles.bulletNum}>2.</Text><Text style={styles.bulletTxt}>We cannot be saved by what we do.</Text></View>
        <View style={styles.bullet}><Text style={styles.bulletNum}>3.</Text><Text style={styles.bulletTxt}>We get to live differently because we are saved.</Text></View>
        <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: tokens.borderSoft }}>
          <Text style={styles.notesH2}>Scriptures referenced</Text>
          <Text style={styles.scripture}>Ephesians 2:8–9 · Romans 3:23–24 · Titus 3:4–5</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { height: 200, borderRadius: 14, overflow: 'hidden', marginBottom: 18 },
  heroOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(20,24,31,0.45)' } as any,
  playBtn: { position: 'absolute', top: '50%', left: '50%', marginLeft: -32, marginTop: -32, width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary },
  title: { fontFamily: fonts.serifBold, fontSize: 28, lineHeight: 34, color: tokens.editorialInk, letterSpacing: -0.4, marginTop: 6 },
  meta: { flexDirection: 'row', gap: 6, marginTop: 10, alignItems: 'center' },
  metaTxt: { fontFamily: fonts.uiMedium, fontSize: 13, color: tokens.textSecondary },
  metaDot: { fontFamily: fonts.ui, fontSize: 13, color: tokens.textTertiary },
  progressWrap: { marginTop: 20 },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: tokens.surface },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: tokens.primary },
  time: { fontFamily: fonts.mono, fontSize: 11, color: tokens.textSecondary },
  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginTop: 28, marginBottom: 10 },
  notes: { padding: 18, borderRadius: 14, backgroundColor: tokens.surface },
  notesH: { fontFamily: fonts.serifBold, fontSize: 18, color: tokens.editorialInk, marginBottom: 12 },
  notesH2: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1, color: tokens.textSecondary, marginBottom: 4 },
  bullet: { flexDirection: 'row', gap: 10, marginTop: 6 },
  bulletNum: { fontFamily: fonts.serifBold, fontSize: 16, color: tokens.primary },
  bulletTxt: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 24, color: tokens.text, flex: 1 },
  scripture: { fontFamily: fonts.mono, fontSize: 12, color: tokens.text, marginTop: 4 },
});
