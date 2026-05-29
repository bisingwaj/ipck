// Mock data — replace with API calls for production.

export interface Devotional {
  id: string;
  date: string;
  title: string;
  verseRef: string;
  verseText: string;
  body: string;
  prayer: string;
  applyTitle: string;
  applySteps: string[];
}

export const todayDevotional: Devotional = {
  id: 'devo-2026-05-24',
  date: 'Sunday, 24 May 2026',
  title: 'When the wait feels long',
  verseRef: 'Romans 8:28 · NIV',
  verseText: '"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."',
  body: `Paul writes this from a place of pressure, not comfort. He is not promising that everything will feel good, or that the road will be short.

He is promising that in the middle of the wait, in the middle of confusion, God is at work. Not pulled away. Not distracted. At work.

When you cannot trace what is happening, you can still trust the One who is doing it.`,
  prayer: `Father, the waiting is heavy. I do not understand what You are doing, and I am tempted to fill the silence with fear.

Quiet my heart today. Help me to trust that You are at work, even when I cannot see it. Teach me to wait with hope, not with anxiety.

I give You the thing I have been gripping so tightly. Hold it for me today. In Jesus' name, amen.`,
  applyTitle: 'Apply this today',
  applySteps: [
    'Name one situation where you are tired of waiting. Write it down.',
    'Hand it to God in prayer once, in the morning. Don\'t take it back.',
    'Look for one small sign of His goodness before the day ends — and thank Him for it.',
  ],
};

export const pastDevotionals: { id: string; date: string; title: string; verseRef: string; read: boolean }[] = [
  { id: 'd-1', date: 'Sat 23 May', title: 'A peace that holds you',  verseRef: 'John 14:27',     read: true },
  { id: 'd-2', date: 'Fri 22 May', title: 'When the kindness comes', verseRef: 'Titus 3:4',      read: true },
  { id: 'd-3', date: 'Thu 21 May', title: 'Come and rest',           verseRef: 'Matthew 11:28',  read: true },
  { id: 'd-4', date: 'Wed 20 May', title: 'The Father who runs',     verseRef: 'Luke 15:20',     read: true },
  { id: 'd-5', date: 'Tue 19 May', title: 'Slow to anger',           verseRef: 'Psalm 103:8',    read: false },
  { id: 'd-6', date: 'Mon 18 May', title: 'Grace, not earned',       verseRef: 'Ephesians 2:8-9', read: true },
];

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  duration: string;
  series: string;
  live?: boolean;
}

export const sermons: Sermon[] = [
  { id: 's1', title: 'Grace, not earned',                  speaker: 'Pastor Mukendi', date: '18 May 2026', duration: '38 min', series: 'Anchored', live: true },
  { id: 's2', title: 'The kind of rest your soul knows',   speaker: 'Pastor Mukendi', date: '11 May 2026', duration: '34 min', series: 'Anchored' },
  { id: 's3', title: 'Come and rest',                      speaker: 'Pastor Esther',  date: '04 May 2026', duration: '29 min', series: 'Anchored' },
  { id: 's4', title: 'When the wait feels long',           speaker: 'Pastor Mukendi', date: '27 Apr 2026', duration: '42 min', series: 'Anchored' },
  { id: 's5', title: 'A peace that holds you',             speaker: 'Pastor Esther',  date: '20 Apr 2026', duration: '31 min', series: 'Anchored' },
  { id: 's6', title: 'Holy week reflection',               speaker: 'Pastor Mukendi', date: '13 Apr 2026', duration: '46 min', series: 'Standalone' },
];

export interface Group {
  id: string;
  name: string;
  members: number;
  unread: number;
  lastMessage: string;
  leader: string;
  meets: string;
  color: string;
}

export const myGroups: Group[] = [
  { id: 'g1', name: "Women's Ministry",  members: 24, unread: 3, lastMessage: "Esther: Sisters, let's pause and lift Mama Joseph in prayer.", leader: 'Pastor Esther', meets: 'Tue 6:00 PM', color: '#FFB020' },
  { id: 'g2', name: 'Worship team',      members: 12, unread: 0, lastMessage: 'Grace: Sunday set is shared — please review by Friday.',       leader: 'Grace Mbuyi',   meets: 'Wed 7:00 PM', color: '#5B3FB8' },
  { id: 'g3', name: 'Young Adults',      members: 41, unread: 12, lastMessage: 'Pierre: Game night Saturday — who is in?',                     leader: 'Pierre T.',     meets: 'Sat 4:00 PM', color: '#E5484D' },
];

