import { Module } from '@nestjs/common';
import { DevotionalsService } from './devotionals.service';
import { DevotionalsController } from './devotionals.controller';
import { GivingModule } from '../giving/giving.module';

@Module({
  imports: [GivingModule],
  providers: [DevotionalsService],
  controllers: [DevotionalsController],
})
export class DevotionalsModule {}
