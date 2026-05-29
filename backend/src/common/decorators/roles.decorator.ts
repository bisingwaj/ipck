import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restreint une route aux rôles donnés (RBAC). Ex. @Roles('pastor', 'admin'). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