export const allGroups: Group[] = [
  ...myGroups,
  { id: 'g4', name: "Men's Fellowship",  members: 18, unread: 0, lastMessage: 'Joseph: Saturday breakfast at 7.',                              leader: 'Joseph Kalala', meets: 'Sat 7:00 AM', color: '#1F6FEB' },
  { id: 'g5', name: 'Couples',           members: 32, unread: 0, lastMessage: 'Mukendi: Next session on covenant.',                            leader: 'Pastor Mukendi', meets: 'Fri 7:00 PM', color: '#1FB36A' },
  { id: 'g6', name: 'Ushers',            members: 22, unread: 0, lastMessage: 'Marie: Schedule for June is up.',                               leader: 'Marie-Anne K.', meets: 'Sun 8:00 AM', color: '#0FA38C' },
];

export interface Prayer {
  id: string;
  who: string;
  initials: string;
  color: string;
  visibility: 'public' | 'anon' | 'private';
  ago: string;
  text: string;
  amen: number;
  iPrayed?: boolean;
}

export const prayerWall: Prayer[] = [
  { id: 'p1', who: 'Grace Mbuyi',    initials: 'GM', color: '#1F6FEB', visibility: 'public', ago: '8 min', text: 'Praising God for the new job after months of waiting. He is faithful.', amen: 42, iPrayed: false },
  { id: 'p2', who: 'Anonymous',      initials: 'A',  color: '#6A7384', visibility: 'anon',   ago: '23 min', text: 'For our marriage. We have been struggling and need help to listen well.', amen: 18, iPrayed: false },
  { id: 'p3', who: 'Esther M.',      initials: 'EM', color: '#FFB020', visibility: 'public', ago: '1h',     text: 'Wisdom for the children\'s ministry curriculum we are drafting.', amen: 7, iPrayed: true },
  { id: 'p4', who: 'Pierre T.',      initials: 'PT', color: '#5B3FB8', visibility: 'public', ago: '2h',     text: 'For my father\'s health and for our family to walk in peace.', amen: 31, iPrayed: false },
  { id: 'p5', who: 'Nadine Bofili',  initials: 'NB', color: '#0FA38C', visibility: 'public', ago: '4h',     text: 'Praying for our young adults — that they would know they are loved.', amen: 12, iPrayed: false },
];

export interface ChurchEvent {
  id: string;
  name: string;
  when: string;
  loc: string;
  cap?: number;
  rsvp: number;
  color: string;
  description: string;
}

export const events: ChurchEvent[] = [
  { id: 'e1', name: 'Friday prayer night', when: 'Fri 29 May · 7:00 PM',  loc: 'Main hall', cap: 150, rsvp: 42, color: '#5B3FB8', description: 'An evening of corporate prayer for the city and our families.' },
  { id: 'e2', name: 'Membership class',    when: 'Sat 6 Jun · 9:00 AM',   loc: 'Room A',    cap: 30,  rsvp: 14, color: '#1F6FEB', description: 'For anyone exploring membership at IPCK. Coffee and pastries.' },
  { id: 'e3', name: "Women's retreat",     when: 'Fri 12 Jun · 5:00 PM',  loc: 'Kisantu',   cap: 60,  rsvp: 38, color: '#FFB020', description: 'Two days away with the sisters — worship, teaching, rest.' },
  { id: 'e4', name: 'Baptism Sunday',      when: 'Sun 21 Jun · 11:00 AM', loc: 'Main hall',           rsvp: 12, color: '#1FB36A', description: 'A celebration of new life in Christ.' },
];

// Give
export const funds = [
  { id: 'general',   name: 'General fund',     description: 'Day-to-day mission of the church', accent: '#1F6FEB' },
  { id: 'building',  name: 'Building project', description: 'Building the new sanctuary',       accent: '#FFB020' },
  { id: 'missions',  name: 'Missions',         description: 'Local and global outreach',         accent: '#1FB36A' },
  { id: 'benevolence', name: 'Benevolence',    description: 'Care for families in hardship',    accent: '#5B3FB8' },
];

export const paymentMethods = [
  { id: 'airtel',  name: 'Airtel Money', logo: 'A',  color: '#E5484D', kind: 'momo' as const, instant: true },
  { id: 'mpesa',   name: 'M-Pesa',       logo: 'M',  color: '#1FB36A', kind: 'momo' as const, instant: true },
  { id: 'orange',  name: 'Orange Money', logo: 'O',  color: '#FFB020', kind: 'momo' as const, instant: true },
  { id: 'afri',    name: 'Afrimoney',    logo: 'Af', color: '#5B3FB8', kind: 'momo' as const, instant: false },
  { id: 'card',    name: 'Card',         logo: '💳', color: '#1F6FEB', kind: 'card' as const, instant: true },
];

