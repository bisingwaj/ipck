import { Injectable, NotFoundException } from '@nestjs/common';
import { Prayer, PrayerStatus, PrayerVisibility, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { paginate, Paginated } from '../common/dto/paginated';
import { ActivityService } from '../activity/activity.service';
import { CreatePrayerDto, UpdatePrayerStatusDto, RespondPrayerDto } from './dto/prayers.dto';

type PrayerRow = Prayer & { author: User; _count: { amens: number }; amens: { userId: string }[] };

@Injectable()
export class PrayersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  /** Mur public : prières publiques/anonymes approuvées. */
  async wall(userId: string, query: PaginationQueryDto): Promise<Paginated<unknown>> {
    const where = {
      status: PrayerStatus.approved,
      visibility: { in: [PrayerVisibility.public, PrayerVisibility.anon] },
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.prayer.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          _count: { select: { amens: true } },
          amens: { where: { userId } },
        },
      }),
      this.prisma.prayer.count({ where }),
    ]);
    return paginate(
      rows.map((r) => this.present(r as PrayerRow, userId)),
      total,
      query,
    );
  }

  async findOne(userId: string, id: string) {
    const row = await this.prisma.prayer.findUnique({
      where: { id },
      include: { author: true, _count: { select: { amens: true } }, amens: { where: { userId } } },
    });
    if (!row) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Prière introuvable' });
    return this.present(row as PrayerRow, userId);
  }

  /** Création : public/anon → approuvé (mur) ; private → file de care (pending). */
  async create(userId: string, dto: CreatePrayerDto) {
    const status =
      dto.visibility === PrayerVisibility.private ? PrayerStatus.pending : PrayerStatus.approved;
    const row = await this.prisma.prayer.create({
      data: { authorId: userId, text: dto.text, visibility: dto.visibility, status },
      include: { author: true, _count: { select: { amens: true } }, amens: { where: { userId } } },
    });
    await this.activity.log('prayer', 'Member', `submitted a ${dto.visibility} prayer request`);
    return this.present(row as PrayerRow, userId);
  }

  /** Toggle « prayed ». */
  async toggleAmen(userId: string, id: string) {
    const prayer = await this.prisma.prayer.findUnique({ where: { id } });
    if (!prayer) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Prière introuvable' });

    const existing = await this.prisma.prayerAmen.findUnique({
      where: { prayerId_userId: { prayerId: id, userId } },
    });
    if (existing) {
      await this.prisma.prayerAmen.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.prayerAmen.create({ data: { prayerId: id, userId } });
    }
    const amenCount = await this.prisma.prayerAmen.count({ where: { prayerId: id } });
    return { amenCount, iPrayed: !existing };
  }

  // ── Dashboard care (pastor+) ──

  async queue(query: PaginationQueryDto): Promise<Paginated<unknown>> {
    const where = { status: PrayerStatus.pending };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.prayer.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'asc' },
        include: { author: true, _count: { select: { amens: true } }, amens: true },
      }),
      this.prisma.prayer.count({ where }),
    ]);
    return paginate(
      rows.map((r) => this.presentForStaff(r as PrayerRow)),
      total,
      query,
    );
  }

  async setStatus(id: string, dto: UpdatePrayerStatusDto) {
    await this.ensureExists(id);
    return this.prisma.prayer.update({ where: { id }, data: { status: dto.status } });
  }

  async respond(id: string, dto: RespondPrayerDto) {
    const prayer = await this.prisma.prayer.findUnique({ where: { id } });
    if (!prayer) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Prière introuvable' });
    await this.prisma.prayer.update({
      where: { id },
      data: { response: dto.message, status: PrayerStatus.answered },
    });
    await this.prisma.notification.create({
      data: {
        userId: prayer.authorId,
        group: 'Today',
        icon: 'pray',
        title: 'A pastor responded to your prayer',
        subtitle: dto.message.slice(0, 80),
        color: '#1FB36A',
      },
    });
    return { ok: true };
  }

  private present(r: PrayerRow, _userId: string) {
    const anon = r.visibility !== PrayerVisibility.public;
    const name = anon
      ? 'Anonymous'
      : `${r.author.firstName ?? ''} ${r.author.lastName ?? ''}`.trim();
    return {
      id: r.id,
      who: name || 'Anonymous',
      initials: anon ? 'A' : this.initials(r.author),
      visibility: r.visibility,
      text: r.text,
      amen: r._count.amens,
      iPrayed: r.amens.length > 0,
      at: r.createdAt.toISOString(),
    };
  }

  private presentForStaff(r: PrayerRow) {
    return {
      id: r.id,
      who: `${r.author.firstName ?? ''} ${r.author.lastName ?? ''}`.trim() || 'Member',
      visibility: r.visibility,
      text: r.text,
      status: r.status,
      at: r.createdAt.toISOString(),
    };
  }

  private initials(user: User): string {
    return `${(user.firstName ?? '?').charAt(0)}${(user.lastName ?? '').charAt(0)}`.toUpperCase();
  }

  private async ensureExists(id: string): Promise<void> {
    const exists = await this.prisma.prayer.count({ where: { id } });
    if (!exists) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Prière introuvable' });
  }
}
