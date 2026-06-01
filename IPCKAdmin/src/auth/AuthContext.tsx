import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, ACCESS_KEY, REFRESH_KEY, setTokens, clearTokens } from '../api/client';
import { can as canDo, Capability } from './permissions';

interface StaffUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface AuthState {
  user: StaffUser | null;
  /** État de réhydratation de la session au démarrage (principe 2). */
  ready: boolean;
  isStaff: boolean;
  /** Principe 4 : capacité UI = miroir du RBAC serveur. */
  can: (capability: Capability) => boolean;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(ACCESS_KEY)) {
      setReady(true);
      return;
    }
    // L'interceptor de client.ts rafraîchit automatiquement en cas de 401 ;
    // on ne purge que si le refresh a lui aussi échoué (token déjà effacé).
    api
      .get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => {
        if (!localStorage.getItem(ACCESS_KEY)) setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const requestOtp = async (phone: string) => {
    await api.post('/auth/otp/request', { phone });
  };

  const verifyOtp = async (phone: string, code: string) => {
    const { data } = await api.post('/auth/otp/verify', { phone, code });
    if (data.user.role !== 'pastor' && data.user.role !== 'admin') {
      throw new Error('Accès réservé au staff (pasteur/admin).');
    }
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  const signOut = () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    // Révocation best-effort côté backend (ne bloque pas la déconnexion locale).
    if (refreshToken) api.post('/auth/logout', { refreshToken }).catch(() => {});
    clearTokens();
    setUser(null);
  };

  const isStaff = user?.role === 'pastor' || user?.role === 'admin';
  const can = (capability: Capability) => canDo(user?.role, capability);

  return (
    <AuthContext.Provider
      value={{ user, ready, isStaff, can, requestOtp, verifyOtp, signOut }}
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
