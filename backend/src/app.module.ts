import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { Env } from './config/env.validation';
import { TypedConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { ActivityModule } from './activity/activity.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DevotionalsModule } from './devotionals/devotionals.module';
import { GivingModule } from './giving/giving.module';
import { SermonsModule } from './sermons/sermons.module';
import { ContentModule } from './content/content.module';
import { GroupsModule } from './groups/groups.module';
import { PrayersModule } from './prayers/prayers.module';
import { EventsModule } from './events/events.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { ReferenceModule } from './reference/reference.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    TypedConfigModule,
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL', { infer: true }),
          // pino-pretty seulement en terminal local : son worker-thread peut planter
          // dans un conteneur (Railway). Sinon → logs JSON standard (sûrs).
          transport:
            config.get('NODE_ENV', { infer: true }) === 'production' || !process.stdout.isTTY
              ? undefined
              : { target: 'pino-pretty', options: { singleLine: true } },
          redact: ['req.headers.authorization', 'req.headers.cookie'],
          autoLogging: { ignore: (req) => req.url === '/health' },
        },
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    JwtModule.register({ global: true }),
    PrismaModule,
    RedisModule,
    ActivityModule,
    HealthModule,
    AuthModule,
    UsersModule,
    DevotionalsModule,
    GivingModule,
    SermonsModule,
    ContentModule,
    GroupsModule,
    PrayersModule,
    EventsModule,
    AppointmentsModule,
    NotificationsModule,
    AdminModule,
    ReferenceModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
