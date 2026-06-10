import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, ScreenContainer, toast, TopBar, GeoArt, Pill } from '../../components';
import { useContent, useLiveContent } from '../../api/hooks';
import { categoryLabel } from '../../api/format';
import { Content, ContentCategory } from '../../data/mock';

// Ordre d'affichage préféré des catégories (seules les non-vides s'affichent).
const CATEGORY_ORDER: ContentCategory[] = ['sermon', 'podcast', 'teaching', 'worship', 'testimony', 'other'];

export default function WatchListScreen() {
  const nav = useNavigation<any>();
  const content = useContent();
  const live = useLiveContent();
  const [category, setCategory] = useState<ContentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Catégories réellement présentes (dynamique) + comptage.
  const presentCategories = useMemo(
    () => CATEGORY_ORDER.filter(cat => content.some(c => c.category === cat && !c.isLive)),
    [content],
  );

  // Sections à rendre selon le filtre. Le contenu live est dans la bannière → exclu des listes.
  const sections = useMemo(() => {
    let vod = content.filter(c => !c.isLive);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      vod = vod.filter(c => 
        c.title.toLowerCase().includes(q) || 
        (c.speaker && c.speaker.toLowerCase().includes(q)) || 
        (c.series && c.series.toLowerCase().includes(q))
      );
    }
    const cats = category === 'all' ? presentCategories : presentCategories.filter(c => c === category);
    return cats
      .map(cat => ({ cat, items: vod.filter(c => c.category === cat) }))
      .filter(s => s.items.length > 0);
  }, [content, category, presentCategories, searchQuery]);

  return (
    <ScreenContainer>
      <TopBar
        titleLarge="Watch"
        actions={[{ icon: 'search', onPress: () => {
          setIsSearching(!isSearching);
          if (isSearching) setSearchQuery('');
        }}]}
      />

      {isSearching && (
        <View style={styles.searchWrap}>
          <Icon name="search" size={18} color={tokens.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sermons, series, speakers..."
            placeholderTextColor={tokens.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {!!searchQuery && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Icon name="close" size={18} color={tokens.textSecondary} />
            </Pressable>
          )}
        </View>
      )}

      {/* Bannière live — pilotée par le contenu marqué isLive depuis le dashboard */}
      {!isSearching && live && (
        <Pressable onPress={() => nav.navigate('Live')} style={styles.liveBanner}>
          <View style={StyleSheet.absoluteFill}>
            <GeoArt kind="live" height={160} />
          </View>
          <View style={styles.liveOverlay} />
          <View style={{ flex: 1, padding: 18, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pill tone="live">● LIVE NOW</Pill>
              {!!live.series && <Pill tone="muted">{live.series}</Pill>}
            </View>
            <View>
              <Text style={styles.liveEyebrow} numberOfLines={1}>{categoryLabel(live.category).toUpperCase()}</Text>
              <Text style={styles.liveTitle} numberOfLines={2} ellipsizeMode="tail">{live.title}</Text>
              {!!live.speaker && <Text style={styles.liveSpeaker} numberOfLines={1} ellipsizeMode="tail">{live.speaker}</Text>}
            </View>
          </View>
        </Pressable>
      )}

      {/* Filtres dynamiques = catégories présentes */}
      <View style={styles.filters}>
        <Chip label="All" on={category === 'all'} onPress={() => setCategory('all')} />
        {presentCategories.map(cat => (
          <Chip key={cat} label={categoryLabel(cat)} on={category === cat} onPress={() => setCategory(cat)} />
        ))}
      </View>

      {sections.length === 0 ? (
        <Text style={styles.empty}>No videos here yet.</Text>
      ) : (
        sections.map(section => (
          <View key={section.cat} style={{ marginBottom: 8 }}>
            <Text style={styles.section}>{categoryLabel(section.cat).toUpperCase()}</Text>
            {section.items.map(item => (
              <ContentRow key={item.id} item={item} onOpen={() => nav.navigate('ContentDetail', { id: item.id })} />
            ))}
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filter, on && styles.filterOn]}>
      <Text style={[styles.filterTxt, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

function ContentRow({ item, onOpen }: { item: Content; onOpen: () => void }) {
  return (
    <Pressable onPress={onOpen} style={styles.row}>
      <View style={styles.thumb}>
        <Icon name="play" size={20} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        {!!item.series && <Text style={styles.rowSeries} numberOfLines={1}>{item.series.toUpperCase()}</Text>}
        <Text style={styles.rowTitle} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
        <Text style={styles.rowMeta} numberOfLines={1} ellipsizeMode="tail">
          {[item.speaker, item.duration].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Pressable hitSlop={8} onPress={() => toast.success('Saved', `"${item.title}" saved to your favorites — return and be nourished.`)}>
        <Icon name="bookmark" size={18} color={tokens.textTertiary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: tokens.surface, borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 16, gap: 8 },
  searchInput: { flex: 1, fontFamily: fonts.ui, fontSize: 15, color: tokens.text, padding: 0 },
  liveBanner: { height: 160, borderRadius: 14, overflow: 'hidden', marginBottom: 18, flexDirection: 'row' },
  liveOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(20,24,31,0.5)' } as any,
  liveEyebrow: { fontFamily: fonts.uiBold, fontSize: 10, letterSpacing: 1.4, color: 'rgba(255,255,255,0.7)' },
  liveTitle: { fontFamily: fonts.serifBold, fontSize: 20, color: '#fff', marginTop: 4 },
  liveSpeaker: { fontFamily: fonts.uiMedium, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: tokens.surface },
  filterOn: { backgroundColor: tokens.primary },
  filterTxt: { fontFamily: fonts.uiBold, fontSize: 12, color: tokens.text },
  section: { fontFamily: fonts.uiBold, fontSize: 11, letterSpacing: 1.5, color: tokens.textSecondary, marginBottom: 10 },
  empty: { fontFamily: fonts.ui, fontSize: 14, color: tokens.textSecondary, paddingVertical: 24, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: tokens.borderSoft },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: tokens.editorialInk, alignItems: 'center', justifyContent: 'center' },
  rowSeries: { fontFamily: fonts.uiBold, fontSize: 10, letterSpacing: 1.2, color: tokens.primary },
  rowTitle: { fontFamily: fonts.serifMed, fontSize: 16, color: tokens.editorialInk, marginTop: 2 },
  rowMeta: { fontFamily: fonts.ui, fontSize: 12, color: tokens.textSecondary, marginTop: 2 },
});
