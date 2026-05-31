// Hooks de données par domaine. Chaque hook renvoie la MÊME forme que src/data/mock.ts,
// avec les fixtures mock en fallback (jamais vide) → branchement non destructif des écrans.
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from './client';
import { USE_MOCKS } from './config';
import { ago, colorFor, shortDate, fundLabel, devotionalDate } from './format';
import {
  todayDevotional as mockToday,
  pastDevotionals as mockPast,
  sermons as mockSermons,
  contents as mockContents,
  Content,
  myGroups as mockMyGroups,
  allGroups as mockAllGroups,
  prayerWall as mockPrayerWall,
  events as mockEvents,
  funds as mockFunds,
  paymentMethods as mockPaymentMethods,
  giftHistory as mockGiftHistory,
  wallet as mockWallet,
  liveAmens as mockLiveAmens,
  notifications as mockNotifications,
  Devotional,
  Sermon,
  Group,
  Prayer,
  ChurchEvent,
  AmenWallet,
  Notification as Notif,
} from '../data/mock';

// placeholderData: keepPreviousData → en ré-entrée d'écran, on garde les données
// déjà chargées pendant le refetch (pas de flash vers un état vide/placeholder).
const opts = { enabled: !USE_MOCKS, placeholderData: keepPreviousData };

// Données financières/personnelles : en prod on N'AFFICHE JAMAIS de fixtures mock
// (sinon l'utilisateur voit un faux solde « 47 » puis le vrai → effet « corrompu »).
// On part d'un état neutre à zéro, qui se remplit avec les vraies données.
const EMPTY_WALLET: AmenWallet = {
  balanceCoins: 0,
  pendingTopupCoins: 0,
  defaultFund: '—',
  recent: [],
};

export function useTodayDevotional(): Devotional {
  const { data } = useQuery({
    queryKey: ['devotional', 'today'],
    queryFn: async () => {
      const d = (await api.get('/devotionals/today')).data;
      // La date affichée vient de `publishAt` (ISO fiable), pas du champ `date` libre du backend.
      return { ...d, date: devotionalDate(d.publishAt, d.date) } as Devotional;
    },
    ...opts,
  });
  return USE_MOCKS ? mockToday : data ?? mockToday;
}

export function usePastDevotionals(): typeof mockPast {
  const { data } = useQuery({
    queryKey: ['devotionals'],
    queryFn: async () => {
      const rows = (await api.get('/devotionals', { params: { pageSize: 30 } })).data.data;
      return rows.map((d: any) => ({
        id: d.id,
        date: shortDate(d.publishAt) || d.date,
        title: d.title,
        verseRef: d.verseRef,
        read: !!d.read,
      }));
    },
    ...opts,
  });
  return USE_MOCKS ? mockPast : data ?? mockPast;
}

export function useSermons(): Sermon[] {
  const { data } = useQuery({
    queryKey: ['sermons'],
    queryFn: async () => (await api.get('/sermons', { params: { pageSize: 30 } })).data.data as Sermon[],
    ...opts,
  });
  const list = USE_MOCKS ? mockSermons : data ?? mockSermons;
  return list.length ? list : mockSermons;
}

// ───────────────────────── Content vidéo (dynamique) ─────────────────────────

/** Tous les contenus publiés (groupés par catégorie côté écran). */
export function useContent(): Content[] {
  const { data } = useQuery({
    queryKey: ['content'],
    queryFn: async () => (await api.get('/content', { params: { pageSize: 100 } })).data.data as Content[],
    ...opts,
  });
  const list = USE_MOCKS ? mockContents : data ?? mockContents;
  return list.length ? list : mockContents;
}

/** Contenu en direct courant (isLive), ou null. */
export function useLiveContent(): Content | null {
  const { data } = useQuery({
    queryKey: ['content', 'live'],
    queryFn: async () => ((await api.get('/content/live')).data ?? null) as Content | null,
    ...opts,
  });
  if (USE_MOCKS) return mockContents.find(c => c.isLive) ?? null;
  return data ?? null;
}

/** Détail d'un contenu (depuis la liste en cache, sinon mock). */
export function useContentItem(id?: string): Content | null {
  const all = useContent();
  if (!id) return null;
  return all.find(c => c.id === id) ?? null;
}

export function useMyGroups(): Group[] {
  const { data } = useQuery({
    queryKey: ['groups', 'mine'],
    queryFn: async () => (await api.get('/groups', { params: { mine: true } })).data as Group[],
    ...opts,
  });
  return USE_MOCKS ? mockMyGroups : data ?? mockMyGroups;
}

export function useAllGroups(): Group[] {
  const { data } = useQuery({
    queryKey: ['groups', 'all'],
    queryFn: async () => (await api.get('/groups')).data as Group[],
    ...opts,
  });
  const list = USE_MOCKS ? mockAllGroups : data ?? mockAllGroups;
  return list.length ? list : mockAllGroups;
}

