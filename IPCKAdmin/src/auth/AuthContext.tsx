import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../api/client';

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
    if (localStorage.getItem('ipck_admin_token')) {
      api
        .get('/auth/me')
        .then((r) => setUser(r.data))
        .catch(() => localStorage.removeItem('ipck_admin_token'));
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
    localStorage.setItem('ipck_admin_token', data.accessToken);
    setUser(data.user);
  };

  const signOut = () => {
    localStorage.removeItem('ipck_admin_token');
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
