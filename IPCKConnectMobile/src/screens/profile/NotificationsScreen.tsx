import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, IconName, ScreenContainer, TopBar } from '../../components';
import { useNotifications } from '../../api/hooks';

export default function NotificationsScreen() {
  const notifications = useNotifications();
  const grouped = notifications.reduce<Record<string, typeof notifications>>((acc, n) => {
    (acc[n.group] = acc[n.group] || []).push(n);
    return acc;
  }, {});
  return (
    <ScreenContainer padded={false}>
      <TopBar back title="Notifications" actions={[{ label: 'Mark all read' }]} />
      {Object.entries(grouped).map(([day, items]) => (
        <View key={day}>
          <Text style={styles.group}>{day.toUpperCase()}</Text>
          {items.map((n, i) => (
            <Pressable key={n.id} style={[styles.row, n.unread && { backgroundColor: tokens.surfaceTint }]}>
              <View style={[styles.icon, { backgroundColor: n.color }]}>
                <Icon name={n.icon as IconName} size={18} color="#fff" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'baseline' }}>
                  <Text style={[styles.title, n.unread && styles.titleUnread]}>{n.title}</Text>
                  <Text style={styles.when}>{n.when}</Text>
                </View>
                <Text style={styles.sub} numberOfLines={1}>{n.subtitle}</Text>
              </View>
              {n.unread && <View style={styles.unreadDot} />}
            </Pressable>
          ))}
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  group: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  row: { flexDirection: 'row', gap: 12, padding: 14, paddingHorizontal: 20, alignItems: 'center' },
  icon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 14, color: tokens.text },
  titleUnread: { fontFamily: fonts.uiBold },
  when: { fontFamily: fonts.mono, fontSize: 11, color: tokens.textSecondary },
  sub: { fontFamily: fonts.ui, fontSize: 13, color: tokens.textSecondary, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: tokens.primary },
});
