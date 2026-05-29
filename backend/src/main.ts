import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { Env } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
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

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  logger.log(`IPCK backend démarré sur http://localhost:${port} (docs: /docs)`);
}

void bootstrap();
