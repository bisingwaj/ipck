import { Injectable } from '@nestjs/common';
import { ContentStatus, DonationStatus, PrayerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** KPIs de la vue d'ensemble (dashboard Overview). */
  async overview() {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [members, givingMtd, openPrayers, live, devoSubs, devoReadsToday] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.donation.aggregate({
        where: { status: DonationStatus.received, createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.prayer.count({ where: { status: PrayerStatus.pending } }),
      this.prisma.liveSession.findFirst({
        where: { state: 'live' },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.user.count(),
      this.prisma.devotionalRead.count({ where: { readAt: { gte: startOfDay } } }),
    ]);

    const completion = devoSubs > 0 ? Math.round((devoReadsToday / devoSubs) * 100) : 0;

    return {
      kpis: [
        { id: 'members', label: 'Active members', value: members },
        { id: 'giving', label: 'Giving · month-to-date', value: givingMtd._sum.amount ?? 0 },
        { id: 'viewers', label: 'Live · peak today', value: live?.viewersPeak ?? 0, live: !!live },
        { id: 'prayers', label: 'Prayer queue · open', value: openPrayers },
        { id: 'devo', label: 'Devotional completion', value: completion },
      ],
    };
  }

  /** Métriques d'engagement (dashboard People). */
  async engagement() {
    const startOfWeek = new Date(Date.now() - 7 * 86_400_000);
    const [members, active7d, readsWeek] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.devotionalRead.findMany({
        where: { readAt: { gte: startOfWeek } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.devotionalRead.count({ where: { readAt: { gte: startOfWeek } } }),
    ]);
    const activePct = members > 0 ? Math.round((active7d.length / members) * 100) : 0;
    const completionPct = members > 0 ? Math.round((readsWeek / (members * 7)) * 100) : 0;
    return [
      { label: 'Devotional completion', pct: completionPct, target: 75 },
      { label: 'Members active 7d', pct: activePct, target: 50 },
    ];
  }

  /** Contenu à venir (dashboard Content). */
  async upcomingContent() {
    const [devos, sermons] = await Promise.all([
      this.prisma.devotional.findMany({
        where: { status: { in: [ContentStatus.scheduled, ContentStatus.draft] } },
        orderBy: { publishAt: 'asc' },
        take: 10,
      }),
      this.prisma.sermon.findMany({
        where: { status: { in: [ContentStatus.scheduled, ContentStatus.draft] } },
        orderBy: { publishAt: 'asc' },
        take: 10,
      }),
    ]);
    return [
      ...devos.map((d) => ({
        type: 'Devotional',
        title: d.title,
        when: d.publishAt.toISOString(),
        author: d.author ?? '—',
        status: d.status,
      })),
      ...sermons.map((s) => ({
        type: 'Sermon',
        title: s.title,
        when: s.publishAt.toISOString(),
        author: s.author ?? s.speaker,
        status: s.status,
      })),
    ].sort((a, b) => a.when.localeCompare(b.when));
  }
}
