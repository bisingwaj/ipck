import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { createHmac } from 'crypto';
import { AppModule } from '../src/app.module';
import { SMS_PROVIDER } from '../src/auth/sms/sms.provider';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

class CapturingSms {
  last: { phone: string; code: string } | null = null;
  async sendOtp(phone: string, code: string) {
    this.last = { phone, code };
  }
}

describe('Giving (e2e)', () => {
  let app: INestApplication;
  const sms = new CapturingSms();
  const phone = '+243999000002';
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SMS_PROVIDER)
      .useValue(sms)
      .compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    await request(app.getHttpServer()).post('/api/v1/auth/otp/request').send({ phone });
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code: sms.last!.code });
    token = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('liste les fonds (auth requise)', async () => {
    await request(app.getHttpServer()).get('/api/v1/giving/funds').expect(401);
    const res = await request(app.getHttpServer())
      .get('/api/v1/giving/funds')
      .set(auth())
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.find((f: any) => f.id === 'general')).toBeDefined();
  });

  it('crée un don réglé immédiatement par le provider mock (received)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/giving/donations')
      .set(auth())
      .send({ amount: 25, fundId: 'general', method: 'mpesa' })
      .expect(201);
    expect(res.body.status).toBe('received');
    expect(res.body.ref).toMatch(/^GFT-/);
  });

  it('rejette un webhook non signé (VALIDATION_ERROR)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/giving/webhooks/mock')
      .send({ ref: 'GFT-000-000', status: 'received' })
      .expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('accepte un webhook signé (signature HMAC valide)', async () => {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET ?? 'dev_webhook_secret_change_me';
    const body = { ref: 'GFT-999-999', status: 'received' };
    const raw = JSON.stringify(body);
    const signature = createHmac('sha256', secret).update(raw).digest('hex');
    // ref inconnu → 404 (mais la signature est acceptée : pas de 400)
    const res = await request(app.getHttpServer())
      .post('/api/v1/giving/webhooks/mock')
      .set('x-signature', signature)
      .set('Content-Type', 'application/json')
      .send(raw);
    expect([200, 404]).toContain(res.status);
    expect(res.body.code).not.toBe('VALIDATION_ERROR');
  });

  it('expose le wallet du membre', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/giving/wallet')
      .set(auth())
      .expect(200);
    expect(res.body).toHaveProperty('balanceCoins');
    expect(res.body).toHaveProperty('recent');
  });
});
