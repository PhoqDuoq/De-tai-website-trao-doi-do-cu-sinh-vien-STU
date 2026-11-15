import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/api/authApi';
import { studentApi } from '@/api/studentApi';
import { clearAuthData } from '@/api/client';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await authApi.getProfile();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn('Initial session validation failed or refreshed:', err.message);
          // Token rotation interceptor will handle 401 or clearAuthData if invalid
          const currentToken = localStorage.getItem('accessToken');
          if (!currentToken) {
            setUser(null);
            setAccessToken(null);
          }
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      if (res.success && res.data) {
        const { accessToken: newAccess, refreshToken: newRefresh, user: authUser } = res.data;
        localStorage.setItem('accessToken', newAccess);
        localStorage.setItem('refreshToken', newRefresh);
        localStorage.setItem('user', JSON.stringify(authUser));

        setAccessToken(newAccess);
        setUser(authUser);
        return { success: true, user: authUser };
      }
      return { success: false, message: res.message || 'Đăng nhập không thành công' };
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (formData) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(formData);
      if (res.success && res.data) {
        const { accessToken: newAccess, refreshToken: newRefresh, user: authUser } = res.data;
        localStorage.setItem('accessToken', newAccess);
        localStorage.setItem('refreshToken', newRefresh);
        localStorage.setItem('user', JSON.stringify(authUser));

        setAccessToken(newAccess);
        setUser(authUser);
        return { success: true, user: authUser };
      }
      return { success: false, message: res.message || 'Đăng ký không thành công' };
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      clearAuthData();
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authApi.getProfile();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
    return null;
  }, []);

  const verifyStudent = useCallback(
    async (payload) => {
      const res = await studentApi.submitVerification(payload);
      if (res.success) {
        await refreshProfile();
      }
      return res;
    },
    [refreshProfile]
  );

  const value = {
    user,
    accessToken,
    isLoading,
    isAuthenticated: Boolean(accessToken && user),
    login,
    register,
    logout,
    verifyStudent,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
