import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  onModuleInit(): void {
    // Connexion NON bloquante : ne fige pas le démarrage si la DB tarde
    // (Prisma se connecte de toute façon à la première requête).
    this.$connect()
      .then(() => this.logger.log('Connecté à PostgreSQL'))
      .catch((e) => this.logger.error(`Connexion PostgreSQL différée: ${(e as Error).message}`));
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Ping DB pour le health check. */
  async ping(): Promise<boolean> {
    await this.$queryRaw`SELECT 1`;
    return true;
  }
}
