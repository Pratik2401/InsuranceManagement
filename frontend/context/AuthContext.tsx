'use client';

import React, {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react';
import api from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'agent';
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate auth state from localStorage on first mount
  useEffect(() => {
    const storedToken = localStorage.getItem('insureflow_token');
    const storedUser = localStorage.getItem('insureflow_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Optionally verify token is still valid against backend
        api.get('/auth/me').catch(() => {
          // Token invalid — clear everything
          localStorage.removeItem('insureflow_token');
          localStorage.removeItem('insureflow_user');
          setToken(null);
          setUser(null);
        });
      } catch {
        localStorage.removeItem('insureflow_token');
        localStorage.removeItem('insureflow_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('insureflow_token', newToken);
    localStorage.setItem('insureflow_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('insureflow_token');
    localStorage.removeItem('insureflow_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}
