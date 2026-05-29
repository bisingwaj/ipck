import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { Env } from '../../config/env.validation';

export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export interface InitiatePaymentInput {
  ref: string;
  amount: number;
  method: string;
  phone?: string;
}

export interface InitiatePaymentResult {
  providerRef: string;
  /** En mode mock : statut résolu immédiatement. En réel : 'pending' (webhook). */
  status: 'pending' | 'received' | 'failed';
}

export interface WebhookEvent {
  ref: string;
  status: 'received' | 'failed';
  providerRef?: string;
}

/** Interface abstraite d'un agrégateur de paiement (FlexPay/MaxiCash/Stripe). */
export interface PaymentProvider {
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  /** Vérifie la signature d'un webhook ; lève si invalide. */
  verifySignature(rawBody: string, signature: string | undefined): void;
  /** Mappe le payload du webhook vers un événement normalisé. */
  parseWebhook(payload: Record<string, unknown>): WebhookEvent;
}

/**
 * Implémentation de simulation (dev/test) : initie un paiement résolu
 * immédiatement « received », et signe/vérifie via HMAC-SHA256.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger('MockPayment');

  constructor(private readonly config: ConfigService<Env, true>) {}

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    this.logger.log(`Paiement simulé ${input.ref} (${input.amount} via ${input.method})`);
    return { providerRef: `mock_${input.ref}`, status: 'received' };
  }

  sign(rawBody: string): string {
    const secret = this.config.get('PAYMENT_WEBHOOK_SECRET', { infer: true });
    return createHmac('sha256', secret).update(rawBody).digest('hex');
  }

  verifySignature(rawBody: string, signature: string | undefined): void {
    if (!signature) {
      throw new Error('Signature de webhook manquante');
    }
    const expected = this.sign(rawBody);
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error('Signature de webhook invalide');
    }
  }

  parseWebhook(payload: Record<string, unknown>): WebhookEvent {
    return {
      ref: String(payload.ref),
      status: payload.status === 'failed' ? 'failed' : 'received',
      providerRef: payload.providerRef ? String(payload.providerRef) : undefined,
    };
  }
}
