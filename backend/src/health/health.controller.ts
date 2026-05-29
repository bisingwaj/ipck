import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Service et dépendances opérationnels' })
  @ApiServiceUnavailableResponse({ description: 'Une dépendance est indisponible' })
  async check() {
    const [db, redis] = await Promise.allSettled([this.prisma.ping(), this.redis.ping()]);

    const dbUp = db.status === 'fulfilled' && db.value;
    const redisUp = redis.status === 'fulfilled' && redis.value;
    const status = dbUp && redisUp ? 'ok' : 'degraded';

    return {
      status,
      db: dbUp ? 'up' : 'down',
      redis: redisUp ? 'up' : 'down',
      uptime: Math.round(process.uptime()),
    };
  }
}
