// Hooks de données par domaine. Chaque hook renvoie la MÊME forme que src/data/mock.ts,
// avec les fixtures mock en fallback (jamais vide) → branchement non destructif des écrans.
import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import { USE_MOCKS } from './config';
import { ago, colorFor, shortDate, fundLabel } from './format';
import {
  todayDevotional as mockToday,
  pastDevotionals as mockPast,
  sermons as mockSermons,
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

const opts = { enabled: !USE_MOCKS };

/** Force un format de date contenant une virgule (l'UI fait date.split(',')[1]). */
function withComma(date: string): string {
  return date && date.includes(',') ? date : `Today, ${date || ''}`.trim();
}

export function useTodayDevotional(): Devotional {
  const { data } = useQuery({
    queryKey: ['devotional', 'today'],
    queryFn: async () => {
      const d = (await api.get('/devotionals/today')).data;
      return { ...d, date: withComma(d.date) } as Devotional;
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
  return USE_MOCKS ? mockGiftHistory : data ?? mockGiftHistory;
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
  return USE_MOCKS ? mockWallet : data ?? mockWallet;
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
