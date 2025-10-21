'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/lib/types';
import apiClient from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = apiClient.getToken();
    if (token) {
      // Set a temporary user object to indicate authentication
      // In a real app, you'd validate the token with the server
      setUser({ 
        id: 'temp', 
        email: 'user@example.com', 
        name: 'User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const logout = async () => {
    await apiClient.logout();
    setUser(null);
  };

  const isAuthenticated = !!user && !!apiClient.getToken();
  
  console.log('Auth Debug:', { 
    user: !!user, 
    token: !!apiClient.getToken(), 
    isAuthenticated,
    isLoading 
  });

  const value = {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
