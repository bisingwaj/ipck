import { Module } from '@nestjs/common';
import { PrayersService } from './prayers.service';
import { PrayersController } from './prayers.controller';
import { GivingModule } from '../giving/giving.module';

@Module({
  imports: [GivingModule],
  providers: [PrayersService],
  controllers: [PrayersController],
})
export class PrayersModule {}
