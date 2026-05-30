import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AmenTransaction, AmenTxnKind, AmenTxnStatus, DonationStatus } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { paginate, Paginated } from '../common/dto/paginated';
import { PAYMENT_PROVIDER, PaymentProvider } from './payment/payment.provider';
import { TopupWalletDto, SetDefaultFundDto, SendToFundDto } from './dto/giving.dto';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly payment: PaymentProvider,
  ) {}

  /** Récupère (ou crée) le wallet du membre, au format attendu par le mobile. */
  async getWallet(userId: string) {
    const wallet = await this.ensureWallet(userId);
    const recent = await this.prisma.amenTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const fund = await this.prisma.fund.findUnique({ where: { id: wallet.defaultFundId } });
    return {
      balanceCoins: wallet.balanceCoins,
      pendingTopupCoins: wallet.pendingTopupCoins,
      defaultFund: fund?.name ?? 'General fund',
      defaultFundId: wallet.defaultFundId,
      recent: recent.map(this.presentTxn),
    };
  }

  async listTransactions(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<Paginated<ReturnType<WalletService['presentTxn']>>> {
    const wallet = await this.ensureWallet(userId);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.amenTransaction.findMany({
        where: { walletId: wallet.id },
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.amenTransaction.count({ where: { walletId: wallet.id } }),
    ]);
    return paginate(rows.map(this.presentTxn), total, query);
  }

  /** Recharge le wallet : transaction pending puis paiement (mock → completed). */
  async topup(userId: string, dto: TopupWalletDto) {
    const wallet = await this.ensureWallet(userId);
    const ref = `TOP-${Date.now().toString(36)}-${userId.slice(-4)}`;

    const txn = await this.prisma.amenTransaction.create({
      data: {
        walletId: wallet.id,
        kind: AmenTxnKind.topup,
        coins: dto.coins,
        method: dto.method,
        status: AmenTxnStatus.pending,
      },
    });
    await this.prisma.amenWallet.update({
      where: { id: wallet.id },
      data: { pendingTopupCoins: { increment: dto.coins } },
    });

    const result = await this.payment.initiate({ ref, amount: dto.coins, method: dto.method });
    if (result.status === 'received') {
      await this.completeTopup(txn.id);
    }
    return this.presentTxn(
      await this.prisma.amenTransaction.findUniqueOrThrow({ where: { id: txn.id } }),
    );
  }

  /** Confirme une recharge : crédite le solde, sort du pending. */
  async completeTopup(txnId: string): Promise<void> {
    const txn = await this.prisma.amenTransaction.findUnique({ where: { id: txnId } });
    if (!txn || txn.status === AmenTxnStatus.completed) return;
    await this.prisma.$transaction([
      this.prisma.amenTransaction.update({
        where: { id: txnId },
        data: { status: AmenTxnStatus.completed },
      }),
      this.prisma.amenWallet.update({
        where: { id: txn.walletId },
        data: {
          balanceCoins: { increment: txn.coins },
          pendingTopupCoins: { decrement: txn.coins },
        },
      }),
    ]);
  }

  /** Envoie des coins du wallet vers un fonds (redeem) : débite le solde + crée un don reçu. */
  async sendToFund(userId: string, dto: SendToFundDto) {
    const fund = await this.prisma.fund.findUnique({ where: { id: dto.fundId } });
    if (!fund) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Fonds introuvable' });

    const wallet = await this.ensureWallet(userId);
    if (wallet.balanceCoins < dto.coins) {
      throw new BadRequestException({ code: 'INSUFFICIENT_BALANCE', message: 'Solde insuffisant' });
    }

    const ref = `GFT-${randomInt(0, 1000).toString().padStart(3, '0')}-${randomInt(0, 1000)
      .toString()
      .padStart(3, '0')}`;

    const [donation] = await this.prisma.$transaction([
      this.prisma.donation.create({
        data: {
          ref,
          userId,
          amount: dto.coins,
          fundId: dto.fundId,
          method: 'wallet',
          anonymous: false,
          status: DonationStatus.received,
        },
      }),
      this.prisma.amenWallet.update({
        where: { id: wallet.id },
        data: { balanceCoins: { decrement: dto.coins } },
      }),
      this.prisma.amenTransaction.create({
        data: {
          walletId: wallet.id,
          kind: AmenTxnKind.redeem,
          coins: -dto.coins,
          fundId: dto.fundId,
          status: AmenTxnStatus.completed,
        },
      }),
    ]);
    return donation;
  }

  async setDefaultFund(userId: string, dto: SetDefaultFundDto) {
    const fund = await this.prisma.fund.findUnique({ where: { id: dto.fundId } });
    if (!fund) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Fonds introuvable' });
    const wallet = await this.ensureWallet(userId);
    await this.prisma.amenWallet.update({
      where: { id: wallet.id },
      data: { defaultFundId: dto.fundId },
    });
    return this.getWallet(userId);
  }

  /** Dépense des coins (amen live). Débit atomique avec contrôle de solde. */
  async spendAmen(
    userId: string,
    coins: number,
    opts: { fundId?: string; service?: string } = {},
  ): Promise<{ balanceCoins: number; transaction: ReturnType<WalletService['presentTxn']> }> {
    if (coins <= 0)
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'coins > 0 requis' });
    const wallet = await this.ensureWallet(userId);
    if (wallet.balanceCoins < coins) {
      throw new BadRequestException({ code: 'INSUFFICIENT_BALANCE', message: 'Solde insuffisant' });
    }
    const fundId = opts.fundId ?? wallet.defaultFundId;
    const [, txn] = await this.prisma.$transaction([
      this.prisma.amenWallet.update({
        where: { id: wallet.id },
        data: { balanceCoins: { decrement: coins } },
      }),
      this.prisma.amenTransaction.create({
        data: {
          walletId: wallet.id,
          kind: AmenTxnKind.amen,
          coins: -coins,
          fundId,
          service: opts.service,
          status: AmenTxnStatus.completed,
        },
      }),
    ]);
    return { balanceCoins: wallet.balanceCoins - coins, transaction: this.presentTxn(txn) };
  }

  /**
   * Crédite des Blessings « gagnés » (engagement spirituel) dans la Grace Reserve.
   * Idempotent via dedupeKey (ex. `devo:<id>`, `prayer:<id>`) → 1 récompense max par source.
   */
  async reward(
    userId: string,
    coins: number,
    label: string,
    dedupeKey?: string,
  ): Promise<{ balanceCoins: number; awarded: number }> {
    const wallet = await this.ensureWallet(userId);
    if (dedupeKey) {
      const existing = await this.prisma.amenTransaction.findFirst({
        where: { walletId: wallet.id, kind: AmenTxnKind.reward, service: dedupeKey },
      });
      if (existing) return { balanceCoins: wallet.balanceCoins, awarded: 0 };
    }
    const [updated] = await this.prisma.$transaction([
      this.prisma.amenWallet.update({
        where: { id: wallet.id },
        data: { balanceCoins: { increment: coins } },
      }),
      this.prisma.amenTransaction.create({
        data: {
          walletId: wallet.id,
          kind: AmenTxnKind.reward,
          coins,
          service: dedupeKey ?? label,
          status: AmenTxnStatus.completed,
        },
      }),
    ]);
    return { balanceCoins: updated.balanceCoins, awarded: coins };
  }

  private async ensureWallet(userId: string) {
    const existing = await this.prisma.amenWallet.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.amenWallet.create({ data: { userId } });
  }

  private presentTxn(txn: AmenTransaction) {
    return {
      id: txn.id,
      kind: txn.kind,
      coins: txn.coins,
      when: txn.createdAt.toISOString(),
      service: txn.service ?? undefined,
      fund: txn.fundId ?? undefined,
      method: txn.method ?? undefined,
      status: txn.status,
    };
  }
}
