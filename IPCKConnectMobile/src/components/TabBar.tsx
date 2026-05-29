// Custom-styled bottom tab bar — used by RootNavigator via BottomTabNavigator.
// This file is reserved for tab visuals if you want to override the default — currently the navigator uses default styling.
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../theme/tokens';
import { fonts } from '../theme/typography';
import { Icon, IconName } from './Icon';

const TABS: { key: string; label: string; icon: IconName; route: string }[] = [
  { key: 'today',     label: 'Today',     icon: 'today',     route: 'TodayHome' },
  { key: 'watch',     label: 'Watch',     icon: 'watch',     route: 'WatchList' },
  { key: 'give',      label: 'Give',      icon: 'give',      route: 'GiveHome' },
  { key: 'community', label: 'Community', icon: 'community', route: 'CommunityHome' },
  { key: 'profile',   label: 'Profile',   icon: 'profile',   route: 'ProfileHome' },
];

export function TabBarCustom({ active, onChange }: { active: string; onChange: (k: string) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map(t => {
        const on = active === t.key;
        return (
          <Pressable key={t.key} onPress={() => onChange(t.key)} style={styles.item}>
            <Icon name={t.icon} size={22} color={on ? tokens.primary : tokens.textSecondary} strokeWidth={on ? 2 : 1.6} />
            <Text style={[styles.lbl, { color: on ? tokens.primary : tokens.textSecondary, fontFamily: on ? fonts.uiBold : fonts.ui }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', backgroundColor: tokens.bg,
    borderTopWidth: 1, borderTopColor: tokens.borderSoft, paddingTop: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 4 },
  lbl: { fontSize: 11 },
});
