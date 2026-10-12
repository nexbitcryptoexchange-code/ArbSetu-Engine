import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {api, getToken, setToken} from '@/lib/api';
import type {User} from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUserState(null);
      return;
    }
    try {
      const {user} = await api.me();
      setUserState(user);
    } catch {
      setToken(null);
      setUserState(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const payload = await api.login(email, password);
    setToken(payload.token);
    setUserState(payload.user);
    return payload.user;
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const payload = await api.signup(name, email, password);
    setToken(payload.token);
    setUserState(payload.user);
    return payload.user;
  }, []);

  const resetPassword = useCallback(async (email: string, newPassword: string) => {
    await api.resetPassword(email, newPassword);
  }, []);

  const logout = useCallback(() => {
    api.logout().catch(() => undefined);
    setToken(null);
    setUserState(null);
  }, []);

  const value = useMemo(
    () => ({user, loading, login, signup, resetPassword, logout, refresh, setUser: setUserState}),
    [user, loading, login, signup, resetPassword, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
