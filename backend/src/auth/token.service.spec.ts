import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TokenService', () => {
  let service: TokenService;
  let prisma: any;
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };

  beforeEach(async () => {
    let counter = 0;
    jwt = {
      signAsync: jest.fn().mockImplementation(() => Promise.resolve(`token_${counter++}`)),
      verifyAsync: jest.fn(),
    };
    prisma = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'rt1' }),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: { findUnique: jest.fn() },
    };
    const config = {
      get: (key: string) =>
        ({
          JWT_ACCESS_SECRET: 'a',
          JWT_ACCESS_TTL: 900,
          JWT_REFRESH_SECRET: 'r',
          JWT_REFRESH_TTL: 2592000,
        })[key],
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(TokenService);
  });

  it('issue émet une paire et persiste le hash du refresh', async () => {
    const pair = await service.issue('u1', Role.member);
    expect(pair.accessToken).toBeDefined();
    expect(pair.refreshToken).toBeDefined();
    expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
  });

  it('rotate révoque l’ancien token et en émet un nouveau', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'u1', jti: 'j1' });
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 100000),
    });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: Role.member });

    const pair = await service.rotate('old_refresh');
    expect(prisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rt1' },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
    expect(pair.refreshToken).toBeDefined();
  });

  it('rotate rejette un refresh révoqué', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'u1', jti: 'j1' });
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt1',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 100000),
    });
    await expect(service.rotate('revoked')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotate rejette un JWT invalide', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('bad'));
    await expect(service.rotate('garbage')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
