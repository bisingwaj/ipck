import { User } from '@prisma/client';

export interface PublicUser {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: string;
  interests: string[];
  streakCount: number;
  createdAt: Date;
}

/** Forme publique d'un User exposée par l'API. */
export function presentUser(user: User): PublicUser {
  return {
    id: user.id,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    interests: user.interests,
    streakCount: user.streakCount,
    createdAt: user.createdAt,
  };
}
