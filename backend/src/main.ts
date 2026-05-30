import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { Env } from './config/env.validation';

async function bootstrap() {
  // bufferLogs désactivé : on veut voir les logs de démarrage en temps réel
  // (avec bufferLogs, un blocage pendant l'init masquait tout dans les logs Railway).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  // Sert les vidéos téléchargées (MP4/HLS) en local : GET /media/videos/<fichier>.mp4
  // (range requests gérés par express → seek). Hors préfixe /api/v1.
  app.useStaticAssets(join(process.cwd(), 'media'), { prefix: '/media' });
  // Logs structurés (pino) comme logger d'application
  app.useLogger(app.get(PinoLogger));
  const config = app.get(ConfigService<Env, true>);
  const logger = new Logger('Bootstrap');

  // En-têtes de sécurité (CSP désactivée pour ne pas gêner Swagger /docs)
  app.use(helmet({ contentSecurityPolicy: false }));

  // Préfixe global de version d'API (cf. api-spec.md)
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  // Validation globale des DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS
  const origins = config.get('CORS_ORIGINS', { infer: true });
  app.enableCors({
    origin: origins === '*' ? true : origins.split(',').map((o) => o.trim()),
    credentials: true,
  });

  // OpenAPI / Swagger sur /docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('IPCK API')
    .setDescription('API de la plateforme IPCK (mobile + dashboard)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  app.enableShutdownHooks();

  // Lecture DIRECTE de la variable PORT injectée par Railway (priorité absolue),
  // pour éliminer toute ambiguïté de config. Fallback sur la config validée puis 3000.
  const port = Number(process.env.PORT) || config.get('PORT', { infer: true }) || 3000;
  // 0.0.0.0 requis par Railway/conteneurs (sinon l'app n'est pas joignable → 502).
  await app.listen(port, '0.0.0.0');
  logger.log(`IPCK backend démarré et à l'écoute sur 0.0.0.0:${port} (docs: /docs)`);
}

void bootstrap();
