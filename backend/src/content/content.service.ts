import { Injectable, NotFoundException } from '@nestjs/common';
import { Content, ContentCategory, ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { paginate, Paginated } from '../common/dto/paginated';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Liste publique : contenus publiés, filtrables par catégorie / live / mise en avant. */
  async list(
    query: PaginationQueryDto,
    filters: { category?: ContentCategory; live?: boolean; featured?: boolean },
  ): Promise<Paginated<Content>> {
    const where: Prisma.ContentWhereInput = { status: ContentStatus.published };
    if (filters.category) where.category = filters.category;
    if (filters.live !== undefined) where.isLive = filters.live;
    if (filters.featured !== undefined) where.featured = filters.featured;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.content.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy(['publishAt'], { publishAt: 'desc' }),
      }),
      this.prisma.content.count({ where }),
    ]);
    return paginate(rows, total, query);
  }

  /** Liste dashboard (staff) : tous statuts confondus, filtrable par catégorie. */
  async listAdmin(
    query: PaginationQueryDto,
    filters: { category?: ContentCategory },
  ): Promise<Paginated<Content>> {
    const where: Prisma.ContentWhereInput = {};
    if (filters.category) where.category = filters.category;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.content.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy(['publishAt', 'createdAt'], { createdAt: 'desc' }),
      }),
      this.prisma.content.count({ where }),
    ]);
    return paginate(rows, total, query);
  }

  /** Live courant : le contenu publié marqué `isLive`, le plus récent (ou null). */
  async currentLive(): Promise<Content | null> {
    return this.prisma.content.findFirst({
      where: { status: ContentStatus.published, isLive: true },
      orderBy: { publishAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Content> {
    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Contenu introuvable' });
    return content;
  }

  create(dto: CreateContentDto): Promise<Content> {
    return this.prisma.content.create({ data: dto });
  }

  async update(id: string, dto: UpdateContentDto): Promise<Content> {
    await this.findOne(id);
    return this.prisma.content.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.content.delete({ where: { id } });
  }
}
