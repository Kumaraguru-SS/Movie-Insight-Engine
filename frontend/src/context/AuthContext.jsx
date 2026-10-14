import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('mie_token');
      if (token) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
        } catch (err) {
          console.warn('Session expired or invalid, logging out.');
          localStorage.removeItem('mie_token');
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (username, password) => {
    const res = await authApi.login({ username, password });
    if (!res || !res.access_token) {
      throw new Error(res?.detail || 'Authentication failed: backend returned no access token.');
    }
    localStorage.setItem('mie_token', res.access_token);
    setUser(res.user);
    return res.user;
  };

  const register = async (username, email, password) => {
    const res = await authApi.register({ username, email, password });
    if (!res || !res.access_token) {
      throw new Error(res?.detail || 'Registration failed: backend returned no access token.');
    }
    localStorage.setItem('mie_token', res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('mie_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
