import type { AuthSession } from '@/types/AuthSession';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getAuthSession } from '@/lib/AuthApi';


interface AuthContextValue {
  authSession: AuthSession;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshAuthState: () => Promise<void>;
}

const defaultSession: AuthSession = {
  isAuthenticated: false,
  userName: null,
  email: null,
  roles: [],
  supporterId: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authSession, setAuthSession] = useState<AuthSession>(defaultSession);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuthState = useCallback(async () => {
    try {
      const session = await getAuthSession();
      setAuthSession(session);
    } catch {
      setAuthSession(defaultSession);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAuthState();
  }, [refreshAuthState]);

  const value = useMemo(
    () => ({
      authSession,
      isAuthenticated: authSession.isAuthenticated,
      isLoading,
      refreshAuthState,
    }),
    [authSession, isLoading, refreshAuthState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}