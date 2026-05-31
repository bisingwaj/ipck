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
    if (master) {
      this.logger.warn(
        `⚠️ OTP maître ACTIF (DEV_MASTER_OTP="${master}") — login/inscription possibles avec ce code. À RETIRER pour une vraie production (unset DEV_MASTER_OTP).`,
      );
    }
  }

  /**
   * Exécute une opération Redis « best-effort » : si Redis est injoignable
   * (mode dégradé Railway), on n'interrompt JAMAIS le flux d'auth — on log et
   * on retombe sur `fallback`. Le rate-limit/anti-spam devient simplement inactif.
   */
  private async safeRedis<T>(op: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await op();
    } catch (e) {
      this.logger.warn(`Redis indisponible (auth en mode dégradé): ${(e as Error).message}`);
      return fallback;
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
    // Rate-limit best-effort : si Redis tombe, on n'empêche pas l'envoi (count=0).
    const count = await this.safeRedis(() => this.redis.incr(this.rateKey(phone)), 0);
    if (count === 1) {
      await this.safeRedis(() => this.redis.expire(this.rateKey(phone), REQUEST_WINDOW), undefined);
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

    await this.safeRedis(() => this.redis.set(this.codeKey(phone), code, ttl), undefined);
    await this.safeRedis(() => this.redis.del(this.attemptsKey(phone)), undefined);
    await this.sms.sendOtp(phone, code);

    return { expiresIn: ttl };
  }

  /** Vérifie l'OTP. Détruit le code en cas de succès. Limite les tentatives. */
  async verifyOtp(phone: string, code: string): Promise<void> {
    // OTP « passe-partout » (tests/démo) : accepté tel quel, sans Redis, pour login + inscription.
    // Actif dès que DEV_MASTER_OTP est défini (variable contrôlée par l'opérateur).
    // À RETIRER pour une vraie production en supprimant la variable d'env.
    const master = this.config.get('DEV_MASTER_OTP', { infer: true });
    if (master && code === master) {
      this.logger.warn(`OTP maître utilisé pour ${phone} (DEV_MASTER_OTP)`);
      return;
    }

    const stored = await this.safeRedis(() => this.redis.get(this.codeKey(phone)), null);
    if (!stored) {
      throw new BadRequestException({ code: 'OTP_EXPIRED', message: 'Code expiré ou inexistant' });
    }

    const attempts = await this.safeRedis(() => this.redis.incr(this.attemptsKey(phone)), 1);
    const ttl = this.config.get('OTP_TTL', { infer: true });
    if (attempts === 1) await this.safeRedis(() => this.redis.expire(this.attemptsKey(phone), ttl), undefined);
    if (attempts > MAX_VERIFY_ATTEMPTS) {
      await this.safeRedis(() => this.redis.del(this.codeKey(phone)), undefined);
      throw new HttpException(
        { code: 'RATE_LIMITED', message: 'Trop de tentatives, demandez un nouveau code' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (stored !== code) {
      throw new BadRequestException({ code: 'INVALID_OTP', message: 'Code incorrect' });
    }

    await this.safeRedis(() => this.redis.del(this.codeKey(phone)), undefined);
    await this.safeRedis(() => this.redis.del(this.attemptsKey(phone)), undefined);
  }

  private generateCode(length: number): string {
    const max = 10 ** length;
    return randomInt(0, max).toString().padStart(length, '0');
  }
}
