import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import { Env } from '../config/env.validation';
import { RedisService } from '../redis/redis.service';
import { SMS_PROVIDER, SmsProvider } from './sms/sms.provider';

const REQUEST_WINDOW = 60; // s — fenêtre anti-spam d'envoi
const MAX_REQUESTS_PER_WINDOW = 3;
const MAX_VERIFY_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService<Env, true>,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
  ) {
    const master = this.config.get('DEV_MASTER_OTP', { infer: true });
    if (master && this.config.get('NODE_ENV', { infer: true }) !== 'production') {
      this.logger.warn(
        `⚠️ OTP maître ACTIF (DEV_MASTER_OTP="${master}") — login/inscription possibles avec ce code. À retirer avant la production.`,
      );
    }
  }

  private codeKey(phone: string): string {
    return `otp:code:${phone}`;
  }
  private attemptsKey(phone: string): string {
    return `otp:attempts:${phone}`;
  }
  private rateKey(phone: string): string {
    return `otp:rate:${phone}`;
  }

  /** Génère et envoie un OTP, avec rate-limit par numéro. Retourne le TTL. */
  async requestOtp(phone: string): Promise<{ expiresIn: number }> {
    const count = await this.redis.incr(this.rateKey(phone));
    if (count === 1) {
      await this.redis.expire(this.rateKey(phone), REQUEST_WINDOW);
    }
    if (count > MAX_REQUESTS_PER_WINDOW) {
      throw new HttpException(
        { code: 'RATE_LIMITED', message: "Trop de demandes d'OTP, réessayez dans une minute" },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const length = this.config.get('OTP_LENGTH', { infer: true });
    const ttl = this.config.get('OTP_TTL', { infer: true });
    const code = this.generateCode(length);

    await this.redis.set(this.codeKey(phone), code, ttl);
    await this.redis.del(this.attemptsKey(phone));
    await this.sms.sendOtp(phone, code);

    return { expiresIn: ttl };
  }

  /** Vérifie l'OTP. Détruit le code en cas de succès. Limite les tentatives. */
  async verifyOtp(phone: string, code: string): Promise<void> {
    // OTP « passe-partout » (tests) : accepté tel quel, sans Redis, pour login + inscription.
    // Désactivé si DEV_MASTER_OTP est vide, et toujours ignoré en production.
    const master = this.config.get('DEV_MASTER_OTP', { infer: true });
    if (master && code === master && this.config.get('NODE_ENV', { infer: true }) !== 'production') {
      this.logger.warn(`OTP maître utilisé pour ${phone} (DEV_MASTER_OTP)`);
      return;
    }

    const stored = await this.redis.get(this.codeKey(phone));
    if (!stored) {
      throw new BadRequestException({ code: 'OTP_EXPIRED', message: 'Code expiré ou inexistant' });
    }

    const attempts = await this.redis.incr(this.attemptsKey(phone));
    const ttl = this.config.get('OTP_TTL', { infer: true });
    if (attempts === 1) await this.redis.expire(this.attemptsKey(phone), ttl);
    if (attempts > MAX_VERIFY_ATTEMPTS) {
      await this.redis.del(this.codeKey(phone));
      throw new HttpException(
        { code: 'RATE_LIMITED', message: 'Trop de tentatives, demandez un nouveau code' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (stored !== code) {
      throw new BadRequestException({ code: 'INVALID_OTP', message: 'Code incorrect' });
    }

    await this.redis.del(this.codeKey(phone));
    await this.redis.del(this.attemptsKey(phone));
  }

  private generateCode(length: number): string {
    const max = 10 ** length;
    return randomInt(0, max).toString().padStart(length, '0');
  }
}
