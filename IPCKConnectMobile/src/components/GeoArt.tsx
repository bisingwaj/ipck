import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Rect, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { tokens } from '../theme/tokens';

interface Props {
  kind?: 'verse' | 'live' | 'community' | 'give';
  height?: number;
}

export function GeoArt({ kind = 'verse', height = 160 }: Props) {
  const palettes: Record<string, [string, string, string]> = {
    verse:     [tokens.primary, tokens.accent, tokens.editorialInk],
    live:      ['#2B2150', tokens.primary, tokens.accent],
    community: [tokens.accent, tokens.primary, '#0FA38C'],
    give:      ['#1FB36A', tokens.accent, tokens.primary],
  };
  const [c1, c2, c3] = palettes[kind];
  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Svg width="100%" height={height} viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c1} stopOpacity={0.16} />
            <Stop offset="1" stopColor={c2} stopOpacity={0.08} />
          </LinearGradient>
        </Defs>
        <Rect width={320} height={160} fill="url(#bg)" />
        <Circle cx={70} cy={120} r={50} fill={c1} opacity={0.85} />
        <Circle cx={210} cy={70} r={64} fill={c2} opacity={0.7} />
        <Circle cx={240} cy={130} r={28} fill={c3} opacity={0.6} />
      </Svg>
    </View>
  );
}
