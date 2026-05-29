import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnv, Env } from './env.validation';

/**
 * Config typée globale. `ConfigService<Env, true>` donne l'autocomplétion
 * et l'inférence de type sur `config.get('JWT_ACCESS_SECRET')`.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      envFilePath: ['.env'],
    }),
  ],
  exports: [ConfigModule],
})
export class TypedConfigModule {}

export type AppConfigService = ConfigService<Env, true>;
