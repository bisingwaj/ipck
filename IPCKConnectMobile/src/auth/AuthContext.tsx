import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, setUnauthorizedHandler } from '../api/client';
import { getItem, setItem, deleteItem, KEYS } from '../api/storage';
import { prefetchCoreData } from '../api/hooks';
import { USE_MOCKS } from '../api/config';
import { resetTo } from '../navigation/navigationRef';
import { queryClient } from '../api/queryClient';

export interface AuthUser {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  interests: string[];
  streakCount: number;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  bootstrapped: boolean;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<{ isNewUser: boolean }>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Normalise un numéro saisi (avec espaces) vers E.164 : "+243 81 000" → "+24381000". */
export function toE164(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return (hasPlus ? '+' : '+') + digits;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const loadMe = async (): Promise<boolean> => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      void prefetchCoreData(); // cache chaud → onglets instantanés, pas de flash
      return true;
    } catch {
      // On n'efface PAS l'utilisateur ici : une vraie expiration est gérée par
      // setUnauthorizedHandler (ci-dessous). Une erreur transitoire ne doit pas
      // déconnecter — le client conserve les tokens et la requête pourra réessayer.
      return false;
    }
  };

  useEffect(() => {
    // Session réellement perdue (refresh rejeté par le serveur) → déconnexion + retour à l'auth.
    setUnauthorizedHandler(() => {
      setUser(null);
      queryClient.clear();
      resetTo('Onboarding');
    });
    (async () => {
      if (USE_MOCKS) {
        setBootstrapped(true);
        return;
      }
      // Tant qu'un refresh token est présent, la session est considérée valide :
      // on charge le profil avec quelques essais (tolère un cold start backend).
      // Si la session a vraiment expiré, le client efface les tokens → on s'arrête.
      if (await getItem(KEYS.refresh)) {
        for (let i = 0; i < 3; i++) {
          if (await loadMe()) break;
          if (!(await getItem(KEYS.refresh))) break; // tokens effacés = vraie déconnexion
          await new Promise((r) => setTimeout(r, 800 * (i + 1)));
        }
      }
      setBootstrapped(true);
    })();
  }, []);

  const requestOtp = async (phone: string) => {
    await api.post('/auth/otp/request', { phone: toE164(phone) });
  };

  const verifyOtp = async (phone: string, code: string) => {
    const { data } = await api.post('/auth/otp/verify', { phone: toE164(phone), code });
    await setItem(KEYS.access, data.accessToken);
    await setItem(KEYS.refresh, data.refreshToken);
    setUser(data.user);
    void prefetchCoreData(); // précharge dès la connexion → écrans prêts sans flash
    return { isNewUser: data.isNewUser as boolean };
  };

  const signOut = async () => {
    const refreshToken = await getItem(KEYS.refresh);
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
      // ignore
    }
    await deleteItem(KEYS.access);
    await deleteItem(KEYS.refresh);
    setUser(null);
    queryClient.clear(); // évite que le prochain utilisateur voie les données mises en cache
    resetTo('Onboarding');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        bootstrapped,
        requestOtp,
        verifyOtp,
        signOut,
        refreshMe: async () => {
          await loadMe();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
