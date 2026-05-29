import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { paginate, Paginated } from '../common/dto/paginated';
import { presentUser, PublicUser } from './user.presenter';
import { UpdateProfileDto, UpdateInterestsDto, RegisterPushTokenDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<PublicUser> {
    const user = await this.prisma.user.update({ where: { id: userId }, data: dto });
    return presentUser(user);
  }

  async updateInterests(userId: string, dto: UpdateInterestsDto): Promise<PublicUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { interests: dto.interests },
    });
    return presentUser(user);
  }

  /** Streak : compteur + 7 derniers jours (lecture quotidienne). */
  async streak(userId: string): Promise<{ count: number; days: boolean[] }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const reads = await this.prisma.devotionalRead.findMany({
      where: { userId, readAt: { gte: since } },
      select: { readAt: true },
    });
    const readDays = new Set(reads.map((r) => r.readAt.toISOString().slice(0, 10)));

    const days: boolean[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(readDays.has(d.toISOString().slice(0, 10)));
    }
    return { count: user.streakCount, days };
  }

  async registerPushToken(userId: string, dto: RegisterPushTokenDto): Promise<{ ok: true }> {
    await this.prisma.pushToken.upsert({
      where: { expoToken: dto.expoToken },
      create: { userId, expoToken: dto.expoToken, platform: dto.platform },
      update: { userId, platform: dto.platform },
    });
    return { ok: true };
  }

  async removePushToken(userId: string, token: string): Promise<void> {
    await this.prisma.pushToken.deleteMany({ where: { userId, expoToken: token } });
  }

  async list(query: PaginationQueryDto): Promise<Paginated<PublicUser>> {
    const where = query.q
      ? {
          OR: [
            { firstName: { contains: query.q, mode: 'insensitive' as const } },
            { lastName: { contains: query.q, mode: 'insensitive' as const } },
            { phone: { contains: query.q } },
          ],
        }
      : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy(['createdAt', 'firstName'], { createdAt: 'desc' }),
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(rows.map(presentUser), total, query);
  }

  /** Signaux « nouveaux membres » (dashboard People). */
  async newMembers(limit = 5): Promise<PublicUser[]> {
    const rows = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(presentUser);
  }
}
