import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { Env } from '../config/env.validation';
import { AccessTokenPayload } from '../common/guards/jwt-auth.guard';

// Origines autorisées pour le handshake WebSocket : même politique que le CORS
// HTTP (main.ts). '*' → toutes en dev ; sinon liste blanche depuis CORS_ORIGINS.
const wsOrigins: boolean | string[] =
  process.env.CORS_ORIGINS === '*'
    ? true
    : (process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? true);

/**
 * Gateway temps réel (namespace /live) : diffuse les « amens » en direct,
 * les messages de chat et les mises à jour d'audience.
 *
 * Sécurité : chaque connexion est authentifiée par le JWT d'accès (handshake).
 * Une connexion sans token valide est rejetée — le namespace n'est pas ouvert
 * anonymement.
 */
@WebSocketGateway({ namespace: 'live', cors: { origin: wsOrigins } })
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('LiveGateway');

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @WebSocketServer()
  server!: Server;

  async handleConnection(client: Socket): Promise<void> {
    const token = this.extractToken(client);
    if (!token) {
      this.logger.warn(`WS refusé (token manquant) : ${client.id}`);
      client.disconnect(true);
      return;
    }
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      });
      client.data.user = { id: payload.sub, role: payload.role };
      this.logger.debug(`WS connecté : ${client.id} (user ${payload.sub})`);
    } catch {
      this.logger.warn(`WS refusé (token invalide) : ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`WS déconnecté : ${client.id}`);
  }

  /** Récupère le JWT d'accès depuis handshake.auth.token, query.token ou Authorization. */
  private extractToken(client: Socket): string | undefined {
    const fromAuth = (client.handshake.auth as { token?: string } | undefined)?.token;
    if (fromAuth) return fromAuth;
    const q = client.handshake.query?.token;
    if (typeof q === 'string' && q) return q;
    const header = client.handshake.headers?.authorization;
    if (header) {
      const [type, value] = header.split(' ');
      if (type === 'Bearer' && value) return value;
    }
    return undefined;
  }

  broadcastAmen(payload: { who: string; coins: number; sessionId?: string }): void {
    this.server?.emit('amen:new', payload);
  }

  broadcastViewers(sessionId: string, viewers: number): void {
    this.server?.emit('viewers:update', { sessionId, viewers });
  }

  broadcastChatMessage(groupId: string, message: unknown): void {
    this.server?.to(`group:${groupId}`).emit('chat:message', message);
  }
}
