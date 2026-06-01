import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { paginate, Paginated } from '../common/dto/paginated';
import { LiveGateway } from '../sermons/live.gateway';
import { CreateGroupDto, UpdateGroupDto, SendMessageDto } from './dto/groups.dto';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: LiveGateway,
  ) {}

  /** Liste des groupes avec compteurs (membres, non-lus, dernier message). */
  async list(userId: string, mine: boolean) {
    const groups = await this.prisma.group.findMany({
      where: mine ? { memberships: { some: { userId } } } : {},
      include: {
        leader: true,
        _count: { select: { memberships: true } },
        memberships: { where: { userId }, take: 1 },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { author: true } },
      },
      orderBy: { name: 'asc' },
    });

    return Promise.all(
      groups.map(async (g) => {
        const membership = g.memberships[0];
        const unread = membership
          ? await this.prisma.groupMessage.count({
              where: { groupId: g.id, createdAt: { gt: membership.lastReadAt } },
            })
          : 0;
        const last = g.messages[0];
        return {
          id: g.id,
          name: g.name,
          description: g.description,
          members: g._count.memberships,
          unread,
          lastMessage: last ? `${last.author.firstName ?? 'Member'}: ${last.text}` : '',
          leader: g.leader ? `${g.leader.firstName ?? ''} ${g.leader.lastName ?? ''}`.trim() : '',
          meets: g.meets,
          color: g.color,
          isMember: !!membership,
        };
      }),
    );
  }

  async findOne(userId: string, id: string) {
    const list = await this.list(userId, false);
    const group = list.find((g) => g.id === id);
    if (!group) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Groupe introuvable' });
    return group;
  }

  async join(userId: string, groupId: string) {
    await this.ensureGroup(groupId);
    await this.prisma.groupMembership.upsert({
      where: { userId_groupId: { userId, groupId } },
      create: { userId, groupId },
      update: {},
    });
    return { ok: true };
  }

  async leave(userId: string, groupId: string) {
    await this.prisma.groupMembership.deleteMany({ where: { userId, groupId } });
  }

  async messages(
    userId: string,
    groupId: string,
    query: PaginationQueryDto,
  ): Promise<Paginated<unknown>> {
    await this.ensureMember(userId, groupId);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.groupMessage.findMany({
        where: { groupId },
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
        include: { author: true },
      }),
      this.prisma.groupMessage.count({ where: { groupId } }),
    ]);
    const data = rows.reverse().map((m) => ({
      id: m.id,
      who: m.author.firstName
        ? `${m.author.firstName} ${(m.author.lastName ?? '').charAt(0)}.`.trim()
        : 'Member',
      authorId: m.authorId,
      text: m.text,
      at: m.createdAt.toISOString(),
      mine: m.authorId === userId,
    }));
    return paginate(data, total, query);
  }

  async sendMessage(userId: string, groupId: string, dto: SendMessageDto) {
    await this.ensureMember(userId, groupId);
    const message = await this.prisma.groupMessage.create({
      data: { groupId, authorId: userId, text: dto.text },
      include: { author: true },
    });
    const payload = {
      id: message.id,
      who: message.author.firstName
        ? `${message.author.firstName} ${(message.author.lastName ?? '').charAt(0)}.`.trim()
        : 'Member',
      authorId: userId,
      text: message.text,
      at: message.createdAt.toISOString(),
    };
    this.gateway.broadcastChatMessage(groupId, payload);
    return { ...payload, mine: true };
  }

  async markRead(userId: string, groupId: string) {
    await this.prisma.groupMembership.updateMany({
      where: { userId, groupId },
      data: { lastReadAt: new Date() },
    });
    return { ok: true };
  }

  create(dto: CreateGroupDto) {
    return this.prisma.group.create({ data: dto });
  }

  // ───────────────────────── Membres (staff) ─────────────────────────

  /** Liste les membres d'un groupe avec leur identité publique (dashboard). */
  async listMembers(groupId: string) {
    await this.ensureGroup(groupId);
    const memberships = await this.prisma.groupMembership.findMany({
      where: { groupId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });
    return memberships.map((m) => ({
      id: m.user.id,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      phone: m.user.phone,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    }));
  }

  /** Ajoute un membre arbitraire au groupe (staff). Idempotent. */
  async addMember(groupId: string, userId: string) {
    await this.ensureGroup(groupId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Utilisateur introuvable' });
    }
    await this.prisma.groupMembership.upsert({
      where: { userId_groupId: { userId, groupId } },
      create: { userId, groupId },
      update: {},
    });
    return { ok: true };
  }

  /** Retire un membre du groupe (staff). */
  async removeMember(groupId: string, userId: string) {
    await this.ensureGroup(groupId);
    await this.prisma.groupMembership.deleteMany({ where: { userId, groupId } });
  }

  /** Conversation du groupe pour modération (staff) — sans condition d'appartenance. */
  async messagesForStaff(groupId: string, query: PaginationQueryDto): Promise<Paginated<unknown>> {
    await this.ensureGroup(groupId);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.groupMessage.findMany({
        where: { groupId },
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
        include: { author: true },
      }),
      this.prisma.groupMessage.count({ where: { groupId } }),
    ]);
    const data = rows.reverse().map((m) => ({
      id: m.id,
      who:
        `${m.author.firstName ?? ''} ${m.author.lastName ?? ''}`.trim() ||
        m.author.phone ||
        'Membre',
      authorId: m.authorId,
      text: m.text,
      at: m.createdAt.toISOString(),
    }));
    return paginate(data, total, query);
  }

  /** Supprime un message du groupe (staff / modération). */
  async deleteMessage(groupId: string, messageId: string) {
    await this.ensureGroup(groupId);
    const message = await this.prisma.groupMessage.findUnique({ where: { id: messageId } });
    if (!message || message.groupId !== groupId) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Message introuvable' });
    }
    await this.prisma.groupMessage.delete({ where: { id: messageId } });
  }

  async update(userId: string, role: string, id: string, dto: UpdateGroupDto) {
    const group = await this.ensureGroup(id);
    const isStaff = role === 'pastor' || role === 'admin';
    if (!isStaff && group.leaderId !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Réservé au leader ou au staff' });
    }
    return this.prisma.group.update({ where: { id }, data: dto });
  }

  private async ensureGroup(id: string) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Groupe introuvable' });
    return group;
  }

  private async ensureMember(userId: string, groupId: string) {
    const membership = await this.prisma.groupMembership.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Vous n’êtes pas membre du groupe',
      });
    }
  }
}
