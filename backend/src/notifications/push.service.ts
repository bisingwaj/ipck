import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env.validation';

export interface PushMessage {
  to: string[];
  title: string;
  body: string;
}

/**
 * Service d'envoi de push via l'API Expo. En l'absence de token Expo
 * (dev/test), il log seulement. L'intégration réelle Expo est branchée
 * via EXPO_ACCESS_TOKEN (Phase 8).
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger('Push');

  constructor(private readonly config: ConfigService<Env, true>) {}

  async send(message: PushMessage): Promise<{ sent: number }> {
    const token = this.config.get('EXPO_ACCESS_TOKEN', { infer: true });
    if (!token || message.to.length === 0) {
      this.logger.log(`Push (simulé) "${message.title}" → ${message.to.length} destinataires`);
      return { sent: message.to.length };
    }

    const chunks = this.chunk(message.to, 100);
    let sent = 0;
    for (const chunk of chunks) {
      const payload = chunk.map((to) => ({ to, title: message.title, body: message.body }));
      try {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        sent += chunk.length;
      } catch (e) {
        this.logger.error(`Échec envoi push: ${(e as Error).message}`);
      }
    }
    return { sent };
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }
}
