import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SMS_PROVIDER } from '../src/auth/sms/sms.provider';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

/** Capture le dernier OTP émis pour le lire dans les tests. */
class CapturingSms {
  last: { phone: string; code: string } | null = null;
  async sendOtp(phone: string, code: string) {
    this.last = { phone, code };
  }
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const sms = new CapturingSms();
  const phone = '+243999000001';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SMS_PROVIDER)
      .useValue(sms)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let accessToken: string;
  let refreshToken: string;

  it('refuse un téléphone invalide (VALIDATION_ERROR)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ phone: '12345' })
      .expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('émet un OTP', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/otp/request').send({ phone }).expect(200);
    expect(sms.last?.phone).toBe(phone);
    expect(sms.last?.code).toMatch(/^\d{6}$/);
  });

  it('rejette un mauvais code (INVALID_OTP)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code: '000000' })
      .expect(400);
    expect(res.body.code).toBe('INVALID_OTP');
  });

  it('vérifie le bon OTP et émet les tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code: sms.last!.code })
      .expect(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.phone).toBe(phone);
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('GET /auth/me sans token → 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('GET /auth/me avec token → utilisateur courant', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.phone).toBe(phone);
  });

  it('rafraîchit les tokens (rotation)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    expect(res.body.accessToken).toBeDefined();
    // L'ancien refresh est désormais révoqué
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);
    refreshToken = res.body.refreshToken;
  });

  it('logout révoque le refresh token', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(204);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });
});
