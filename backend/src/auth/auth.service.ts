import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import { TokenService, TokenPair } from './token.service';

export interface AuthResult extends TokenPair {
  user: User;
  isNewUser: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
  ) {}

  async requestOtp(phone: string): Promise<{ expiresIn: number }> {
    return this.otp.requestOtp(phone);
  }

  /** Vérifie l'OTP, crée l'utilisateur si nouveau, émet les tokens. */
  async verifyOtp(phone: string, code: string): Promise<AuthResult> {
    await this.otp.verifyOtp(phone, code);

    const existing = await this.prisma.user.findUnique({ where: { phone } });
    const isNewUser = !existing;

    const user =
      existing ??
      (await this.prisma.user.create({
        data: {
          phone,
          wallet: { create: {} },
        },
      }));

    const pair = await this.tokens.issue(user.id, user.role);
    return { ...pair, user, isNewUser };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    return this.tokens.rotate(refreshToken);
  }

  async logout(refreshToken: string): Promise<void> {
    return this.tokens.revoke(refreshToken);
  }

  async me(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
