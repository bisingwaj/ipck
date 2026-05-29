import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { OtpService } from './otp.service';
import { RedisService } from '../redis/redis.service';
import { SMS_PROVIDER, SmsProvider } from './sms/sms.provider';

/** Faux Redis en mémoire pour isoler la logique OTP. */
class FakeRedis {
  store = new Map<string, string>();
  counters = new Map<string, number>();
  async set(k: string, v: string) {
    this.store.set(k, v);
  }
  async get(k: string) {
    return this.store.get(k) ?? null;
  }
  async del(k: string) {
    this.store.delete(k);
    this.counters.delete(k);
  }
  async incr(k: string) {
    const n = (this.counters.get(k) ?? 0) + 1;
    this.counters.set(k, n);
    return n;
  }
  async expire() {}
}

describe('OtpService', () => {
  let service: OtpService;
  let redis: FakeRedis;
  let sms: { sendOtp: jest.Mock };

  beforeEach(async () => {
    redis = new FakeRedis();
    sms = { sendOtp: jest.fn() };
    const config = {
      get: (key: string) => ({ OTP_LENGTH: 6, OTP_TTL: 300 })[key],
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: RedisService, useValue: redis },
        { provide: ConfigService, useValue: config },
        { provide: SMS_PROVIDER, useValue: sms as unknown as SmsProvider },
      ],
    }).compile();
    service = moduleRef.get(OtpService);
  });

  it('génère un OTP à 6 chiffres et l’envoie par SMS', async () => {
    const res = await service.requestOtp('+243810000099');
    expect(res.expiresIn).toBe(300);
    expect(sms.sendOtp).toHaveBeenCalledTimes(1);
    const [, code] = sms.sendOtp.mock.calls[0];
    expect(code).toMatch(/^\d{6}$/);
  });

  it('vérifie le bon code et le détruit ensuite', async () => {
    await service.requestOtp('+243810000099');
    const code = sms.sendOtp.mock.calls[0][1];
    await expect(service.verifyOtp('+243810000099', code)).resolves.toBeUndefined();
    // Réutilisation impossible (code consommé)
    await expect(service.verifyOtp('+243810000099', code)).rejects.toThrow(HttpException);
  });

  it('rejette un mauvais code (INVALID_OTP)', async () => {
    await service.requestOtp('+243810000099');
    await expect(service.verifyOtp('+243810000099', '000000')).rejects.toMatchObject({
      response: { code: 'INVALID_OTP' },
    });
  });

  it('rejette un code expiré/inexistant (OTP_EXPIRED)', async () => {
    await expect(service.verifyOtp('+243810000099', '123456')).rejects.toMatchObject({
      response: { code: 'OTP_EXPIRED' },
    });
  });

  it('rate-limite après 3 demandes dans la fenêtre', async () => {
    await service.requestOtp('+243810000099');
    await service.requestOtp('+243810000099');
    await service.requestOtp('+243810000099');
    await expect(service.requestOtp('+243810000099')).rejects.toMatchObject({
      response: { code: 'RATE_LIMITED' },
    });
  });
});
