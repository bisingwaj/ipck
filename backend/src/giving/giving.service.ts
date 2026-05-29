import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Donation, DonationStatus, Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { paginate, Paginated } from '../common/dto/paginated';
import { ActivityService } from '../activity/activity.service';
import { PAYMENT_PROVIDER, PaymentProvider } from './payment/payment.provider';
import { CreateDonationDto } from './dto/giving.dto';

@Injectable()
export class GivingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    @Inject(PAYMENT_PROVIDER) private readonly payment: PaymentProvider,
  ) {}

  listFunds() {
    return this.prisma.fund.findMany({ orderBy: { name: 'asc' } });
  }

  listPaymentMethods() {
    return this.prisma.paymentMethod.findMany({ where: { enabled: true } });
  }

  /** Crée un don pending puis initie le paiement (mock → received immédiat). */
  async createDonation(userId: string, dto: CreateDonationDto): Promise<Donation> {
    const fund = await this.prisma.fund.findUnique({ where: { id: dto.fundId } });
    if (!fund) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Fonds introuvable' });

    const ref = this.generateRef();
    const donation = await this.prisma.donation.create({
      data: {
        ref,
        userId,
        amount: dto.amount,
        fundId: dto.fundId,
        method: dto.method,
        anonymous: dto.anonymous ?? false,
        status: DonationStatus.pending,
      },
    });

    const result = await this.payment.initiate({
      ref,
      amount: dto.amount,
      method: dto.method,
      phone: dto.phone,
    });

    if (result.status !== 'pending') {
      return this.settle(ref, result.status, result.providerRef);
    }
    await this.prisma.donation.update({
      where: { id: donation.id },
      data: { providerRef: result.providerRef },
    });
    return donation;
  }

  listDonations(userId: string, query: PaginationQueryDto): Promise<Paginated<Donation>> {
    return this.queryDonations({ userId }, query);
  }

  async getDonation(userId: string, id: string, isStaff: boolean): Promise<Donation> {
    const donation = await this.prisma.donation.findUnique({ where: { id } });
    if (!donation) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Don introuvable' });
    if (!isStaff && donation.userId !== userId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Accès refusé' });
    }
    return donation;
  }

  /** Traite un webhook signé de provider de paiement. */
  async handleWebhook(
    rawBody: string,
    signature: string | undefined,
    payload: Record<string, unknown>,
  ) {
    try {
      this.payment.verifySignature(rawBody, signature);
    } catch (e) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: (e as Error).message,
      });
    }
    const event = this.payment.parseWebhook(payload);
    await this.settle(event.ref, event.status, event.providerRef);
    return { ok: true };
  }

  /** Finalise un don selon le statut du paiement. */
  private async settle(
    ref: string,
    status: 'received' | 'failed',
    providerRef?: string,
  ): Promise<Donation> {
    const donation = await this.prisma.donation.findUnique({ where: { ref } });
    if (!donation) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Don introuvable' });
    if (donation.status !== DonationStatus.pending) return donation;

    const updated = await this.prisma.donation.update({
      where: { ref },
      data: {
        status: status === 'received' ? DonationStatus.received : DonationStatus.failed,
        providerRef: providerRef ?? donation.providerRef,
      },
    });

    if (status === 'received') {
      const fund = await this.prisma.fund.findUnique({ where: { id: donation.fundId } });
      await this.activity.log(
        'give',
        donation.anonymous ? 'Anonymous' : 'Member',
        `gave $${donation.amount} to ${fund?.name ?? donation.fundId}`,
      );
    }
    return updated;
  }

  // ───── Dashboard (pastor+) ─────

  listAllDonations(
    query: PaginationQueryDto,
    filters: { fundId?: string; method?: string; status?: DonationStatus },
  ): Promise<Paginated<Donation>> {
    const where: Prisma.DonationWhereInput = {};
    if (filters.fundId) where.fundId = filters.fundId;
    if (filters.method) where.method = filters.method;
    if (filters.status) where.status = filters.status;
    return this.queryDonations(where, query);
  }

  /** KPIs dons : par fonds (budget/ytd), par canal, total mois en cours. */
  async summary() {
    const funds = await this.prisma.fund.findMany();
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const ytdByFund = await this.prisma.donation.groupBy({
      by: ['fundId'],
      where: { status: DonationStatus.received, createdAt: { gte: startOfYear } },
      _sum: { amount: true },
    });
    const ytdMap = new Map(ytdByFund.map((r) => [r.fundId, r._sum.amount ?? 0]));

    const byChannel = await this.prisma.donation.groupBy({
      by: ['method'],
      where: { status: DonationStatus.received, createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: { _all: true },
    });
    const mtd = byChannel.reduce((acc, c) => acc + (c._sum.amount ?? 0), 0);

    return {
      funds: funds.map((f) => ({
        id: f.id,
        name: f.name,
        budget: f.budget ?? 0,
        ytd: ytdMap.get(f.id) ?? 0,
        accent: f.accent,
      })),
      channels: byChannel.map((c) => ({
        name: c.method,
        amt: c._sum.amount ?? 0,
        count: c._count._all,
      })),
      monthToDate: mtd,
    };
  }

  /** Export CSV des dons reçus. */
  async exportCsv(): Promise<string> {
    const rows = await this.prisma.donation.findMany({
      where: { status: DonationStatus.received },
      orderBy: { createdAt: 'desc' },
      include: { fund: true, user: true },
    });
    const header = 'ref,date,amount,fund,method,donor';
    const lines = rows.map((d) => {
      const donor = d.anonymous
        ? 'Anonymous'
        : `${d.user.firstName ?? ''} ${d.user.lastName ?? ''}`.trim();
      return [d.ref, d.createdAt.toISOString(), d.amount, d.fund.name, d.method, donor].join(',');
    });
    return [header, ...lines].join('\n');
  }

  private async queryDonations(
    where: Prisma.DonationWhereInput,
    query: PaginationQueryDto,
  ): Promise<Paginated<Donation>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.donation.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy(['createdAt', 'amount'], { createdAt: 'desc' }),
      }),
      this.prisma.donation.count({ where }),
    ]);
    return paginate(rows, total, query);
  }

  private generateRef(): string {
    const block = () => randomInt(0, 1000).toString().padStart(3, '0');
    return `GFT-${block()}-${block()}`;
  }
}
