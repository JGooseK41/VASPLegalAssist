import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import { clearEncryptionKeyCache } from '../hooks/useEncryption';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.login(email, password);
      
      // Save token and user
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Save survey reminder data if present
      if (response.surveyReminder) {
        sessionStorage.setItem('surveyReminder', JSON.stringify(response.surveyReminder));
      }
      
      setUser(response.user);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      const requiresEmailVerification = err.response?.data?.requiresEmailVerification;
      const requiresApproval = err.response?.data?.requiresApproval;
      
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage,
        requiresEmailVerification,
        requiresApproval
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.register(userData);
      
      // Check if registration requires email verification
      if (response.requiresEmailVerification) {
        // Don't log them in - show success message
        return { 
          success: true, 
          requiresEmailVerification: true,
          requiresApproval: response.requiresApproval,
          message: response.message || 'Registration successful! Please check your email to verify your account.'
        };
      }
      
      // Check if registration requires approval (for backward compatibility)
      if (response.requiresApproval) {
        // Don't log them in - show success message
        return { 
          success: true, 
          requiresApproval: true,
          message: response.message || 'Registration successful! Your account is pending approval.'
        };
      }
      
      // Only save token if provided (admin users)
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
      }
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Call backend logout endpoint to mark session as inactive
        await authAPI.logout();
      }
    } catch (err) {
      console.error('Logout error:', err);
      // Continue with local logout even if backend call fails
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    // Clear encryption key cache on logout
    clearEncryptionKeyCache();
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    // Update user in state and localStorage
    const updatedUser = { ...user, ...updatedUserData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};