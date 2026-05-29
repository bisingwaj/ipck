import { Injectable, NotFoundException } from '@nestjs/common';
import { LiveSession } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../giving/wallet.service';
import { LiveGateway } from './live.gateway';
import { SendAmenDto, UpdateLiveDto } from './dto/sermons.dto';

export interface LiveAmen {
  who: string;
  coins: number;
  at: string;
}

@Injectable()
export class LiveService {
  /** Flux éphémère des derniers « amens » (en mémoire, plafonné). */
  private recentAmens: LiveAmen[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly gateway: LiveGateway,
  ) {}

  /** Session live courante (ou la plus récente). */
  async current(): Promise<LiveSession | null> {
    const live = await this.prisma.liveSession.findFirst({
      where: { state: 'live' },
      orderBy: { updatedAt: 'desc' },
    });
    return live ?? this.prisma.liveSession.findFirst({ orderBy: { updatedAt: 'desc' } });
  }

  async getSession(id: string): Promise<LiveSession> {
    const session = await this.prisma.liveSession.findUnique({ where: { id } });
    if (!session)
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Session introuvable' });
    return session;
  }

  /** Envoie un « amen » : débite le wallet, enregistre, diffuse en direct. */
  async sendAmen(userId: string, sessionId: string, dto: SendAmenDto) {
    const session = await this.getSession(sessionId);
    const result = await this.wallet.spendAmen(userId, dto.coins, {
      fundId: dto.fundId,
      service: session.title,
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const who = user.firstName
      ? `${user.firstName} ${(user.lastName ?? '').charAt(0)}.`.trim()
      : 'Member';
    const amen: LiveAmen = { who, coins: dto.coins, at: new Date().toISOString() };
    this.recentAmens.unshift(amen);
    this.recentAmens = this.recentAmens.slice(0, 30);
    this.gateway.broadcastAmen({ ...amen, sessionId });

    return { balanceCoins: result.balanceCoins, transaction: result.transaction };
  }

  getRecentAmens(): LiveAmen[] {
    return this.recentAmens;
  }

  /** Contrôle régie (pastor+). */
  async patch(id: string, dto: UpdateLiveDto): Promise<LiveSession> {
    await this.getSession(id);
    const session = await this.prisma.liveSession.update({
      where: { id },
      data: {
        state: dto.state,
        sceneActive: dto.sceneActive,
        viewersLive: dto.viewersLive,
        startedAt: dto.state === 'live' ? new Date() : undefined,
      },
    });
    if (dto.viewersLive !== undefined) {
      this.gateway.broadcastViewers(id, dto.viewersLive);
    }
    return session;
  }
}