export function usePrayerWall(): Prayer[] {
  const { data } = useQuery({
    queryKey: ['prayers'],
    queryFn: async () => {
      const rows = (await api.get('/prayers', { params: { pageSize: 30 } })).data.data;
      return rows.map((p: any) => ({
        id: p.id,
        who: p.who,
        initials: p.initials,
        color: colorFor(p.id),
        visibility: p.visibility,
        ago: ago(p.at),
        text: p.text,
        amen: p.amen,
        iPrayed: p.iPrayed,
      })) as Prayer[];
    },
    ...opts,
  });
  return USE_MOCKS ? mockPrayerWall : data ?? mockPrayerWall;
}

export function useEvents(): ChurchEvent[] {
  const { data } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get('/events')).data as ChurchEvent[],
    ...opts,
  });
  return USE_MOCKS ? mockEvents : data ?? mockEvents;
}

export function useFunds(): typeof mockFunds {
  const { data } = useQuery({
    queryKey: ['funds'],
    queryFn: async () => (await api.get('/giving/funds')).data,
    ...opts,
  });
  const list = USE_MOCKS ? mockFunds : data ?? mockFunds;
  return list.length ? list : mockFunds;
}

export function usePaymentMethods(): typeof mockPaymentMethods {
  const { data } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => (await api.get('/giving/payment-methods')).data,
    ...opts,
  });
  const list = USE_MOCKS ? mockPaymentMethods : data ?? mockPaymentMethods;
  return list.length ? list : mockPaymentMethods;
}

export function useGiftHistory(): typeof mockGiftHistory {
  const { data } = useQuery({
    queryKey: ['donations'],
    queryFn: async () => {
      const rows = (await api.get('/giving/donations')).data.data;
      return rows.map((d: any) => ({
        id: d.id,
        date: shortDate(d.createdAt),
        amount: d.amount,
        fund: fundLabel(d.fundId),
        method: d.method,
      }));
    },
    ...opts,
  });
  return USE_MOCKS ? mockGiftHistory : data ?? [];
}

export function useWallet(): AmenWallet {
  const { data } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const w = (await api.get('/giving/wallet')).data;
      return {
        balanceCoins: w.balanceCoins,
        pendingTopupCoins: w.pendingTopupCoins,
        defaultFund: w.defaultFund,
        recent: (w.recent ?? []).map((t: any) => ({ ...t, when: ago(t.when) })),
      } as AmenWallet;
    },
    ...opts,
  });
  return USE_MOCKS ? mockWallet : data ?? EMPTY_WALLET;
}

export function useNotifications(): Notif[] {
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const rows = (await api.get('/notifications')).data;
      return rows.map((n: any) => ({ ...n, when: ago(n.when) })) as Notif[];
    },
    ...opts,
  });
  return USE_MOCKS ? mockNotifications : data ?? mockNotifications;
}

/** Session live courante + flux d'amens (Live screen). */
export function useLiveAmens() {
  const { data } = useQuery({
    queryKey: ['live', 'amens'],
    queryFn: async () => {
      const session = (await api.get('/live/current')).data;
      if (!session?.id) return mockLiveAmens;
      const rows = (await api.get(`/live/${session.id}/amens`)).data;
      return rows.map((a: any) => ({ who: a.who, coins: a.coins, ago: ago(a.at) }));
    },
    ...opts,
  });
  const list = USE_MOCKS ? mockLiveAmens : data ?? mockLiveAmens;
  return list.length ? list : mockLiveAmens;
}

export interface LiveSession {
  id: string;
  state: 'offline' | 'live';
  title: string;
  series?: string;
  speaker?: string;
  viewersLive: number;
  amenCount: number;
  amenCoins: number;
}

/** Session live « courante » (état réel) — null si rien. */
const mockLiveSession: LiveSession = {
  id: 'live-mock',
  state: 'live',
  title: 'Grace, not earned',
  series: 'Sunday Service',
  speaker: 'Pastor Mukendi Tshibaka',
  viewersLive: 612,
  amenCount: 184,
  amenCoins: 612,
};

/** Session live courante depuis /live/current (state 'live' prioritaire, sinon la plus récente). */
export function useLiveSession(): LiveSession | null {
  const { data } = useQuery({
    queryKey: ['live', 'current'],
    queryFn: async () => ((await api.get('/live/current')).data ?? null) as LiveSession | null,
    ...opts,
  });
  return USE_MOCKS ? mockLiveSession : (data ?? null);
}

/** Id de la session courante (pour poster un amen). Undefined en mode mocks. */
export function useLiveSessionId(): string | undefined {
  const session = useLiveSession();
  return USE_MOCKS ? undefined : (session?.id ?? undefined);
}

// ───────────────────────── Queries de détail ─────────────────────────

