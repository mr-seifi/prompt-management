import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import authService from '../services/authService';

interface User {
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, password2: string, email: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userData = await authService.getCurrentUser();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // If there's an error fetching the profile, log the user out
        await authService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      await authService.login(username, password);
      const userData = await authService.getCurrentUser();
      setCurrentUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username: string, password: string, password2: string, email: string, firstName: string, lastName: string) => {
    try {
      await authService.register(username, password, password2, email, firstName, lastName);
      // Auto-login after registration
      await login(username, password);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call the auth service logout function which removes JWT tokens
      await authService.logout();
      // Clear the current user from state
      setCurrentUser(null);
      // Return success so the component can redirect
      return Promise.resolve();
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if the server logout fails, we should still clear local state
      setCurrentUser(null);
      // Rethrow so components can handle the error if needed
      throw error;
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      setCurrentUser(updatedUser);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    isAuthenticated: !!currentUser,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 