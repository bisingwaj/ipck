import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Button, GeoArt } from '../../components';

const W = Dimensions.get('window').width;

const PAGES = [
  { art: 'verse' as const,     eyebrow: 'DAILY TEACHING',  title: 'Your church,\nevery morning.', body: 'A short verse and a teaching from your pastor, delivered to your phone before the day starts.' },
  { art: 'live' as const,      eyebrow: 'WATCH & LISTEN',  title: 'Sundays\nnever missed.',       body: 'Watch the service live or catch up later. Every sermon, in your pocket.' },
  { art: 'community' as const, eyebrow: 'WALK TOGETHER',   title: 'Pray together,\ngrow together.', body: 'Join groups, share prayer requests, and stay close to your family at IPCK.' },
  { art: 'give' as const,      eyebrow: 'GIVE WITH JOY',   title: 'Give from\nanywhere.',          body: 'Tithes and offerings via Airtel Money, M-Pesa, Orange Money or card.' },
];

export default function OnboardingScreen() {
  const nav = useNavigation<any>();
  const [idx, setIdx] = useState(0);
  const ref = useRef<ScrollView>(null);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIdx(Math.round(e.nativeEvent.contentOffset.x / W));
  };
  const next = () => {
    if (idx < PAGES.length - 1) {
      ref.current?.scrollTo({ x: (idx + 1) * W, animated: true });
    } else {
      nav.navigate('SignUp');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
      >
        {PAGES.map((p, i) => (
          <View key={i} style={{ width: W, paddingTop: 96, paddingHorizontal: 28 }}>
            <View style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 28 }}>
              <GeoArt kind={p.art} height={220} />
            </View>
            <Text style={styles.eyebrow}>{p.eyebrow}</Text>
            <Text style={styles.h1}>{p.title}</Text>
            <Text style={styles.body}>{p.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <View key={i} style={[styles.dot, idx === i && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <Button onPress={next} fullWidth>{idx < PAGES.length - 1 ? 'Continue' : 'Get started'}</Button>
        <Text onPress={() => nav.navigate('Phone')} style={styles.skip}>I already have an account</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.primary, marginBottom: 10 },
  h1: { fontFamily: fonts.serifBold, fontSize: 34, lineHeight: 40, color: tokens.editorialInk, letterSpacing: -0.5 },
  body: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 24, color: tokens.textSecondary, marginTop: 14 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: tokens.border },
  dotActive: { width: 18, backgroundColor: tokens.primary },
  footer: { paddingHorizontal: 24, paddingBottom: 36, gap: 16 },
  skip: { textAlign: 'center', fontFamily: fonts.uiBold, color: tokens.textSecondary, fontSize: 14 },
});
