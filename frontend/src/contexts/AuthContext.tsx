import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiClient } from '../lib/api';

export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  manualRefresh: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for stored tokens
        const storedAccessToken = localStorage.getItem('access_token');
        const storedRefreshToken = localStorage.getItem('refresh_token');

        if (storedAccessToken && storedRefreshToken) {
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);

          // Try to get user profile first
          try {
            const userProfile = await apiClient.getProfile();
            setUser(userProfile);
            console.log('User authenticated successfully');
          } catch (error) {
            console.log('Profile fetch failed, attempting token refresh...');
            // If getting profile fails, try to refresh token
            try {
              await refreshAccessToken();
              // Try to get profile again after refresh
              const userProfile = await apiClient.getProfile();
              setUser(userProfile);
              console.log('User authenticated after token refresh');
            } catch (refreshError) {
              console.error('Token refresh failed during initialization:', refreshError);
              // Only clear tokens if refresh actually failed (not network issues)
              if (refreshError instanceof Error &&
                (refreshError.message.includes('expired') ||
                  refreshError.message.includes('invalid'))) {
                clearAuthData();
              }
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Set up automatic token refresh with retry logic
  useEffect(() => {
    if (!accessToken || !refreshToken) return;

    let refreshAttempts = 0;
    const maxRetries = 3;
    const retryDelay = 5000; // 5 seconds

    const attemptRefresh = async () => {
      try {
        await refreshAccessToken();
        refreshAttempts = 0; // Reset on success
      } catch (error) {
        console.error(`Auto token refresh failed (attempt ${refreshAttempts + 1}):`, error);
        refreshAttempts++;

        if (refreshAttempts < maxRetries) {
          // Retry after delay
          setTimeout(attemptRefresh, retryDelay);
        } else {
          // Only logout after all retries failed
          console.error('All refresh attempts failed, logging out');
          await logout();
        }
      }
    };

    const refreshInterval = setInterval(attemptRefresh, 14 * 60 * 1000); // Refresh every 14 minutes

    return () => clearInterval(refreshInterval);
  }, [accessToken, refreshToken]);

  const clearAuthData = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const storeAuthData = (authResponse: AuthResponse) => {
    setUser(authResponse.user);
    setAccessToken(authResponse.access_token);
    setRefreshToken(authResponse.refresh_token);
    localStorage.setItem('access_token', authResponse.access_token);
    localStorage.setItem('refresh_token', authResponse.refresh_token);
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.login(email, password);
      storeAuthData(response);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string, referralCode?: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.register(email, username, password, referralCode);
      storeAuthData(response);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (refreshToken) {
        await apiClient.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.refreshToken(refreshToken);
      setAccessToken(response.access_token);
      localStorage.setItem('access_token', response.access_token);
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Token refresh error:', error);

      // Check if it's a network error vs auth error
      if (error instanceof Error) {
        if (error.message.includes('Network Error') || error.message.includes('timeout')) {
          throw new Error('Network error during token refresh');
        }
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error('Refresh token expired or invalid');
        }
      }

      throw error;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const manualRefresh = async () => {
    try {
      await refreshAccessToken();
      return true;
    } catch (error) {
      console.error('Manual refresh failed:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    login,
    register,
    logout,
    refreshAccessToken,
    updateUser,
    manualRefresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
