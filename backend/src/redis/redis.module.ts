import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Env } from '../config/env.validation';
import { REDIS_CLIENT, RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const logger = new Logger('Redis');
        // lazyConnect + offline queue : la connexion ne bloque JAMAIS le démarrage
        // (important en conteneur/Railway où Redis peut tarder à être joignable).
        const client = new Redis(config.get('REDIS_URL', { infer: true }), {
          maxRetriesPerRequest: 2,
          lazyConnect: true,
          // false : si Redis est injoignable, les commandes échouent VITE au lieu
          // d'attendre indéfiniment → /health ne se bloque jamais.
          enableOfflineQueue: false,
          // family: 0 = dual-stack IPv4/IPv6. Le réseau interne Railway
          // (*.railway.internal) est en IPv6 ; sans ça, ioredis (IPv4) ne connecte pas.
          family: 0,
          retryStrategy: (times) => (times > 10 ? null : Math.min(times * 300, 3000)),
        });
        // Un listener 'error' évite tout crash sur erreur de connexion.
        client.on('error', (e) => logger.warn(`Redis indisponible: ${e.message}`));
        client.connect().catch(() => {}); // tentative non bloquante
        return client;
      },
    },
    RedisService,
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
