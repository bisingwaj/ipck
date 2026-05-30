import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/typography';
import { Icon, IconName } from './Icon';

export interface TopBarAction {
  icon?: IconName;
  label?: string;
  onPress?: () => void;
  color?: string;
}

interface Props {
  title?: string;
  titleLarge?: string;
  back?: boolean;
  onBack?: () => void;
  left?: React.ReactNode;
  right?: React.ReactNode;
  actions?: TopBarAction[];
  noBottomPad?: boolean;
}

export function TopBar({ title, titleLarge, back, onBack, left, right, actions, noBottomPad }: Props) {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();

  const backOrLeft = back ? (
    <Pressable onPress={() => (onBack ? onBack() : nav.goBack())} hitSlop={8} style={{ padding: 4 }}>
      <Icon name="chevronL" size={26} />
    </Pressable>
  ) : left;

  const rightContent = (
    <>
      {right}
      {actions?.map((a, i) => (
        <Pressable key={i} onPress={a.onPress} hitSlop={8} style={{ padding: 6 }}>
          {a.icon ? <Icon name={a.icon} size={22} color={a.color || tokens.text} /> :
            <Text style={{ fontFamily: fonts.uiBold, color: a.color || tokens.primary, fontSize: 14 }}>{a.label}</Text>}
        </Pressable>
      ))}
    </>
  );

  // Large editorial page title: left-aligned, full available width, never centered/clipped.
  if (titleLarge) {
    return (
      <View style={[styles.wrap, { paddingTop: insets.top + 4, paddingBottom: noBottomPad ? 4 : 10 }]}>
        <View style={styles.row}>
          {!!backOrLeft && <View style={styles.sideCompact}>{backOrLeft}</View>}
          <Text
            style={styles.titleLarge}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            maxFontSizeMultiplier={1.3}
          >
            {titleLarge}
          </Text>
          <View style={styles.sideCompact}>{rightContent}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 4, paddingBottom: noBottomPad ? 4 : 10 }]}>
      <View style={styles.row}>
        <View style={styles.side}>{backOrLeft}</View>

        {title ? (
          <Text numberOfLines={1} style={styles.title} maxFontSizeMultiplier={1.3}>{title}</Text>
        ) : <View style={{ flex: 1 }} />}

        <View style={[styles.side, { justifyContent: 'flex-end' }]}>{rightContent}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, backgroundColor: tokens.bg },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  side: { flexDirection: 'row', alignItems: 'center', minWidth: 60, flex: 1, gap: 4 },
  sideCompact: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, gap: 4 },
  title: { fontFamily: fonts.uiBold, fontSize: 16, color: tokens.text, flex: 2, textAlign: 'center' },
  titleLarge: { fontFamily: fonts.serifBold, fontSize: 26, color: tokens.editorialInk, letterSpacing: -0.4, flex: 1 },
});
