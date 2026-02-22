import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { ME_QUERY, REFRESH_TOKEN_MUTATION } from '@shared/api/graphql/auth';
import type { User } from '@entities/user';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(() => !!localStorage.getItem('accessToken'));
  const [isInitialized, setIsInitialized] = useState(false);

  const { data, loading, error, refetch } = useQuery(ME_QUERY, {
    skip: !hasToken,
    fetchPolicy: 'network-only',
  });

  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN_MUTATION);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setHasToken(false);
    setIsInitialized(true);
  }, []);

  const tryRefreshToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      logout();
      return;
    }

    try {
      const { data } = await refreshTokenMutation({
        variables: { refreshToken },
      });

      if (data?.refreshToken) {
        localStorage.setItem('accessToken', data.refreshToken.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken.refreshToken);
        setHasToken(true);
        refetch();
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }, [refreshTokenMutation, refetch, logout]);

  const login = useCallback((accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setHasToken(true);
    refetch();
  }, [refetch]);

  const refreshUser = useCallback(async () => {
    await refetch();
  }, [refetch]);

  useEffect(() => {
    if (data?.me) {
      setUser(data.me);
      setIsInitialized(true);
    } else if (!loading && hasToken) {
      setIsInitialized(true);
    } else if (!hasToken) {
      setIsInitialized(true);
    }
  }, [data, loading, hasToken]);

  useEffect(() => {
    if (error && hasToken) {
      tryRefreshToken();
    }
  }, [error, hasToken, tryRefreshToken]);

  useEffect(() => {
    if (user) {
      import('@shared/api/sse/client').then(({ sseClient }) => {
        sseClient.connect();
      });
    } else {
      import('@shared/api/sse/client').then(({ sseClient }) => {
        sseClient.disconnect();
      });
    }

    return () => {
      import('@shared/api/sse/client').then(({ sseClient }) => {
        sseClient.disconnect();
      });
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: !isInitialized || loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
