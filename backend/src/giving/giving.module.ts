import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env.validation';
import { GivingService } from './giving.service';
import { WalletService } from './wallet.service';
import { GivingController } from './giving.controller';
import { PAYMENT_PROVIDER, MockPaymentProvider } from './payment/payment.provider';

@Module({
  controllers: [GivingController],
  providers: [
    GivingService,
    WalletService,
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        // PAYMENT_PROVIDER=mock en dev/test ; brancher FlexPay/Stripe en Phase 8.
        return new MockPaymentProvider(config);
      },
    },
  ],
  exports: [WalletService],
})
export class GivingModule {}
