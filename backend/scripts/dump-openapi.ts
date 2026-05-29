/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';

/**
 * Génère la spec OpenAPI complète à partir des décorateurs Nest et l'écrit
 * dans docs/openapi.generated.json. Source de vérité runtime = /docs.
 */
async function dump() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  const config = new DocumentBuilder()
    .setTitle('IPCK API')
    .setDescription('API de la plateforme IPCK (mobile + dashboard)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  const out = join(__dirname, '..', '..', 'docs', 'openapi.generated.json');
  writeFileSync(out, JSON.stringify(doc, null, 2));
  console.log(`OpenAPI écrit dans ${out} (${Object.keys(doc.paths).length} chemins)`);
  await app.close();
}

dump().catch((e) => {
  console.error(e);
  process.exit(1);
});
