// Lecteur vidéo natif (expo-video) — au design de l'app.
// Lit les vidéos auto-hébergées (MP4) servies par le backend sur /media/...,
// ou tout flux HLS (.m3u8) / MP4 externe. Aucune dépendance YouTube.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/typography';
import { Icon } from './Icon';
import { resolveMediaUrl } from '../api/format';

interface Props {
  url?: string;
  height?: number;
  autoplay?: boolean;
}

export function VideoPlayer({ url, height = 220, autoplay = false }: Props) {
  const src = resolveMediaUrl(url);
  if (src) return <NativePane url={src} height={height} autoplay={autoplay} />;

  return (
    <View style={[styles.wrap, styles.empty, { height }]}>
      <Icon name="play" size={26} color={tokens.textTertiary} />
      <Text style={styles.emptyTxt}>No video available yet</Text>
    </View>
  );
}

function NativePane({ url, height, autoplay }: { url: string; height: number; autoplay: boolean }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    if (autoplay) p.play();
  });
  return (
    <View style={[styles.wrap, { height }]}>
      <VideoView style={{ width: '100%', height }} player={player} allowsFullscreen contentFit="contain" nativeControls />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: tokens.radiusLg,
    overflow: 'hidden',
    backgroundColor: tokens.editorialInk,
  },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTxt: { fontFamily: fonts.uiMedium, fontSize: 13, color: tokens.textTertiary },
});
