import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, Prisma, Sermon } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { paginate, Paginated } from '../common/dto/paginated';
import { CreateSermonDto, UpdateSermonDto } from './dto/sermons.dto';

@Injectable()
export class SermonsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: PaginationQueryDto,
    filters: { series?: string; live?: boolean },
  ): Promise<Paginated<Sermon>> {
    const where: Prisma.SermonWhereInput = { status: ContentStatus.published };
    if (filters.series) where.series = filters.series;
    if (filters.live !== undefined) where.live = filters.live;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.sermon.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy(['publishAt'], { publishAt: 'desc' }),
      }),
      this.prisma.sermon.count({ where }),
    ]);
    return paginate(rows, total, query);
  }

  async findOne(id: string): Promise<Sermon> {
    const sermon = await this.prisma.sermon.findUnique({ where: { id } });
    if (!sermon) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Sermon introuvable' });
    return sermon;
  }

  create(dto: CreateSermonDto): Promise<Sermon> {
    return this.prisma.sermon.create({ data: dto });
  }

  async update(id: string, dto: UpdateSermonDto): Promise<Sermon> {
    await this.findOne(id);
    return this.prisma.sermon.update({ where: { id }, data: dto });
  }
}
