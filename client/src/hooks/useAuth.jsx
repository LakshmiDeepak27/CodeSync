import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.js';
import { disconnectSocket } from '../socket/socket.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      // Check if redirected with ?token= (e.g. from Google OAuth callback)
      if (typeof window !== 'undefined' && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
          try {
            localStorage.setItem('codesync_token', urlToken);
          } catch {}
          // Clean the token from the URL without triggering a reload
          urlParams.delete('token');
          const cleanSearch = urlParams.toString();
          const cleanUrl = `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}`;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }

      const currentUser = await authService.getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res.token) {
      try {
        localStorage.setItem('codesync_token', res.token);
      } catch {}
    }
    setUser(res.user);
    return res;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    if (res.token) {
      try {
        localStorage.setItem('codesync_token', res.token);
      } catch {}
      setUser(res.user);
    }
    return res;
  };

  const verifyEmail = async (email, code) => {
    const res = await authService.verifyEmail(email, code);
    if (res.token) {
      try {
        localStorage.setItem('codesync_token', res.token);
      } catch {}
    }
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const resendVerification = async (email) => {
    return authService.resendVerification(email);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      try {
        localStorage.removeItem('codesync_token');
      } catch {}
      disconnectSocket();
      setUser(null);
    }
  };

  const updateProfile = async (data) => {
    const res = await authService.updateProfile(data);
    if (res.token) {
      try {
        localStorage.setItem('codesync_token', res.token);
      } catch {}
    }
    setUser(res.user);
    return res.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyEmail,
        resendVerification,
        logout,
        updateProfile,
        refreshUser: fetchUser,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
