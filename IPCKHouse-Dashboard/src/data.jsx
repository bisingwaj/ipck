// IPCK House — Mock data for the Carbon Dashboard

const DATA = {
  org: { short: 'IPCK', name: 'International Protestant Church of Kinshasa', campus: 'Main campus · Kinshasa, DRC' },
  today: { dateLong: 'Sunday, 24 May 2026', timeShort: '09:42 CAT' },

  user: { initials: 'MT', name: 'Pastor Mukendi', role: 'Senior Pastor' },

  // ── Overview KPIs ──
  kpis: [
    { id: 'members',   label: 'Active members',         value: '1,284',    delta: +3.2, deltaType: 'pct',  good: true,  caption: '+41 this month',        spark: [60,62,65,64,66,70,72,75,78,80,82,84] },
    { id: 'giving',    label: 'Giving · month-to-date', value: '$18.4k',   delta: +12.4,deltaType: 'pct',  good: true,  caption: 'Target $24k by 31 May', spark: [30,42,28,55,48,60,72,65,85,78,92,110] },
    { id: 'viewers',   label: 'Live · peak today',      value: '684',      delta: +18,  deltaType: 'abs',  good: true,  caption: 'avg 487 in first hour', spark: [180,220,280,360,420,540,612,684,660,612,600,588], live: true },
    { id: 'prayers',   label: 'Prayer queue · open',    value: '28',       delta: -5,   deltaType: 'abs',  good: true,  caption: '6 marked answered',     spark: [40,38,36,35,33,31,30,28,28,27,28,28] },
    { id: 'devo',      label: 'Devotional completion',  value: '71%',      delta: -3,   deltaType: 'pct',  good: false, caption: '892 subscribers',       spark: [78,76,75,74,72,73,74,71,72,70,71,71] },
  ],

  // ── Live service ──
  service: {
    state: 'live',
    title: 'Grace, not earned',
    series: 'Anchored · part 3 of 5',
    speaker: 'Pastor Mukendi Tshibaka',
    startedMin: 27,
    viewersLive: 612, viewersPeak: 684,
    inPerson: 312,
    quality: '1080p', bitrate: '4.2 Mbps', healthy: true,
    sceneActive: 'Sermon',
    scenes: ['Worship', 'Sermon', 'Verse', 'Communion', 'Announcements'],
    geo: [
      { c: 'Kinshasa, DRC', n: 412, pct: 67 },
      { c: 'Lubumbashi',    n:  62, pct: 10 },
      { c: 'Paris, FR',     n:  48, pct: 7 },
      { c: 'Brussels, BE',  n:  31, pct: 5 },
      { c: 'Other',         n:  59, pct: 11 },
    ],
  },

  // ── Pastoral care ──
  prayers: [
    { id: 'p1', who: 'Anonymous',       vis: 'private', ago: '8 min',  text: "For my mother's health. The doctors are unsure and we need wisdom.", status: 'pending' },
    { id: 'p2', who: 'Grace Mbuyi',     vis: 'private', ago: '23 min', text: 'A confidential matter at work — would love to talk through it.',     status: 'pending' },
    { id: 'p3', who: 'Anonymous',       vis: 'anon',    ago: '2 h',    text: 'For our marriage. We have been struggling and need help to listen.',  status: 'pending' },
    { id: 'p4', who: 'Pierre T.',       vis: 'private', ago: '5 h',    text: 'I keep slipping back into the same pattern. I need accountability.', status: 'pending' },
    { id: 'p5', who: 'Joseph Kalala',   vis: 'public',  ago: '1 h',    text: 'Praising God for the new job after months of waiting.',               status: 'approved' },
    { id: 'p6', who: 'Esther M.',       vis: 'public',  ago: '3 h',    text: "Wisdom for the children's ministry curriculum we are drafting.",     status: 'approved' },
  ],

  appointments: [
    { time: '10:00', who: 'Joseph & Marie Kalala', topic: 'Pre-marital · session 3 of 5', loc: "Pastor's office", with: 'P. Mukendi', status: 'confirmed' },
    { time: '11:30', who: 'Nadine Bofili',         topic: 'Prayer · father in hospital',  loc: "Pastor's office", with: 'P. Mukendi', status: 'confirmed' },
    { time: '14:00', who: 'Grace Mbuyi',           topic: 'Counseling',                   loc: "Pastor's office", with: 'P. Mukendi', status: 'confirmed' },
    { time: '15:30', who: "Women's leadership",    topic: 'Planning meeting · 5 atten.',  loc: 'Room B',          with: 'P. Esther',  status: 'confirmed' },
    { time: '17:00', who: 'Claude Lubaki',         topic: 'Membership conversation',      loc: "Pastor's office", with: 'P. Mukendi', status: 'tentative' },
  ],

  // ── Finance ──
  gifts: [
    { ref: 'GFT-024-381', who: 'Anonymous',     amount: 25,  fund: 'General',     ch: 'M-Pesa',      ago: '2 min',  status: 'received' },
    { ref: 'GFT-024-380', who: 'Grace Mbuyi',   amount: 50,  fund: 'Missions',    ch: 'Airtel',      ago: '14 min', status: 'received' },
    { ref: 'GFT-024-379', who: 'Joseph Kalala', amount: 200, fund: 'Building',    ch: 'Card',        ago: '21 min', status: 'received' },
    { ref: 'GFT-024-378', who: 'Esther M.',     amount: 15,  fund: 'General',     ch: 'Orange',      ago: '38 min', status: 'pending' },
    { ref: 'GFT-024-377', who: 'Pierre T.',     amount: 75,  fund: 'General',     ch: 'M-Pesa',      ago: '52 min', status: 'received' },
    { ref: 'GFT-024-376', who: 'Anonymous',     amount: 10,  fund: 'Benevolence', ch: 'Airtel',      ago: '1 h',    status: 'received' },
    { ref: 'GFT-024-375', who: 'Nadine B.',     amount: 30,  fund: 'General',     ch: 'M-Pesa',      ago: '1 h',    status: 'received' },
    { ref: 'GFT-024-374', who: 'Claude L.',     amount: 100, fund: 'Missions',    ch: 'Card',        ago: '2 h',    status: 'failed'   },
  ],

  funds: [
    { name: 'General fund',     budget: 240000, ytd: 168400, color: 'var(--blue-60)' },
    { name: 'Building project', budget: 180000, ytd:  82340, color: 'var(--yellow-30)' },
    { name: 'Missions',         budget:  90000, ytd:  46210, color: 'var(--green-50)' },
    { name: 'Benevolence',      budget:  24000, ytd:  14080, color: 'var(--purple-60)' },
  ],

  channels: [
    { name: 'Airtel Money', amt: 1080, count: 23, pct: 38, color: 'var(--red-60)' },
    { name: 'M-Pesa',       amt:  820, count: 18, pct: 27, color: 'var(--green-50)' },
    { name: 'Orange Money', amt:  580, count: 12, pct: 18, color: 'var(--yellow-30)' },
    { name: 'Card',         amt:  360, count:  8, pct: 12, color: 'var(--blue-60)' },
    { name: 'Cash · in-person', amt: 150, count: 4, pct: 5, color: 'var(--gray-60)' },
  ],

  // ── People signals ──
  newMembers: [
    { name: 'Marc Ntumba',     when: '2h ago',  source: 'Onboarded in app' },
    { name: 'Claude Lubaki',   when: '3 days',  source: 'Sunday connect card' },
    { name: 'Sarah Kabongo',   when: '4 days',  source: 'Friend invite' },
    { name: 'David Mwamba',    when: '5 days',  source: 'Sunday connect card' },
    { name: 'Hope Tshilumba',  when: '6 days',  source: 'Onboarded in app' },
  ],

  engagement: [
    { label: 'Devotional completion',  pct: 71, target: 75 },
    { label: 'Sunday attendance',      pct: 87, target: 80 },
    { label: 'Push open rate',         pct: 32, target: 35 },
    { label: 'Members active 7d',      pct: 56, target: 50 },
  ],

  // ── Content ──
  upcomingContent: [
    { type: 'Devotional', title: 'The kindness of God',  when: 'Mon · 25 May · 06:00', author: 'P. Esther', status: 'scheduled' },
    { type: 'Devotional', title: 'When you are weary',   when: 'Tue · 26 May · 06:00', author: 'P. Mukendi', status: 'scheduled' },
    { type: 'Sermon',     title: 'Walking with the broken', when: 'Sun · 25 May · 09:00', author: 'P. Esther', status: 'scheduled' },
    { type: 'Devotional', title: 'A quiet trust',        when: 'Thu · 28 May',         author: 'P. Mukendi', status: 'draft' },
    { type: 'Devotional', title: '(empty)',              when: 'Fri · 29 May',         author: '—',          status: 'empty' },
  ],

  // ── Activity feed ──
  activity: [
    { kind: 'give',    who: 'Pierre T.',     what: 'gave $75 to General fund',                ago: '52 min' },
    { kind: 'prayer',  who: 'Grace M.',      what: 'submitted a private prayer request',      ago: '23 min' },
    { kind: 'appts',   who: 'Claude L.',     what: "booked a Membership conversation",        ago: '1 h' },
    { kind: 'members', who: 'Marc Ntumba',   what: 'completed onboarding — new member',       ago: '2 h' },
    { kind: 'events',  who: 'Joseph K.',     what: "RSVP'd to Friday prayer night",           ago: '3 h' },
    { kind: 'sermons', who: 'Pastor',        what: 'published "Grace, not earned"',           ago: '5 h' },
    { kind: 'groups',  who: 'Esther M.',     what: "added 3 members to Women's Prayer",       ago: '7 h' },
    { kind: 'give',    who: 'Anonymous',     what: 'gave $200 to Building project',           ago: '8 h' },
    { kind: 'broadcast', who: 'Pastor',      what: 'sent a broadcast — Devo subscribers',     ago: '12 h' },
    { kind: 'live',    who: 'System',        what: 'Sunday service stream started',           ago: '27 min' },
  ],
};

window.DATA = DATA;
