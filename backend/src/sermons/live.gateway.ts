import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * Gateway temps réel (namespace /live) : diffuse les « amens » en direct,
 * les messages de chat et les mises à jour d'audience.
 */
@WebSocketGateway({ namespace: 'live', cors: { origin: true } })
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('LiveGateway');

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket): void {
    this.logger.debug(`WS connecté : ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`WS déconnecté : ${client.id}`);
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
