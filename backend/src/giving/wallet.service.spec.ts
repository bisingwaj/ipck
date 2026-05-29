import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AmenTxnKind, AmenTxnStatus } from '@prisma/client';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_PROVIDER, PaymentProvider } from './payment/payment.provider';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: any;
  let payment: { initiate: jest.Mock; verifySignature: jest.Mock; parseWebhook: jest.Mock };

  const wallet = {
    id: 'w1',
    userId: 'u1',
    balanceCoins: 10,
    pendingTopupCoins: 0,
    defaultFundId: 'general',
  };

  beforeEach(async () => {
    prisma = {
      amenWallet: {
        findUnique: jest.fn().mockResolvedValue(wallet),
        create: jest.fn().mockResolvedValue(wallet),
        update: jest.fn().mockResolvedValue(wallet),
      },
      amenTransaction: {
        create: jest
          .fn()
          .mockImplementation(({ data }: any) =>
            Promise.resolve({ id: 't1', createdAt: new Date(), ...data }),
          ),
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((arr: any[]) => Promise.all(arr)),
    };
    payment = { initiate: jest.fn(), verifySignature: jest.fn(), parseWebhook: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: prisma },
        { provide: PAYMENT_PROVIDER, useValue: payment as unknown as PaymentProvider },
      ],
    }).compile();
    service = moduleRef.get(WalletService);
  });

  it('spendAmen débite le solde et crée une transaction amen', async () => {
    const res = await service.spendAmen('u1', 3, { service: 'Sunday' });
    expect(res.balanceCoins).toBe(7);
    expect(prisma.amenWallet.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { balanceCoins: { decrement: 3 } } }),
    );
    expect(res.transaction.kind).toBe(AmenTxnKind.amen);
    expect(res.transaction.coins).toBe(-3);
  });

  it('spendAmen refuse si solde insuffisant (INSUFFICIENT_BALANCE)', async () => {
    await expect(service.spendAmen('u1', 999)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.spendAmen('u1', 999)).rejects.toMatchObject({
      response: { code: 'INSUFFICIENT_BALANCE' },
    });
  });

  it('spendAmen refuse un montant non positif', async () => {
    await expect(service.spendAmen('u1', 0)).rejects.toMatchObject({
      response: { code: 'VALIDATION_ERROR' },
    });
  });

  it('completeTopup crédite le solde et sort du pending', async () => {
    prisma.amenTransaction.findUnique.mockResolvedValue({
      id: 't9',
      walletId: 'w1',
      coins: 50,
      status: AmenTxnStatus.pending,
    });
    await service.completeTopup('t9');
    expect(prisma.amenWallet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { balanceCoins: { increment: 50 }, pendingTopupCoins: { decrement: 50 } },
      }),
    );
  });

  it('completeTopup est idempotent si déjà completed', async () => {
    prisma.amenTransaction.findUnique.mockResolvedValue({
      id: 't9',
      status: AmenTxnStatus.completed,
    });
    await service.completeTopup('t9');
    expect(prisma.amenWallet.update).not.toHaveBeenCalled();
  });
});
