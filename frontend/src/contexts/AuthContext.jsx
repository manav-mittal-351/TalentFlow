// ─── contexts/AuthContext.jsx ────────────────────────────────────────────────
// Global Session and Authentication Context. Enforces token verification,
// user role stores, and handles token cache updates.

import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('tf_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      const response = await api.get('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.error('Failed to restore session:', error);
      localStorage.removeItem('tf_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Restore session upon mounting
  useEffect(() => {
    fetchProfile();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('tf_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('tf_token');
    setUser(null);
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUserProfile,
        refetchProfile: fetchProfile,
      }}
    >
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
