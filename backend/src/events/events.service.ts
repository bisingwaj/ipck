import { Injectable, NotFoundException } from '@nestjs/common';
import { RsvpStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateEventDto, UpdateEventDto, RsvpDto } from './dto/events.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  async list(userId: string) {
    const events = await this.prisma.churchEvent.findMany({
      orderBy: { startsAt: 'asc' },
      include: {
        _count: { select: { rsvps: { where: { status: RsvpStatus.going } } } },
        rsvps: { where: { userId }, take: 1 },
      },
    });
    return events.map((e) => this.present(e, userId));
  }

  async findOne(userId: string, id: string) {
    const event = await this.prisma.churchEvent.findUnique({
      where: { id },
      include: {
        _count: { select: { rsvps: { where: { status: RsvpStatus.going } } } },
        rsvps: { where: { userId }, take: 1 },
      },
    });
    if (!event)
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Événement introuvable' });
    return this.present(event, userId);
  }

  async rsvp(userId: string, eventId: string, dto: RsvpDto) {
    const event = await this.prisma.churchEvent.findUnique({ where: { id: eventId } });
    if (!event)
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Événement introuvable' });

    await this.prisma.eventRsvp.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status: dto.status },
      update: { status: dto.status },
    });
    if (dto.status === RsvpStatus.going) {
      await this.activity.log('events', 'Member', `RSVP'd to ${event.name}`);
    }
    return this.findOne(userId, eventId);
  }

  create(dto: CreateEventDto) {
    return this.prisma.churchEvent.create({
      data: { ...dto, startsAt: new Date(dto.startsAt) },
    });
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.ensureExists(id);
    return this.prisma.churchEvent.update({
      where: { id },
      data: { ...dto, startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined },
    });
  }

  private present(
    e: {
      id: string;
      name: string;
      startsAt: Date;
      whenLabel: string | null;
      location: string | null;
      capacity: number | null;
      color: string;
      description: string | null;
      _count: { rsvps: number };
      rsvps: { status: RsvpStatus }[];
    },
    _userId: string,
  ) {
    return {
      id: e.id,
      name: e.name,
      when: e.whenLabel ?? e.startsAt.toISOString(),
      startsAt: e.startsAt.toISOString(),
      loc: e.location,
      cap: e.capacity ?? undefined,
      rsvp: e._count.rsvps,
      color: e.color,
      description: e.description,
      myRsvp: e.rsvps[0]?.status ?? null,
    };
  }

  private async ensureExists(id: string): Promise<void> {
    const exists = await this.prisma.churchEvent.count({ where: { id } });
    if (!exists)
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Événement introuvable' });
  }
}
