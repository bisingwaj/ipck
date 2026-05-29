import React from 'react';
import Svg, { Circle, Rect } from 'react-native-svg';
import { View, Text } from 'react-native';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/typography';

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      <Circle cx={22} cy={22} r={14} fill={tokens.primary} />
      <Circle cx={36} cy={34} r={14} fill={tokens.accent} opacity={0.92} />
      <Rect x={28} y={18} width={2.5} height={20} fill="#fff" />
      <Rect x={22} y={24} width={14} height={2.5} fill="#fff" />
    </Svg>
  );
}

export function BrandWordmark({ size = 15 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <BrandMark size={size + 13} />
      <Text style={{ fontFamily: fonts.serifBold, fontSize: size + 2, color: tokens.editorialInk, letterSpacing: -0.3 }}>
        IPCK <Text style={{ fontFamily: fonts.serifItalic, color: tokens.textSecondary }}>Connect</Text>
      </Text>
    </View>
  );
}
