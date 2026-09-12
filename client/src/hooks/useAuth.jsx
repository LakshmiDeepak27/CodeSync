import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.js';
import { disconnectSocket } from '../socket/socket.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
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
    setUser(res.user);
    return res;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      disconnectSocket();
      setUser(null);
    }
  };

  const updateProfile = async (data) => {
    const res = await authService.updateProfile(data);
    setUser(res.user);
    return res.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, refreshUser: fetchUser, setUser }}>
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
