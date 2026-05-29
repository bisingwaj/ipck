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
  back?: boolean;
  onBack?: () => void;
  left?: React.ReactNode;
  right?: React.ReactNode;
  actions?: TopBarAction[];
  noBottomPad?: boolean;
}

export function TopBar({ title, back, onBack, left, right, actions, noBottomPad }: Props) {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 4, paddingBottom: noBottomPad ? 4 : 10 }]}>
      <View style={styles.row}>
        <View style={styles.side}>
          {back ? (
            <Pressable onPress={() => (onBack ? onBack() : nav.goBack())} hitSlop={8} style={{ padding: 4 }}>
              <Icon name="chevronL" size={26} />
            </Pressable>
          ) : left}
        </View>

        {title ? (
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
        ) : <View style={{ flex: 1 }} />}

        <View style={[styles.side, { justifyContent: 'flex-end' }]}>
          {right}
          {actions?.map((a, i) => (
            <Pressable key={i} onPress={a.onPress} hitSlop={8} style={{ padding: 6 }}>
              {a.icon ? <Icon name={a.icon} size={22} color={a.color || tokens.text} /> :
                <Text style={{ fontFamily: fonts.uiBold, color: a.color || tokens.primary, fontSize: 14 }}>{a.label}</Text>}
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, backgroundColor: tokens.bg },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  side: { flexDirection: 'row', alignItems: 'center', minWidth: 60, flex: 1, gap: 4 },
  title: { fontFamily: fonts.uiBold, fontSize: 16, color: tokens.text, flex: 2, textAlign: 'center' },
});
