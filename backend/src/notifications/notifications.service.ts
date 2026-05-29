import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { PushService } from './push.service';
import { MarkReadDto, BroadcastDto } from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly activity: ActivityService,
  ) {}

  async list(userId: string) {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });
    return rows.map((n) => ({
      id: n.id,
      group: n.group,
      icon: n.icon,
      title: n.title,
      subtitle: n.subtitle,
      when: n.sentAt.toISOString(),
      unread: !n.readAt,
      color: n.color,
    }));
  }

  async markRead(userId: string, dto: MarkReadDto) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        ...(dto.ids && dto.ids.length ? { id: { in: dto.ids } } : {}),
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  /** Broadcast staff : crée une notif par membre + envoie un push Expo. */
  async broadcast(dto: BroadcastDto) {
    const users = await this.prisma.user.findMany({ select: { id: true } });
    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        group: 'Today',
        icon: 'broadcast',
        title: dto.title,
        subtitle: dto.body.slice(0, 100),
        color: '#1F6FEB',
      })),
    });

    const tokens = await this.prisma.pushToken.findMany({ select: { expoToken: true } });
    const result = await this.push.send({
      to: tokens.map((t) => t.expoToken),
      title: dto.title,
      body: dto.body,
    });
    await this.activity.log('broadcast', 'Pastor', `sent a broadcast — ${dto.audience ?? 'all'}`);
    return { recipients: users.length, pushed: result.sent };
  }
}
