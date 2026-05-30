import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { confirm, Icon, IconName, ScreenContainer, toast, TopBar } from '../../components';
import { useAuth } from '../../auth/AuthContext';
import { useMyAppointments, useGiftHistory } from '../../api/hooks';

interface Row { icon: IconName; t: string; s: string; route?: string; destructive?: boolean; toggle?: boolean }

export default function ProfileHomeScreen() {
  const nav = useNavigation<any>();
  const { user, signOut } = useAuth();
  const appointments = useMyAppointments();
  const gifts = useGiftHistory();
  const [lowData, setLowData] = useState(true);

  const fullName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Member' : 'Grace Mbuyi';
  const initials = user
    ? `${(user.firstName ?? '?').charAt(0)}${(user.lastName ?? '').charAt(0)}`.toUpperCase()
    : 'GM';
  const phone = user?.phone ?? '+243 •• ••• ••28';

  // Sous-titres réels.
  const upcoming = appointments.filter(a => a.status !== 'cancelled' && new Date(a.slotStart).getTime() >= Date.now());
  const apptSub = upcoming.length
    ? `${upcoming.length} upcoming · ${upcoming[0].topic?.label ?? 'Appointment'}`
    : 'Book a conversation with a pastor';
  const lastGift = gifts[0];
  const giftSub = lastGift ? `Last gift · $${lastGift.amount} on ${lastGift.date}` : 'No gifts yet';

  const SECTIONS: { title: string; rows: Row[] }[] = [
    { title: 'App', rows: [
      { icon: 'bell',    t: 'Notifications', s: 'Daily teaching, services, groups', route: 'Notifications' },
      { icon: 'wifiOff', t: 'Low-data mode', s: 'Save mobile data on slow networks', toggle: true },
      { icon: 'download', t: 'Downloads',    s: '534 MB used' },
    ]},
    { title: 'Church', rows: [
      { icon: 'cal',       t: 'My appointments', s: apptSub, route: 'MyAppointments' },
      { icon: 'verse',     t: 'About IPCK',      s: 'Mission, story, service times', route: 'About' },
      { icon: 'community', t: 'Ministries',      s: '8 ministries · find your fit' },
      { icon: 'globe',     t: 'Service times',   s: 'Sun 9:00 & 11:00', route: 'ServiceTimes' },
      { icon: 'phone',     t: 'Contact the office', s: 'Call, WhatsApp, email, map', route: 'Contact' },
    ]},
    { title: 'Giving', rows: [
      { icon: 'give',     t: 'Giving history',     s: giftSub, route: 'GiveHistory' },
      { icon: 'cal',      t: 'Recurring gifts',    s: '1 active · $50/mo' },
      { icon: 'download', t: 'Year-end statement', s: '2025 available' },
    ]},
    { title: 'Privacy & account', rows: [
      { icon: 'lock',  t: 'Privacy & Terms', s: 'What we collect, what we don\'t' },
      { icon: 'close', t: 'Sign out',         s: '', destructive: true },
    ]},
  ];

  const onSignOut = async () => {
    const ok = await confirm({
      title: 'Sign out',
      message: 'Are you sure you want to sign out? You are always welcome back home.',
      confirmLabel: 'Sign out',
      cancelLabel: 'Stay',
      destructive: true,
    });
    if (ok) signOut();
  };

  const handleRow = (r: { t: string; route?: string; toggle?: boolean }) => {
    if (r.toggle) return;
    if (r.route) return nav.navigate(r.route);
    if (r.t === 'Sign out') return onSignOut();
    toast.info(r.t, 'Coming soon — on its way.');
  };

  return (
    <ScreenContainer>
      <TopBar
        titleLarge="Profile"
        actions={[{ icon: 'bell', onPress: () => nav.navigate('Notifications') }]}
      />

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.avt}><Text style={styles.avtTxt}>{initials}</Text></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{fullName}</Text>
          <Text style={styles.phone} numberOfLines={1}>{phone}</Text>
        </View>
        <Pressable style={styles.editBtn} onPress={() => nav.navigate('ProfileSetup')}><Text style={styles.editTxt}>Edit</Text></Pressable>
      </View>

      {SECTIONS.map(sec => (
        <View key={sec.title} style={{ marginTop: 18 }}>
          <Text style={styles.sectionLbl}>{sec.title.toUpperCase()}</Text>
          <View style={styles.group}>
            {sec.rows.map((r, i) => (
              <Pressable
                key={r.t}
                onPress={() => handleRow(r)}
                style={[styles.row, i < sec.rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: tokens.borderSoft }]}
              >
                <View style={[styles.rowIcon, r.destructive && { backgroundColor: tokens.errorTint }]}>
                  <Icon name={r.icon} size={18} color={r.destructive ? tokens.error : tokens.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.rowTitle, r.destructive && { color: tokens.error }]} numberOfLines={1} ellipsizeMode="tail">{r.t}</Text>
                  {r.s ? <Text style={styles.rowSub} numberOfLines={1}>{r.s}</Text> : null}
                </View>
                {r.toggle ? <Switch value={lowData} onValueChange={setLowData} /> : <Icon name="chevron" size={16} color={tokens.textTertiary} />}
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.versionTxt}>IPCK Connect · v1.0.0</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  avt: { width: 72, height: 72, borderRadius: 22, backgroundColor: tokens.primary, alignItems: 'center', justifyContent: 'center' },
  avtTxt: { fontFamily: fonts.uiBold, fontSize: 26, color: '#fff' },
  name: { fontFamily: fonts.serifBold, fontSize: 22, color: tokens.editorialInk, letterSpacing: -0.3 },
  phone: { fontFamily: fonts.mono, fontSize: 12, color: tokens.textSecondary, marginTop: 4 },
  editBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: tokens.surface },
  editTxt: { fontFamily: fonts.uiBold, fontSize: 12, color: tokens.text },
  sectionLbl: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginBottom: 8, paddingLeft: 4 },
  group: { borderRadius: 14, borderWidth: 1, borderColor: tokens.borderSoft, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: tokens.surfaceTint, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.uiMedium, fontSize: 14, color: tokens.text },
  rowSub: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 1 },
  versionTxt: { fontFamily: fonts.uiBold, fontSize: 10, letterSpacing: 1.2, color: tokens.textTertiary, textAlign: 'center', marginTop: 28 },
});
