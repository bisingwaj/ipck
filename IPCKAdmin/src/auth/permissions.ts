/**
 * Principe 4 : les permissions contrôlent la VISIBILITÉ et l'ACTIVATION côté UI,
 * mais le serveur les revérifie toujours (RBAC NestJS via @Roles). Ce module est
 * le **miroir fidèle** de la hiérarchie de rôles du backend
 * (`backend/src/common/guards/roles.guard.ts`) : member < group_leader < pastor < admin.
 *
 * Règle d'or : ne jamais inventer un droit côté front. Si le serveur garde une
 * route avec `@Roles('admin')`, l'UI doit exiger 'admin' ici — et inversement,
 * l'UI ne débloque jamais une action que le serveur refuserait.
 */
export type Role = 'member' | 'group_leader' | 'pastor' | 'admin';

const RANK: Record<Role, number> = {
  member: 0,
  group_leader: 1,
  pastor: 2,
  admin: 3,
};

/** Vrai si `role` satisfait l'exigence minimale `required` (hiérarchie incluse). */
export function hasRole(role: string | undefined, required: Role): boolean {
  if (!role || !(role in RANK)) return false;
  return RANK[role as Role] >= RANK[required];
}

/**
 * Capacités nommées du dashboard → rôle minimal exigé par le backend.
 * Chaque entrée est l'image d'un garde `@Roles(...)` réel.
 */
export const CAPABILITIES = {
  // Routes gardées @Roles('pastor') (admin hérite).
  'care.manage': 'pastor',
  'appointments.manage': 'pastor',
  'content.manage': 'pastor',
  'devotionals.manage': 'pastor',
  'community.manage': 'pastor',
  'broadcast.send': 'pastor',
  'people.view': 'pastor',
  'giving.view': 'pastor',
  // Route gardée @Roles('admin') : export financier.
  'giving.export': 'admin',
} as const satisfies Record<string, Role>;

export type Capability = keyof typeof CAPABILITIES;

/** Vrai si le rôle courant peut exercer la capacité demandée. */
export function can(role: string | undefined, capability: Capability): boolean {
  return hasRole(role, CAPABILITIES[capability]);
}

/** Libellé du rôle minimal requis, pour expliquer un blocage à l'admin. */
export function requiredRoleLabel(capability: Capability): string {
  const r = CAPABILITIES[capability];
  return r === 'admin' ? 'administrateur' : 'pasteur ou administrateur';
}
