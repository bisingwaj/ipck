/* eslint-disable no-console */
import {
  PrismaClient,
  Role,
  ContentStatus,
  PrayerVisibility,
  PrayerStatus,
  PaymentKind,
  DonationStatus,
  AmenTxnKind,
  AmenTxnStatus,
  AppointmentStatus,
  LiveState,
} from '@prisma/client';

const prisma = new PrismaClient();

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000);

async function reset() {
  // Ordre respectant les FK
  await prisma.$transaction([
    prisma.amenTransaction.deleteMany(),
    prisma.amenWallet.deleteMany(),
    prisma.donation.deleteMany(),
    prisma.prayerAmen.deleteMany(),
    prisma.prayer.deleteMany(),
    prisma.eventRsvp.deleteMany(),
    prisma.churchEvent.deleteMany(),
    prisma.groupMessage.deleteMany(),
    prisma.groupMembership.deleteMany(),
    prisma.group.deleteMany(),
    prisma.devotionalRead.deleteMany(),
    prisma.devotional.deleteMany(),
    prisma.liveSession.deleteMany(),
    prisma.sermon.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.pushToken.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.appointmentTopic.deleteMany(),
    prisma.paymentMethod.deleteMany(),
    prisma.fund.deleteMany(),
    prisma.serviceTime.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function main() {
  console.log('🌱 Reset…');
  await reset();

  // ── Référence ──
  console.log('🌱 Données de référence…');
  await prisma.fund.createMany({
    data: [
      { id: 'general', name: 'General fund', description: 'Day-to-day mission of the church', accent: '#1F6FEB', budget: 240000 },
      { id: 'building', name: 'Building project', description: 'Building the new sanctuary', accent: '#FFB020', budget: 180000 },
      { id: 'missions', name: 'Missions', description: 'Local and global outreach', accent: '#1FB36A', budget: 90000 },
      { id: 'benevolence', name: 'Benevolence', description: 'Care for families in hardship', accent: '#5B3FB8', budget: 24000 },
    ],
  });
  await prisma.paymentMethod.createMany({
    data: [
      { id: 'airtel', name: 'Airtel Money', kind: PaymentKind.momo, logo: 'A', color: '#E5484D', instant: true },
      { id: 'mpesa', name: 'M-Pesa', kind: PaymentKind.momo, logo: 'M', color: '#1FB36A', instant: true },
      { id: 'orange', name: 'Orange Money', kind: PaymentKind.momo, logo: 'O', color: '#FFB020', instant: true },
      { id: 'afri', name: 'Afrimoney', kind: PaymentKind.momo, logo: 'Af', color: '#5B3FB8', instant: false },
      { id: 'card', name: 'Card', kind: PaymentKind.card, logo: '💳', color: '#1F6FEB', instant: true },
    ],
  });
  await prisma.appointmentTopic.createMany({
    data: [
      { id: 'counseling', label: 'Counseling', description: 'Pastoral conversation about life, relationships, faith.' },
      { id: 'prayer', label: 'Prayer', description: 'Pray together about a specific need.' },
      { id: 'marriage', label: 'Marriage / family', description: 'Pre-marital, marriage, or family conversation.' },
      { id: 'baptism', label: 'Baptism', description: "Discuss baptism — yours or your child's." },
      { id: 'general', label: 'General', description: "Doesn't fit a category — we'll route it." },
    ],
  });
  await prisma.serviceTime.createMany({
    data: [
      { time: '9:00 AM', name: 'Family service', description: 'Shorter, kid-friendly. Sunday School in parallel.', sortOrder: 1 },
      { time: '11:00 AM', name: 'Main service', description: 'Full liturgy. Young Adults gathering in parallel.', sortOrder: 2 },
    ],
  });

  // ── Utilisateurs ──
  console.log('🌱 Utilisateurs…');
  const mukendi = await prisma.user.create({
    data: { phone: '+243810000001', firstName: 'Pastor', lastName: 'Mukendi', role: Role.pastor, wallet: { create: {} } },
  });
  const esther = await prisma.user.create({
    data: { phone: '+243810000002', firstName: 'Pastor', lastName: 'Esther', role: Role.pastor, wallet: { create: {} } },
  });
  await prisma.user.create({
    data: { phone: '+243810000003', firstName: 'Admin', lastName: 'IPCK', role: Role.admin, wallet: { create: {} } },
  });
  const grace = await prisma.user.create({
    data: { phone: '+243810000010', firstName: 'Grace', lastName: 'Mbuyi', role: Role.group_leader, interests: ['worship', 'prayer'], wallet: { create: {} } },
  });
  const joseph = await prisma.user.create({
    data: { phone: '+243810000011', firstName: 'Joseph', lastName: 'Kalala', role: Role.member, wallet: { create: {} } },
  });
  const demo = await prisma.user.create({
    data: {
      phone: '+243810000099',
      firstName: 'Demo',
      lastName: 'Member',
      role: Role.member,
      interests: ['devotionals', 'community'],
      streakCount: 4,
      lastReadDay: daysAgo(0),
      wallet: { create: { balanceCoins: 47, defaultFundId: 'general' } },
    },
  });

  // ── Dévotions ──
  console.log('🌱 Dévotions…');
  await prisma.devotional.create({
    data: {
      date: 'Today',
      title: 'When the wait feels long',
      verseRef: 'Romans 8:28 · NIV',
      verseText:
        '"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."',
      body: 'Paul writes this from a place of pressure, not comfort. He is promising that in the middle of the wait, God is at work.',
      prayer: 'Father, the waiting is heavy. Quiet my heart today. Help me to trust that You are at work. Amen.',
      applyTitle: 'Apply this today',
      applySteps: [
        'Name one situation where you are tired of waiting.',
        'Hand it to God in prayer once, in the morning.',
        'Look for one small sign of His goodness before the day ends.',
      ],
      status: ContentStatus.published,
      publishAt: daysAgo(0),
      author: 'Pastor Mukendi',
    },
  });
  const pastDevos = [
    { title: 'A peace that holds you', verseRef: 'John 14:27', d: 1 },
    { title: 'When the kindness comes', verseRef: 'Titus 3:4', d: 2 },
    { title: 'Come and rest', verseRef: 'Matthew 11:28', d: 3 },
    { title: 'The Father who runs', verseRef: 'Luke 15:20', d: 4 },
    { title: 'Grace, not earned', verseRef: 'Ephesians 2:8-9', d: 6 },
  ];
  for (const p of pastDevos) {
    await prisma.devotional.create({
      data: {
        date: p.verseRef,
        title: p.title,
        verseRef: p.verseRef,
        verseText: 'See the passage in your Bible.',
        body: 'A short reflection.',
        prayer: 'Lord, teach me. Amen.',
        applyTitle: 'Apply this',
        applySteps: ['Reflect.', 'Pray.', 'Act.'],
        status: ContentStatus.published,
        publishAt: daysAgo(p.d),
        author: 'Pastor Esther',
      },
    });
  }
  // Contenu planifié (dashboard Content)
  await prisma.devotional.create({
    data: {
      date: 'Scheduled',
      title: 'The kindness of God',
      verseRef: 'Romans 2:4',
      verseText: '…',
      body: '…',
      prayer: '…',
      applyTitle: 'Apply',
      applySteps: ['…'],
      status: ContentStatus.scheduled,
      publishAt: daysAhead(1),
      author: 'Pastor Esther',
    },
  });

  // ── Sermons + live ──
  console.log('🌱 Sermons + live…');
  const liveSermon = await prisma.sermon.create({
    data: { title: 'Grace, not earned', speaker: 'Pastor Mukendi', date: 'Today', duration: '38 min', series: 'Anchored', live: true, status: ContentStatus.published, publishAt: daysAgo(0) },
  });
  const sermonsData = [
    { title: 'The kind of rest your soul knows', speaker: 'Pastor Mukendi', d: 7 },
    { title: 'Come and rest', speaker: 'Pastor Esther', d: 14 },
    { title: 'When the wait feels long', speaker: 'Pastor Mukendi', d: 21 },
    { title: 'A peace that holds you', speaker: 'Pastor Esther', d: 28 },
  ];
  for (const s of sermonsData) {
    await prisma.sermon.create({
      data: { title: s.title, speaker: s.speaker, date: daysAgo(s.d).toDateString(), duration: '34 min', series: 'Anchored', status: ContentStatus.published, publishAt: daysAgo(s.d) },
    });
  }
  await prisma.liveSession.create({
    data: {
      sermonId: liveSermon.id,
      state: LiveState.live,
      title: 'Grace, not earned',
      series: 'Anchored · part 3 of 5',
      speaker: 'Pastor Mukendi Tshibaka',
      startedAt: new Date(),
      viewersLive: 612,
      viewersPeak: 684,
      inPerson: 312,
      quality: '1080p',
      sceneActive: 'Sermon',
      scenes: ['Worship', 'Sermon', 'Verse', 'Communion', 'Announcements'],
    },
  });

  // ── Groupes + chat ──
  console.log('🌱 Groupes…');
  const women = await prisma.group.create({
    data: { name: "Women's Ministry", leaderId: esther.id, meets: 'Tue 6:00 PM', color: '#FFB020', description: 'Sisters growing together.' },
  });
  const worship = await prisma.group.create({
    data: { name: 'Worship team', leaderId: grace.id, meets: 'Wed 7:00 PM', color: '#5B3FB8' },
  });
  await prisma.group.create({ data: { name: 'Young Adults', leaderId: mukendi.id, meets: 'Sat 4:00 PM', color: '#E5484D' } });
  await prisma.group.create({ data: { name: "Men's Fellowship", leaderId: joseph.id, meets: 'Sat 7:00 AM', color: '#1F6FEB' } });

  await prisma.groupMembership.createMany({
    data: [
      { userId: esther.id, groupId: women.id, role: 'leader' },
      { userId: grace.id, groupId: women.id, role: 'member' },
      { userId: demo.id, groupId: women.id, role: 'member' },
      { userId: grace.id, groupId: worship.id, role: 'leader' },
      { userId: demo.id, groupId: worship.id, role: 'member' },
    ],
  });
  await prisma.groupMessage.createMany({
    data: [
      { groupId: women.id, authorId: esther.id, text: "Sisters — let's pause and lift Mama Joseph in prayer.", createdAt: daysAgo(0) },
      { groupId: women.id, authorId: grace.id, text: 'Praying right now 🙏', createdAt: daysAgo(0) },
      { groupId: women.id, authorId: demo.id, text: 'Lord, please be near to her. Cover them with peace.', createdAt: daysAgo(0) },
    ],
  });

  // ── Prières ──
  console.log('🌱 Prières…');
  const p1 = await prisma.prayer.create({
    data: { authorId: grace.id, text: 'Praising God for the new job after months of waiting. He is faithful.', visibility: PrayerVisibility.public, status: PrayerStatus.approved },
  });
  await prisma.prayer.create({
    data: { authorId: joseph.id, text: "For my father's health and for our family to walk in peace.", visibility: PrayerVisibility.public, status: PrayerStatus.approved },
  });
  await prisma.prayer.create({
    data: { authorId: demo.id, text: 'For our marriage. We have been struggling and need help to listen well.', visibility: PrayerVisibility.anon, status: PrayerStatus.approved },
  });
  // File de care (pending / private)
  await prisma.prayer.create({
    data: { authorId: demo.id, text: "For my mother's health. The doctors are unsure and we need wisdom.", visibility: PrayerVisibility.private, status: PrayerStatus.pending },
  });
  await prisma.prayerAmen.createMany({
    data: [
      { prayerId: p1.id, userId: joseph.id },
      { prayerId: p1.id, userId: demo.id },
      { prayerId: p1.id, userId: esther.id },
    ],
  });

  // ── Événements ──
  console.log('🌱 Événements…');
  const ev1 = await prisma.churchEvent.create({
    data: { name: 'Friday prayer night', startsAt: daysAhead(2), whenLabel: 'Fri · 7:00 PM', location: 'Main hall', capacity: 150, color: '#5B3FB8', description: 'An evening of corporate prayer.' },
  });
  await prisma.churchEvent.create({
    data: { name: 'Membership class', startsAt: daysAhead(8), whenLabel: 'Sat · 9:00 AM', location: 'Room A', capacity: 30, color: '#1F6FEB', description: 'For anyone exploring membership.' },
  });
  await prisma.churchEvent.create({
    data: { name: "Women's retreat", startsAt: daysAhead(14), whenLabel: 'Fri · 5:00 PM', location: 'Kisantu', capacity: 60, color: '#FFB020', description: 'Two days away with the sisters.' },
  });
  await prisma.eventRsvp.createMany({
    data: [
      { eventId: ev1.id, userId: demo.id, status: 'going' },
      { eventId: ev1.id, userId: grace.id, status: 'going' },
    ],
  });

  // ── Dons (analytics) ──
  console.log('🌱 Dons…');
  let n = 380;
  const donationSpecs = [
    { user: grace.id, amount: 50, fund: 'missions', method: 'airtel', d: 0 },
    { user: joseph.id, amount: 200, fund: 'building', method: 'card', d: 0 },
    { user: demo.id, amount: 25, fund: 'general', method: 'mpesa', d: 1 },
    { user: grace.id, amount: 75, fund: 'general', method: 'mpesa', d: 3 },
    { user: joseph.id, amount: 100, fund: 'missions', method: 'card', d: 5 },
    { user: demo.id, amount: 30, fund: 'benevolence', method: 'orange', d: 8 },
  ];
  for (const d of donationSpecs) {
    await prisma.donation.create({
      data: {
        ref: `GFT-024-${n++}`,
        userId: d.user,
        amount: d.amount,
        fundId: d.fund,
        method: d.method,
        status: DonationStatus.received,
        createdAt: daysAgo(d.d),
      },
    });
  }

  // ── Wallet du membre démo (transactions) ──
  const demoWallet = await prisma.amenWallet.findUniqueOrThrow({ where: { userId: demo.id } });
  await prisma.amenTransaction.createMany({
    data: [
      { walletId: demoWallet.id, kind: AmenTxnKind.topup, coins: 50, method: 'M-Pesa', status: AmenTxnStatus.completed, createdAt: daysAgo(0) },
      { walletId: demoWallet.id, kind: AmenTxnKind.amen, coins: -1, fundId: 'general', service: 'Sunday Service', status: AmenTxnStatus.completed, createdAt: daysAgo(0) },
      { walletId: demoWallet.id, kind: AmenTxnKind.amen, coins: -2, fundId: 'missions', service: 'Sunday Service', status: AmenTxnStatus.completed, createdAt: daysAgo(0) },
    ],
  });

  // ── Rendez-vous ──
  console.log('🌱 Rendez-vous…');
  await prisma.appointment.create({
    data: { userId: demo.id, topicId: 'counseling', pastorId: mukendi.id, slotStart: daysAhead(2), location: "Pastor's office", status: AppointmentStatus.confirmed },
  });
  await prisma.appointment.create({
    data: { userId: joseph.id, topicId: 'marriage', pastorId: mukendi.id, slotStart: daysAhead(3), location: "Pastor's office", status: AppointmentStatus.tentative },
  });

  // ── Notifications + activité ──
  console.log('🌱 Notifications + activité…');
  await prisma.notification.createMany({
    data: [
      { userId: demo.id, group: 'Today', icon: 'verse', title: "Today's verse is ready", subtitle: 'Romans 8:28 · When the wait feels long', color: '#1F6FEB', sentAt: daysAgo(0) },
      { userId: demo.id, group: 'Today', icon: 'pray', title: '3 people prayed for your request', subtitle: 'Praying for clarity tomorrow…', color: '#1FB36A', sentAt: daysAgo(0) },
    ],
  });
  await prisma.activityLog.createMany({
    data: [
      { kind: 'give', actorLabel: 'Joseph K.', description: 'gave $200 to Building project' },
      { kind: 'prayer', actorLabel: 'Grace M.', description: 'submitted a public prayer request' },
      { kind: 'live', actorLabel: 'System', description: 'Sunday service stream started' },
    ],
  });

  console.log('✅ Seed terminé.');
  console.log('   Comptes de démo (OTP loggé en console côté backend) :');
  console.log('   • Membre  : +243810000099');
  console.log('   • Leader  : +243810000010');
  console.log('   • Pasteur : +243810000001');
  console.log('   • Admin   : +243810000003');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
