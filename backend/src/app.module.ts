import { Module } from '@nestjs/common';
import { TypedConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [TypedConfigModule, PrismaModule, RedisModule, HealthModule],
})
export class AppModule {}
