import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, Devotional } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { paginate, Paginated } from '../common/dto/paginated';
import { CreateDevotionalDto, UpdateDevotionalDto } from './dto/devotionals.dto';
import { WalletService } from '../giving/wallet.service';

type DevotionalWithRead = Devotional & { read?: boolean };

const VERSE_REWARD = 10; // Blessings gagnés en lisant le verset du jour

@Injectable()
export class DevotionalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  /** Dévotion publiée la plus récente. */
  async today(userId: string): Promise<DevotionalWithRead> {
    const devo = await this.prisma.devotional.findFirst({
      where: { status: ContentStatus.published, publishAt: { lte: new Date() } },
      orderBy: { publishAt: 'desc' },
    });
    if (!devo) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Aucune dévotion' });
    const read = await this.prisma.devotionalRead.findUnique({
      where: { userId_devotionalId: { userId, devotionalId: devo.id } },
    });
    return { ...devo, read: !!read };
  }

  async list(userId: string, query: PaginationQueryDto): Promise<Paginated<DevotionalWithRead>> {
    const where = { status: ContentStatus.published, publishAt: { lte: new Date() } };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.devotional.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy(['publishAt'], { publishAt: 'desc' }),
      }),
      this.prisma.devotional.count({ where }),
    ]);
    const reads = await this.prisma.devotionalRead.findMany({
      where: { userId, devotionalId: { in: rows.map((r) => r.id) } },
      select: { devotionalId: true },
    });
    const readSet = new Set(reads.map((r) => r.devotionalId));
    return paginate(
      rows.map((r) => ({ ...r, read: readSet.has(r.id) })),
      total,
      query,
    );
  }

  async findOne(userId: string, id: string): Promise<DevotionalWithRead> {
    const devo = await this.prisma.devotional.findUnique({ where: { id } });
    if (!devo) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Dévotion introuvable' });
    const read = await this.prisma.devotionalRead.findUnique({
      where: { userId_devotionalId: { userId, devotionalId: id } },
    });
    return { ...devo, read: !!read };
  }

  /** Marque lu + met à jour le streak quotidien. */
  async markRead(
    userId: string,
    id: string,
  ): Promise<{ streakCount: number; blessingsAwarded: number; balanceCoins: number }> {
    const devo = await this.prisma.devotional.findUnique({ where: { id } });
    if (!devo) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Dévotion introuvable' });

    await this.prisma.devotionalRead.upsert({
      where: { userId_devotionalId: { userId, devotionalId: id } },
      create: { userId, devotionalId: id },
      update: {},
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const today = this.dayStart(new Date());
    const last = user.lastReadDay ? this.dayStart(user.lastReadDay) : null;

    let streak = user.streakCount;
    if (!last) {
      streak = 1;
    } else {
      const diffDays = Math.round((today.getTime() - last.getTime()) / 86_400_000);
      if (diffDays === 0) {
        // déjà lu aujourd'hui — inchangé
      } else if (diffDays === 1) {
        streak += 1;
      } else {
        streak = 1;
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { streakCount: streak, lastReadDay: today },
    });

    // Récompense d'engagement : +10 Blessings, une seule fois par dévotion.
    const reward = await this.wallet.reward(userId, VERSE_REWARD, 'Daily verse', `devo:${id}`);
    return { streakCount: streak, blessingsAwarded: reward.awarded, balanceCoins: reward.balanceCoins };
  }

  async create(dto: CreateDevotionalDto): Promise<Devotional> {
    return this.prisma.devotional.create({
      data: { ...dto, publishAt: dto.publishAt ? new Date(dto.publishAt) : undefined },
    });
  }

  async update(id: string, dto: UpdateDevotionalDto): Promise<Devotional> {
    await this.ensureExists(id);
    return this.prisma.devotional.update({
      where: { id },
      data: { ...dto, publishAt: dto.publishAt ? new Date(dto.publishAt) : undefined },
    });
  }

  async remove(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.prisma.devotional.delete({ where: { id } });
  }

  private async ensureExists(id: string): Promise<void> {
    const exists = await this.prisma.devotional.count({ where: { id } });
    if (!exists)
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Dévotion introuvable' });
  }

  private dayStart(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
}
