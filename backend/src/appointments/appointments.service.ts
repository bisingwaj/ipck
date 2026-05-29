import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointments.dto';

const SLOT_HOURS = [10, 11, 14, 15, 16]; // créneaux quotidiens
const HORIZON_DAYS = 14;

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  listTopics() {
    return this.prisma.appointmentTopic.findMany({ where: { enabled: true } });
  }

  /** Créneaux disponibles sur l'horizon, hors créneaux déjà réservés. */
  async slots(from?: string, to?: string) {
    const start = from ? new Date(from) : new Date();
    const end = to ? new Date(to) : new Date(start.getTime() + HORIZON_DAYS * 86_400_000);

    const booked = await this.prisma.appointment.findMany({
      where: {
        slotStart: { gte: start, lte: end },
        status: { in: [AppointmentStatus.tentative, AppointmentStatus.confirmed] },
      },
      select: { slotStart: true },
    });
    const bookedSet = new Set(booked.map((b) => b.slotStart.toISOString()));

    const days: { day: string; slots: { start: string; available: boolean }[] }[] = [];
    for (let d = 0; d < HORIZON_DAYS; d++) {
      const day = new Date(start);
      day.setDate(day.getDate() + d);
      const dow = day.getDay();
      if (dow === 0) continue; // pas de RDV le dimanche
      const slots = SLOT_HOURS.map((h) => {
        const slot = new Date(day);
        slot.setHours(h, 0, 0, 0);
        return { start: slot.toISOString(), available: !bookedSet.has(slot.toISOString()) };
      });
      days.push({ day: day.toISOString().slice(0, 10), slots });
    }
    return days;
  }

  async create(userId: string, dto: CreateAppointmentDto) {
    const topic = await this.prisma.appointmentTopic.findUnique({ where: { id: dto.topicId } });
    if (!topic) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Sujet introuvable' });

    const appointment = await this.prisma.appointment.create({
      data: {
        userId,
        topicId: dto.topicId,
        slotStart: new Date(dto.slotStart),
        notes: dto.notes,
        status: AppointmentStatus.tentative,
      },
      include: { topic: true },
    });
    await this.activity.log('appts', 'Member', `booked a ${topic.label} appointment`);
    return appointment;
  }

  mine(userId: string) {
    return this.prisma.appointment.findMany({
      where: { userId },
      orderBy: { slotStart: 'asc' },
      include: { topic: true, pastor: true },
    });
  }

  async cancel(userId: string, id: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appt || appt.userId !== userId) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Rendez-vous introuvable' });
    }
    await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.cancelled },
    });
  }

  // ── Staff ──
  agenda(from?: string, to?: string) {
    const where =
      from || to
        ? {
            slotStart: {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            },
          }
        : {};
    return this.prisma.appointment.findMany({
      where: { ...where, status: { not: AppointmentStatus.cancelled } },
      orderBy: { slotStart: 'asc' },
      include: { topic: true, user: true, pastor: true },
    });
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const exists = await this.prisma.appointment.count({ where: { id } });
    if (!exists)
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Rendez-vous introuvable' });
    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status,
        pastorId: dto.pastorId,
        location: dto.location,
        slotStart: dto.slotStart ? new Date(dto.slotStart) : undefined,
      },
      include: { topic: true, user: true, pastor: true },
    });
  }
}
