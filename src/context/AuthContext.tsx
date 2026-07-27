import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import api from '../api/client';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
  roles?: string[];
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  requiresPasswordChange: boolean;
  login: (username: string, password: string) => Promise<{ requiresPasswordChange: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem('umis_user') || 'null'); } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('umis_token'));
  const [requiresPasswordChange, setRequiresPasswordChange] = useState<boolean>(false);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post('/auth/login', { username, password });
    const { token: newToken, profile, role, requiresPasswordChange: pwChange } = data;

    const userData: AuthUser = {
      id: profile?.id || '',
      email: '',
      username: username,
      role,
      roles: data.roles || (role ? [role] : []),
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
    };

    localStorage.setItem('umis_token', newToken);
    localStorage.setItem('umis_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setRequiresPasswordChange(!!pwChange);

    return { requiresPasswordChange: !!pwChange };
  }, []);

  // Refresh current user info from /auth/me
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      const { user: u, profile } = data;
      const updated: AuthUser = {
        id: u.id,
        email: u.email,
        username: u.username,
        role: u.role,
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
      };
      localStorage.setItem('umis_user', JSON.stringify(updated));
      setUser(updated);
    } catch {
      // Ignore refresh errors — the token interceptor handles 401s
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('umis_token');
    localStorage.removeItem('umis_user');
    setToken(null);
    setUser(null);
    setRequiresPasswordChange(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      requiresPasswordChange,
      login,
      logout,
      refreshUser,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
