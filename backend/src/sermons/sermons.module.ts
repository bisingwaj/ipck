import { Module } from '@nestjs/common';
import { GivingModule } from '../giving/giving.module';
import { SermonsService } from './sermons.service';
import { LiveService } from './live.service';
import { LiveGateway } from './live.gateway';
import { SermonsController, LiveController } from './sermons.controller';

@Module({
  imports: [GivingModule],
  controllers: [SermonsController, LiveController],
  providers: [SermonsService, LiveService, LiveGateway],
  exports: [LiveGateway],
})
export class SermonsModule {}
