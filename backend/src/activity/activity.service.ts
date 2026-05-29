import { Injectable } from '@nestjs/common';
import { ActivityLog } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { paginate, Paginated } from '../common/dto/paginated';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  /** Journalise une action (flux d'activité dashboard). */
  async log(kind: string, actorLabel: string, description: string): Promise<void> {
    await this.prisma.activityLog.create({ data: { kind, actorLabel, description } });
  }

  async list(query: PaginationQueryDto): Promise<Paginated<ActivityLog>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.activityLog.findMany({
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activityLog.count(),
    ]);
    return paginate(rows, total, query);
  }
}
