import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, ACCESS_KEY, REFRESH_KEY, setTokens, clearTokens } from '../api/client';

interface StaffUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface AuthState {
  user: StaffUser | null;
  isStaff: boolean;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    if (localStorage.getItem(ACCESS_KEY)) {
      // L'interceptor de client.ts rafraîchit automatiquement en cas de 401 ;
      // on ne purge que si le refresh a lui aussi échoué (token déjà effacé).
      api
        .get('/auth/me')
        .then((r) => setUser(r.data))
        .catch(() => {
          if (!localStorage.getItem(ACCESS_KEY)) setUser(null);
        });
    }
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

  return (
    <AuthContext.Provider value={{ user, isStaff, requestOtp, verifyOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
