import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env.validation';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { SMS_PROVIDER, ConsoleSmsProvider } from './sms/sms.provider';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    TokenService,
    {
      provide: SMS_PROVIDER,
      inject: [ConfigService],
      useFactory: (_config: ConfigService<Env, true>) => {
        // SMS_PROVIDER=console en dev/test ; brancher Twilio en Phase 8.
        return new ConsoleSmsProvider();
      },
    },
  ],
  exports: [TokenService],
})
export class AuthModule {}