export const giftHistory = [
  { id: 'g-2026-05', date: '21 Apr 2026', amount: 50, fund: 'General',     method: 'M-Pesa' },
  { id: 'g-2026-04', date: '21 Mar 2026', amount: 50, fund: 'General',     method: 'M-Pesa' },
  { id: 'g-2026-03', date: '21 Feb 2026', amount: 50, fund: 'General',     method: 'M-Pesa' },
  { id: 'g-2026-02', date: '15 Feb 2026', amount: 100, fund: 'Building',   method: 'Card' },
  { id: 'g-2026-01', date: '21 Jan 2026', amount: 50, fund: 'General',     method: 'Airtel' },
];

// ── Amen wallet ──────────────────────────────────────────────
// "Amen coins" are pre-loaded credit a member can use to give
// small gifts in real-time during a live service. 1 amen coin = 1 USD.
// Coins always settle into a fund the giver picked (default: General).
// We are explicit: coins are still tithes/offerings, not in-app currency.

export interface AmenWallet {
  balanceCoins: number;
  pendingTopupCoins: number;
  defaultFund: string;
  recent: AmenTransaction[];
}

export interface AmenTransaction {
  id: string;
  kind: 'topup' | 'amen' | 'redeem' | 'refund';
  coins: number;          // signed: + topup, - amen/redeem
  when: string;
  service?: string;       // e.g. "Sunday Service · 24 May"
  fund?: string;
  method?: string;        // M-Pesa, Airtel, Card…
  status: 'completed' | 'pending' | 'failed';
}

export const wallet: AmenWallet = {
  balanceCoins: 47,
  pendingTopupCoins: 0,
  defaultFund: 'General fund',
  recent: [
    { id: 'tx-9', kind: 'amen',   coins: -1,  when: '2 min ago',  service: 'Sunday Service · 24 May', fund: 'General fund', status: 'completed' },
    { id: 'tx-8', kind: 'amen',   coins: -5,  when: '14 min ago', service: 'Sunday Service · 24 May', fund: 'General fund', status: 'completed' },
    { id: 'tx-7', kind: 'amen',   coins: -1,  when: '18 min ago', service: 'Sunday Service · 24 May', fund: 'General fund', status: 'completed' },
    { id: 'tx-6', kind: 'topup',  coins: +50, when: 'Today 09:12', method: 'M-Pesa',                                          status: 'completed' },
    { id: 'tx-5', kind: 'amen',   coins: -3,  when: 'Sun 17 May',  service: 'Sunday Service · 17 May', fund: 'General fund', status: 'completed' },
    { id: 'tx-4', kind: 'amen',   coins: -10, when: 'Sun 17 May',  service: 'Sunday Service · 17 May', fund: 'Missions',     status: 'completed' },
    { id: 'tx-3', kind: 'redeem', coins: -20, when: '04 May',      fund: 'Building project',                                 status: 'completed' },
    { id: 'tx-2', kind: 'topup',  coins: +50, when: '02 May',      method: 'Card',                                            status: 'completed' },
  ],
};

// Live amen reactions seen during a service — what other members are sending
export const liveAmens = [
  { who: 'Grace M.',     coins: 5,  ago: 'just now' },
  { who: 'Joseph K.',    coins: 1,  ago: '4s' },
  { who: 'Anonymous',    coins: 10, ago: '12s' },
  { who: 'Pierre T.',    coins: 1,  ago: '18s' },
  { who: 'Nadine B.',    coins: 5,  ago: '34s' },
  { who: 'Marie-Anne',   coins: 1,  ago: '47s' },
  { who: 'Claude L.',    coins: 25, ago: '1m' },
  { who: 'Anonymous',    coins: 1,  ago: '1m' },
  { who: 'Esther M.',    coins: 5,  ago: '2m' },
];

// Notifications
export interface Notification {
  id: string; group: string; icon: string; title: string; subtitle: string; when: string; unread?: boolean; color: string;
}
export const notifications: Notification[] = [
  { id: 'n1', group: 'Today',     icon: 'verse',     title: "Today's verse is ready",         subtitle: 'Romans 8:28 · When the wait feels long', when: '08:00', unread: true, color: '#1F6FEB' },
  { id: 'n2', group: 'Today',     icon: 'community', title: 'Esther replied in Women\'s Ministry', subtitle: 'Sisters — let\'s pause and lift Mama…', when: '08:42', unread: true, color: '#14181F' },
  { id: 'n3', group: 'Today',     icon: 'pray',      title: '5 people prayed for your request', subtitle: 'Praying for clarity tomorrow morning…', when: '11:14', unread: true, color: '#1FB36A' },
  { id: 'n4', group: 'Yesterday', icon: 'cal',       title: 'Service tomorrow · Sun 9:00 AM',  subtitle: 'Add a reminder',  when: 'Sat', color: '#1F6FEB' },
  { id: 'n5', group: 'Yesterday', icon: 'give',      title: 'Monthly gift reminder',           subtitle: 'Tap to approve your $50 Tithe', when: 'Sat', color: '#FFB020' },
];
