import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  KeyboardAvoidingView, Platform, Animated, Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { fonts } from '../../theme/typography';
import { Icon, GeoArt, Pill, VideoPlayer } from '../../components';
import { useWallet, useLiveAmens, useLiveSession, useLiveContent } from '../../api/hooks';
import { useSendLiveAmen } from '../../api/mutations';
import { USE_MOCKS } from '../../api/config';

// ─────────────────────────────────────────────────────────────
// LiveScreen
//
// Vertical stack:
//   [stream + floating amens overlay]
//   [tab switcher: Chat | Verse | Pray]
//   [tab body]
//   [composer: amen coin buttons + chat input + wallet readout]
//
// Amen reactions: a "praying hands" SVG floats up from the
// bottom-right of the stream area when anyone sends amens.
// Bigger gifts = larger glyph + longer dwell.
// ─────────────────────────────────────────────────────────────

type Tab = 'chat' | 'verse' | 'pray';

interface AmenReaction {
  id: number;
  coins: number;
  who: string;
  startX: number;
}

const COIN_OPTIONS = [1, 5, 10, 25];

export default function LiveScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const initialWallet = useWallet();
  const liveAmens = useLiveAmens();
  const session = useLiveSession();
  const liveContent = useLiveContent();            // lien vidéo live (YouTube/HLS) piloté par le dashboard
  const liveUrl = liveContent?.videoUrl;
  const streamTitle = liveContent?.title ?? session?.title ?? 'Live service';
  const streamSpeaker = liveContent?.speaker ?? session?.speaker;
  const sendAmenMut = useSendLiveAmen(USE_MOCKS ? undefined : session?.id);

  const [tab, setTab] = useState<Tab>('chat');
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>(CHAT);
  const [balance, setBalance] = useState(initialWallet.balanceCoins);
  const [reactions, setReactions] = useState<AmenReaction[]>([]);
  // Totaux du service : source de vérité = backend (session). 0 jusqu'au chargement.
  const [stats, setStats] = useState({ amenCount: 0, amenCoins: 0 });
  const reactionId = useRef(0);

  // Synchronise le compteur sur les vraies valeurs de la session.
  useEffect(() => {
    if (session) setStats({ amenCount: session.amenCount, amenCoins: session.amenCoins });
  }, [session?.amenCount, session?.amenCoins]);

  // Réactions flottantes d'ambiance (rejoue les amens récents réels) — n'affecte PAS le compteur.
  useEffect(() => {
    let cancelled = false;
    function loop() {
      if (cancelled) return;
      const pick = liveAmens[Math.floor(Math.random() * liveAmens.length)];
      if (pick) pushReaction(pick.coins, pick.who);
      const delay = 1400 + Math.random() * 2400;
      setTimeout(loop, delay);
    }
    const t = setTimeout(loop, 800);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  function pushReaction(coins: number, who: string) {
    const id = ++reactionId.current;
    setReactions(rs => [...rs, { id, coins, who, startX: 60 + Math.random() * 200 }]);
    // Auto-remove after the animation
    setTimeout(() => {
      setReactions(rs => rs.filter(r => r.id !== id));
    }, 3000 + coins * 60);
  }

  async function sendAmen(coins: number) {
    // Pré-check optimiste : pas assez de solde → on redirige vers la recharge.
    if (balance < coins) {
      nav.navigate('WalletTopup');
      return;
    }
    setBalance(b => b - coins);
    pushReaction(coins, 'You');
    setStats(s => ({ amenCount: s.amenCount + 1, amenCoins: s.amenCoins + coins })); // optimiste
    try {
      const res = await sendAmenMut.mutateAsync(coins);
      // Le backend est la source de vérité : solde + totaux du service.
      if (!USE_MOCKS) {
        setBalance(res.balanceCoins);
        setStats({ amenCount: res.amenCount, amenCoins: res.amenCoins });
      }
    } catch (e: any) {
      setBalance(b => b + coins); // rollback solde
      setStats(s => ({ amenCount: Math.max(0, s.amenCount - 1), amenCoins: Math.max(0, s.amenCoins - coins) })); // rollback compteur
      if (e?.response?.data?.code === 'INSUFFICIENT_BALANCE') {
        nav.navigate('WalletTopup');
      }
    }
  }

  function sendChat() {
    const text = msg.trim();
    if (!text) return;
    setChat(c => [{ who: 'You', t: text, ago: 'now' }, ...c]);
    setMsg('');
  }

  const lowBalance = balance < 5;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.editorialInk }}>
      {/* STREAM AREA + floating amens overlay */}
      <View style={[styles.stream, { paddingTop: insets.top }]}>
        {liveUrl ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <VideoPlayer url={liveUrl} height={280} autoplay />
          </View>
        ) : (
          <>
            <GeoArt kind="live" height={260}/>
            <View style={styles.streamOverlay}/>
          </>
        )}
        <Pressable onPress={() => nav.goBack()} style={[styles.closeBtn, { top: insets.top + 8 }]}>
          <Icon name="close" size={22} color="#fff"/>
        </Pressable>
        <View pointerEvents="none" style={[styles.streamTop, { top: insets.top + 8 }]}>
          <Pill tone="live">{session?.state === 'live' || liveContent ? '● LIVE' : 'REPLAY'}</Pill>
          <View style={styles.viewerCount}>
            <Icon name="eye" size={12} color="#fff"/>
            <Text style={styles.viewerCountTxt}>{session?.viewersLive ?? 0}</Text>
          </View>
        </View>

        {!liveUrl && (
          <View style={styles.streamCenter}>
            <Text style={styles.streamTitle} numberOfLines={2} ellipsizeMode="tail">{streamTitle}</Text>
            {!!streamSpeaker && <Text style={styles.streamSpeaker} numberOfLines={1} ellipsizeMode="tail">{streamSpeaker}</Text>}
          </View>
        )}

        {/* Amen meter at bottom of stream (masqué quand le lecteur réel occupe l'espace) */}
        {!liveUrl && <View style={[styles.amenMeter, { bottom: 12 }]}>
          <View style={styles.amenMeterIcon}>
            <Icon name="pray" size={14} color={tokens.accent}/>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.amenMeterLbl}>AMENS THIS SERVICE</Text>
            <Text style={styles.amenMeterVal}>
              <Text style={{ fontFamily: fonts.uiBold }}>{stats.amenCount}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.55)' }}>  ·  </Text>
              <Text style={{ fontFamily: fonts.uiBold }}>{stats.amenCoins}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.55)' }}> Blessings given</Text>
            </Text>
          </View>
        </View>}

        {/* Floating amens — absolutely positioned, no pointer events */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {reactions.map(r => (
            <AmenGlyph key={r.id} coins={r.coins} who={r.who} startX={r.startX}/>
          ))}
        </View>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabs}>
        {(['chat', 'verse', 'pray'] as Tab[]).map(t => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabOn]}>
            <Icon
              name={t === 'chat' ? 'community' : t === 'verse' ? 'verse' : 'pray'}
              size={14}
              color={tab === t ? tokens.accent : 'rgba(255,255,255,0.5)'}
            />
            <Text style={[styles.tabTxt, tab === t && styles.tabTxtOn]}>
              {t === 'chat' ? 'Chat' : t === 'verse' ? 'Verse' : 'Pray'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'chat' && <ChatPane messages={chat}/>}
        {tab === 'verse' && <VersePane/>}
        {tab === 'pray' && <PrayPane/>}
      </View>

      {/* COMPOSER */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Wallet readout + topup link */}
        <Pressable onPress={() => nav.navigate('Wallet')} style={styles.walletRow}>
          <View style={styles.walletHands}>
            <Icon name="pray" size={14} color={tokens.accent}/>
          </View>
          <Text style={styles.walletBal}>
            <Text style={{ fontFamily: fonts.uiBold, color: '#fff' }}>{balance}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)' }}> Blessings</Text>
          </Text>
          {lowBalance && (
            <View style={styles.lowPill}>
              <Text style={styles.lowPillTxt}>Low</Text>
            </View>
          )}
          <Pressable
            onPress={() => nav.navigate('WalletTopup')}
            style={styles.topupBtn}
            hitSlop={6}
          >
            <Icon name="plus" size={13} color={tokens.accent}/>
            <Text style={styles.topupBtnTxt}>Top up</Text>
          </Pressable>
        </Pressable>

        {/* Amen quick buttons */}
        <View style={styles.amenRow}>
          {COIN_OPTIONS.map(c => {
            const canAfford = balance >= c;
            return (
              <Pressable
                key={c}
                onPress={() => sendAmen(c)}
                style={[styles.amenBtn, !canAfford && styles.amenBtnDisabled]}
              >
                <Icon name="pray" size={14} color={canAfford ? tokens.accent : 'rgba(255,255,255,0.3)'}/>
                <Text style={[styles.amenBtnTxt, !canAfford && { color: 'rgba(255,255,255,0.3)' }]}>
                  Amen · {c}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Composer text input */}
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            value={msg}
            onChangeText={setMsg}
            onSubmitEditing={sendChat}
            returnKeyType="send"
            placeholder="Say something kind…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.composerInput}
          />
          <Pressable style={styles.send} onPress={sendChat}><Icon name="send" size={18} color="#fff"/></Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// AmenGlyph — one floating "amen" reaction
// ─────────────────────────────────────────────────────────────

function AmenGlyph({ coins, who, startX }: { coins: number; who: string; startX: number }) {
  const ty = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  // Larger gifts = larger glyph, longer rise
  const size = coins >= 25 ? 56 : coins >= 10 ? 44 : coins >= 5 ? 36 : 28;
  const rise = coins >= 25 ? 220 : coins >= 10 ? 200 : 170;
  const duration = 2400 + coins * 40;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.delay(duration - 700),
        Animated.timing(opacity, { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
      Animated.timing(ty, { toValue: -rise, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(drift, { toValue: (Math.random() - 0.5) * 36, duration, useNativeDriver: true }),
    ]).start();
  }, []);

  const color = coins >= 25 ? tokens.accent : '#fff';

  return (
    <Animated.View style={{
      position: 'absolute',
      bottom: 48, left: startX,
      transform: [{ translateY: ty }, { translateX: drift }],
      opacity,
      alignItems: 'center',
    }}>
      <View style={[styles.glyphBubble, { width: size, height: size, borderRadius: size / 2, backgroundColor: coins >= 25 ? 'rgba(255,176,32,0.18)' : 'rgba(255,255,255,0.14)' }]}>
        <Icon name="pray" size={size * 0.55} color={color}/>
      </View>
      <Text style={styles.glyphLabel}>
        {who === 'You' ? 'You' : who}  ·  <Text style={{ fontFamily: fonts.uiBold, color }}>{coins}</Text>
      </Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab panes
// ─────────────────────────────────────────────────────────────

interface ChatMessage { who: string; t: string; ago: string }

const CHAT: ChatMessage[] = [
  { who: 'Joseph K.', t: 'Powerful word this morning, pastor.', ago: '2m' },
  { who: 'Nadine B.', t: 'Can someone send the verse reference?', ago: '3m' },
  { who: 'Pierre T.', t: 'Ephesians 2:8-9', ago: '3m' },
  { who: 'Marie-Anne', t: 'Amen 🙌', ago: '5m' },
  { who: 'Claude L.', t: 'Joining from Lubumbashi. Blessings.', ago: '8m' },
];

function ChatPane({ messages }: { messages: ChatMessage[] }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
      {messages.map((m, i) => (
        <View key={i} style={styles.chatRow}>
          <View style={styles.chatAvt}><Text style={styles.chatAvtTxt}>{m.who[0]}</Text></View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'baseline' }}>
              <Text style={styles.chatWho} numberOfLines={1} ellipsizeMode="tail">{m.who}</Text>
              <Text style={styles.chatAgo} numberOfLines={1}>{m.ago}</Text>
            </View>
            <Text style={styles.chatTxt}>{m.t}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function VersePane() {
  return (
    <View style={styles.pane}>
      <Text style={styles.paneEyebrow}>PASTOR PUSHED A VERSE</Text>
      <Text style={styles.paneVerse}>
        "For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God."
      </Text>
      <Text style={styles.paneRef}>EPHESIANS 2:8 · NIV</Text>
    </View>
  );
}

function PrayPane() {
  return (
    <View style={styles.pane}>
      <Text style={styles.paneEyebrow}>PRAY WITH US</Text>
      <Text style={styles.paneVerse}>
        Father, thank You for the gift of grace. We did not earn it. We could not earn it. Help us today to live as people who are loved — not as people trying to be loved.
      </Text>
      <Text style={styles.paneRef}>Pastor Mukendi · in this moment</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  stream: { height: 280, backgroundColor: tokens.editorialInk, position: 'relative', overflow: 'hidden' },
  streamOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(20,24,31,0.4)' } as any,
  closeBtn: { position: 'absolute', left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  streamTop: { position: 'absolute', right: 16, flexDirection: 'row', gap: 6, alignItems: 'center', zIndex: 2 },
  viewerCount: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  viewerCountTxt: { fontFamily: fonts.uiBold, fontSize: 11, color: '#fff' },
  streamCenter: { position: 'absolute', left: 0, right: 0, top: '52%', alignItems: 'center', paddingHorizontal: 16 },
  streamTitle: { fontFamily: fonts.serifBold, fontSize: 22, color: '#fff', textAlign: 'center' },
  streamSpeaker: { fontFamily: fonts.uiMedium, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  amenMeter: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.45)' },
  amenMeterIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,176,32,0.18)', alignItems: 'center', justifyContent: 'center' },
  amenMeterLbl: { fontFamily: fonts.uiBold, fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.7)' },
  amenMeterVal: { fontFamily: fonts.ui, fontSize: 13, color: '#fff', marginTop: 1 },

  // Glyph
  glyphBubble: { alignItems: 'center', justifyContent: 'center' },
  glyphLabel: { fontFamily: fonts.ui, fontSize: 10, color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  tabs: { flexDirection: 'row', backgroundColor: '#1A1F28', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  tab: { flex: 1, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: tokens.accent },
  tabTxt: { fontFamily: fonts.uiMedium, fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  tabTxtOn: { color: '#fff', fontFamily: fonts.uiBold },

  pane: { padding: 18, gap: 8 },
  paneEyebrow: { fontFamily: fonts.uiBold, fontSize: 10, letterSpacing: 1.4, color: tokens.accent },
  paneVerse: { fontFamily: fonts.serifItalic, fontSize: 16, lineHeight: 24, color: '#fff', marginTop: 4 },
  paneRef: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

  // Chat
  chatRow: { flexDirection: 'row', gap: 10 },
  chatAvt: { width: 28, height: 28, borderRadius: 14, backgroundColor: tokens.primary, alignItems: 'center', justifyContent: 'center' },
  chatAvtTxt: { fontFamily: fonts.uiBold, fontSize: 12, color: '#fff' },
  chatWho: { fontFamily: fonts.uiBold, fontSize: 12, color: '#fff', flexShrink: 1 },
  chatAgo: { fontFamily: fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  chatTxt: { fontFamily: fonts.ui, fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 1 },

  // Wallet readout
  walletRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', backgroundColor: '#10141B' },
  walletHands: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,176,32,0.18)', alignItems: 'center', justifyContent: 'center' },
  walletBal: { fontFamily: fonts.ui, fontSize: 13 },
  lowPill: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 4, backgroundColor: 'rgba(229,72,77,0.18)' },
  lowPillTxt: { fontFamily: fonts.uiBold, fontSize: 10, color: tokens.error, letterSpacing: 0.5 },
  topupBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: 'rgba(255,176,32,0.14)' },
  topupBtnTxt: { fontFamily: fonts.uiBold, fontSize: 12, color: tokens.accent },

  // Amen row
  amenRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, backgroundColor: '#10141B' },
  amenBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(255,176,32,0.16)', borderWidth: 1, borderColor: 'rgba(255,176,32,0.28)' },
  amenBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)' },
  amenBtnTxt: { fontFamily: fonts.uiBold, fontSize: 12, color: tokens.accent },

  // Composer
  composer: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, backgroundColor: '#10141B' },
  composerInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 99, color: '#fff', fontFamily: fonts.ui, fontSize: 14 },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: tokens.primary, alignItems: 'center', justifyContent: 'center' },
});
