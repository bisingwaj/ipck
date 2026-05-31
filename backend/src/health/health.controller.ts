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

  /** Borne une promesse dans le temps : /health doit TOUJOURS répondre vite (healthcheck). */
  private withTimeout(p: Promise<boolean>, ms = 2000): Promise<boolean> {
    return Promise.race([
      p,
      new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
    ]);
  }

  @Get()
  @ApiOkResponse({ description: 'Service et dépendances opérationnels' })
  @ApiServiceUnavailableResponse({ description: 'Une dépendance est indisponible' })
  async check() {
    const [db, redis] = await Promise.allSettled([
      this.withTimeout(this.prisma.ping()),
      this.withTimeout(this.redis.ping()),
    ]);

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
