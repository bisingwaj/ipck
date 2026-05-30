import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, IconName, ScreenContainer, TopBar, VideoPlayer, toast } from '../../components';
import { useContent, useContentItem } from '../../api/hooks';
import { categoryLabel } from '../../api/format';
import { Content, ContentCategory } from '../../data/mock';

// Accents de couleur par catégorie (chip, eyebrows, icônes).
const CATEGORY_COLOR: Record<ContentCategory, string> = {
  sermon: tokens.primary,
  podcast: '#5B3FB8',
  teaching: '#0FA38C',
  worship: tokens.accent,
  testimony: tokens.error,
  other: tokens.textSecondary,
};

export default function ContentDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const c = useContentItem(route.params?.id);
  const all = useContent();
  const [saved, setSaved] = useState(false);

  // « More to watch » : même catégorie d'abord, puis le reste (hors live et hors courant).
  const more = useMemo(() => {
    if (!c) return [];
    const others = all.filter(x => x.id !== c.id && !x.isLive);
    const same = others.filter(x => x.category === c.category);
    const rest = others.filter(x => x.category !== c.category);
    return [...same, ...rest].slice(0, 5);
  }, [all, c]);

  if (!c) {
    return (
      <ScreenContainer>
        <TopBar back title="Watch" />
        <Text style={styles.meta}>Loading…</Text>
      </ScreenContainer>
    );
  }

  const accent = CATEGORY_COLOR[c.category] ?? tokens.primary;

  const onShare = () => {
    Share.share({ message: `${c.title}${c.speaker ? ` — ${c.speaker}` : ''}\n${c.videoUrl}` }).catch(() => {});
  };
  // Toggle « Save » : ajout/retrait des favoris (état + feedback, pas de navigation).
  const onSave = () => {
    setSaved(prev => {
      const next = !prev;
      if (next) toast.success('Saved', `"${c.title}" added to your favorites — return and be nourished.`);
      else toast.info('Removed', `"${c.title}" removed from your favorites.`);
      return next;
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <TopBar
        back
        actions={[
          { icon: 'share', onPress: onShare },
          { icon: 'bookmark', color: saved ? tokens.primary : undefined, onPress: onSave },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* Lecteur — MP4 auto-hébergé / HLS */}
        <VideoPlayer url={c.videoUrl} height={210} autoplay={false} />

        {/* Chip catégorie coloré + série */}
        <View style={styles.metaRow}>
          {c.isLive ? (
            <View style={[styles.chip, { backgroundColor: tokens.errorTint }]}>
              <View style={[styles.dot, { backgroundColor: tokens.error }]} />
              <Text style={[styles.chipTxt, { color: tokens.error }]}>LIVE</Text>
            </View>
          ) : (
            <View style={[styles.chip, { backgroundColor: accent + '22' }]}>
              <Text style={[styles.chipTxt, { color: accent }]}>{categoryLabel(c.category).toUpperCase()}</Text>
            </View>
          )}
          {!!c.series && <Text style={[styles.series, { color: accent }]} numberOfLines={1}>{c.series.toUpperCase()}</Text>}
        </View>

        <Text style={styles.title}>{c.title}</Text>
        <Text style={styles.meta} numberOfLines={2}>
          {[c.speaker, c.duration].filter(Boolean).join(' · ')}
        </Text>

        {/* Boutons d'action — Save (toggle favoris), Share (feuille native), Give (→ flux de don) */}
        <View style={styles.actions}>
          <ActionButton icon="bookmark" label={saved ? 'Saved' : 'Save'} color={tokens.primary} active={saved} onPress={onSave} />
          <ActionButton icon="share" label="Share" color="#0FA38C" onPress={onShare} />
          <ActionButton icon="give" label="Give" color={tokens.accent} onPress={() => nav.navigate('GiveAmount')} />
        </View>

        {/* Live → rejoindre */}
        {c.isLive && (
          <Pressable onPress={() => nav.navigate('Live')} style={styles.liveCta}>
            <Icon name="pray" size={16} color="#fff" />
            <Text style={styles.liveCtaTxt}>Join the live · send an Amen</Text>
            <Icon name="chevron" size={16} color="#fff" />
          </Pressable>
        )}

        {/* About */}
        {!!c.description && (
          <View style={styles.section}>
            <Text style={[styles.eyebrow, { color: accent }]}>ABOUT</Text>
            <View style={[styles.aboutCard, { borderLeftColor: accent }]}>
              <Text style={styles.body}>{c.description}</Text>
            </View>
          </View>
        )}

        {/* More to watch */}
        {more.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.eyebrow, { color: tokens.accent }]}>MORE TO WATCH</Text>
            {more.map(item => (
              <MoreRow key={item.id} item={item} onOpen={() => nav.push('ContentDetail', { id: item.id })} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ActionButton({ icon, label, color, onPress, active }: { icon: IconName; label: string; color: string; onPress: () => void; active?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.action, active && { borderColor: color, backgroundColor: color + '12' }]}>
      <View style={[styles.actionIcon, { backgroundColor: active ? color : color + '1A' }]}>
        <Icon name={icon} size={20} color={active ? '#fff' : color} strokeWidth={active ? 2.4 : 2} />
      </View>
      <Text style={[styles.actionLbl, active && { color }]}>{label}</Text>
    </Pressable>
  );
}

function MoreRow({ item, onOpen }: { item: Content; onOpen: () => void }) {
  const accent = CATEGORY_COLOR[item.category] ?? tokens.primary;
  return (
    <Pressable onPress={onOpen} style={styles.moreRow}>
      <View style={styles.moreThumb}>
        <Icon name="play" size={18} color="#fff" />
        <View style={[styles.moreThumbBar, { backgroundColor: accent }]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.moreCat, { color: accent }]} numberOfLines={1}>{categoryLabel(item.category).toUpperCase()}</Text>
        <Text style={styles.moreTitle} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
        <Text style={styles.moreMeta} numberOfLines={1} ellipsizeMode="tail">{[item.speaker, item.duration].filter(Boolean).join(' · ')}</Text>
      </View>
      <Icon name="chevron" size={16} color={tokens.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  chipTxt: { fontFamily: fonts.uiBold, fontSize: 10, letterSpacing: 1 },
  series: { fontFamily: fonts.uiBold, fontSize: 10, letterSpacing: 1.2 },
  title: { fontFamily: fonts.serifBold, fontSize: 26, lineHeight: 32, color: tokens.editorialInk, letterSpacing: -0.4, marginTop: 10 },
  meta: { fontFamily: fonts.ui, fontSize: 13, color: tokens.textSecondary, marginTop: 6 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  action: { flex: 1, alignItems: 'center', gap: 7, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: tokens.borderSoft, backgroundColor: tokens.bg },
  actionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  actionLbl: { fontFamily: fonts.uiBold, fontSize: 12, color: tokens.text },

  liveCta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, backgroundColor: tokens.editorialInk },
  liveCtaTxt: { flex: 1, fontFamily: fonts.uiBold, fontSize: 14, color: '#fff' },

  section: { marginTop: 28 },
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, marginBottom: 12 },
  aboutCard: { borderLeftWidth: 3, paddingLeft: 16, paddingVertical: 4 },
  body: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 25, color: tokens.text },

  moreRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  moreThumb: { width: 76, height: 52, borderRadius: 10, backgroundColor: tokens.editorialInk, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  moreThumbBar: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3 },
  moreCat: { fontFamily: fonts.uiBold, fontSize: 9, letterSpacing: 1.1 },
  moreTitle: { fontFamily: fonts.serifMed, fontSize: 15, lineHeight: 20, color: tokens.editorialInk, marginTop: 2 },
  moreMeta: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
});
