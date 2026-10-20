import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';
import { clearApiCache } from './hooks';
import type { User } from './types';

export interface RegisterInput {
  fullName: string;
  email: string;
  idNumber: string;
  phone: string;
  password: string;
}

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // The session is an httpOnly cookie the browser cannot read, so ask the API who is signed in
  useEffect(() => {
    api<User>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value: AuthValue = {
    user,
    loading,
    login: async (identifier, password) => {
      const signedIn = await api<User>('/auth/login', { method: 'POST', json: { identifier, password } });
      clearApiCache();
      setUser(signedIn);
    },
    register: async (input) => {
      const signedIn = await api<User>('/auth/register', { method: 'POST', json: input });
      clearApiCache();
      setUser(signedIn);
    },
    logout: async () => {
      await api('/auth/logout', { method: 'POST' });
      clearApiCache();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