/** GET /users/me/streak → { count, days }. Fallback streak mock fixe. */
export function useStreak(): { count: number; days: boolean[] } {
  const { data } = useQuery({
    queryKey: ['streak'],
    queryFn: async () => (await api.get('/users/me/streak')).data,
    ...opts,
  });
  const mockStreak = { count: 12, days: [true, true, true, true, true, false, false] };
  // En prod : état neutre (pas un faux streak de 12 jours) jusqu'aux vraies données.
  const empty = { count: 0, days: [false, false, false, false, false, false, false] };
  return USE_MOCKS ? mockStreak : data ?? empty;
}

/** GET /giving/donations/:id (reçu). */
export function useDonation(id: string) {
  const { data } = useQuery({
    queryKey: ['donation', id],
    queryFn: async () => (await api.get(`/giving/donations/${id}`)).data,
    enabled: !USE_MOCKS && !!id,
  });
  return data;
}

/** GET /giving/wallet/transactions → liste à plat (.data). */
export function useWalletTransactions() {
  const { data } = useQuery({
    queryKey: ['walletTransactions'],
    queryFn: async () => {
      const rows = (await api.get('/giving/wallet/transactions', { params: { pageSize: 50 } })).data.data;
      return rows.map((t: any) => ({ ...t, when: ago(t.when) }));
    },
    ...opts,
  });
  return USE_MOCKS ? mockWallet.recent : data ?? [];
}

/** GET /groups/:id (détail). Fallback : recherche dans la liste mock. */
export function useGroup(id: string): Group | undefined {
  const { data } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => (await api.get(`/groups/${id}`)).data,
    enabled: !USE_MOCKS && !!id,
  });
  const fallback = mockAllGroups.find((g) => g.id === id);
  return USE_MOCKS ? fallback : data ?? fallback;
}

/** GET /groups/:id/messages → liste à plat (.data). */
export function useGroupMessages(id: string) {
  const { data } = useQuery({
    queryKey: ['groupMessages', id],
    queryFn: async () => (await api.get(`/groups/${id}/messages`, { params: { pageSize: 50 } })).data.data,
    enabled: !USE_MOCKS && !!id,
  });
  return (USE_MOCKS ? [] : data ?? []) as {
    id: string;
    who: string;
    authorId: string;
    text: string;
    at: string;
    mine: boolean;
  }[];
}

export interface PrayerEncouragement { who: string; initials: string; text: string; at: string }
export type PrayerDetail = Prayer & { encouragements?: PrayerEncouragement[] };

/** GET /prayers/:id (détail + encouragements). Fallback : recherche dans le mur mock. */
export function usePrayer(id: string): PrayerDetail | undefined {
  const { data } = useQuery({
    queryKey: ['prayer', id],
    queryFn: async () => {
      const p = (await api.get(`/prayers/${id}`)).data;
      return { ...p, color: colorFor(p.id), ago: ago(p.at) } as PrayerDetail;
    },
    enabled: !USE_MOCKS && !!id,
  });
  const fallback = mockPrayerWall.find((p) => p.id === id);
  return USE_MOCKS ? fallback : data ?? fallback;
}

// ───────────────────────── Rendez-vous ─────────────────────────

export interface ApptTopic { id: string; label: string; description?: string }
export interface ApptDay { day: string; slots: { start: string; available: boolean }[] }
export interface Appointment {
  id: string;
  slotStart: string;
  status: 'tentative' | 'confirmed' | 'cancelled' | string;
  notes?: string | null;
  location?: string | null;
  topic?: { label: string } | null;
  pastor?: { firstName?: string | null; lastName?: string | null } | null;
}

/** GET /appointments/topics */
export function useAppointmentTopics(): ApptTopic[] {
  const { data } = useQuery({
    queryKey: ['appt', 'topics'],
    queryFn: async () => (await api.get('/appointments/topics')).data as ApptTopic[],
    enabled: !USE_MOCKS,
  });
  return data ?? [];
}

/** GET /appointments/slots → jours + créneaux disponibles. */
export function useAppointmentSlots(): ApptDay[] {
  const { data } = useQuery({
    queryKey: ['appt', 'slots'],
    queryFn: async () => (await api.get('/appointments/slots')).data as ApptDay[],
    enabled: !USE_MOCKS,
  });
  return data ?? [];
}

/** GET /appointments/mine */
export function useMyAppointments(): Appointment[] {
  const { data } = useQuery({
    queryKey: ['appt', 'mine'],
    queryFn: async () => (await api.get('/appointments/mine')).data as Appointment[],
    enabled: !USE_MOCKS,
  });
  return data ?? [];
}

/** GET /events/:id (détail). Fallback : recherche dans la liste mock. */
export function useEvent(id: string): ChurchEvent | undefined {
  const { data } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => (await api.get(`/events/${id}`)).data,
    enabled: !USE_MOCKS && !!id,
  });
  const fallback = mockEvents.find((e) => e.id === id);
  return USE_MOCKS ? fallback : data ?? fallback;
}
