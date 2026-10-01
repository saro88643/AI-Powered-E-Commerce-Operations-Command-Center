import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

export type UserRole =
  | 'Admin'
  | 'Operations Manager'
  | 'Warehouse Manager'
  | 'Support Agent'
  | 'Analyst'
  | 'Viewer';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('shopsphere_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('shopsphere_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          setToken(savedToken);
        } catch (e) {
          localStorage.removeItem('shopsphere_token');
          setToken(null);
          setUser(null);
        }
      } else {
        setToken(null);
        setUser(null);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string = 'password123') => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('shopsphere_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const switchRole = async (role: UserRole) => {
    try {
      const res = await api.post('/auth/switch-role', { role });
      localStorage.setItem('shopsphere_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('shopsphere_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        switchRole,
        logout,
        isLoading
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
