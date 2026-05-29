import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../decorators/current-user.decorator';

/** Hiérarchie des rôles : un rôle supérieur satisfait toute exigence inférieure. */
const RANK: Record<Role, number> = {
  member: 0,
  group_leader: 1,
  pastor: 2,
  admin: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;
    if (!user) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Accès refusé' });

    const minRequired = Math.min(...required.map((r) => RANK[r]));
    if (RANK[user.role] < minRequired) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Rôle insuffisant' });
    }
    return true;
  }
}
