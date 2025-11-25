import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile, debugToken } from '../utils/api';

interface AuthContextType {
  isAuthenticated: boolean;
  authToken: string | null;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType>({
  isAuthenticated: false,
  authToken: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

export const useAuth = () => React.useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthToken();
  }, []);

  const checkAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        try {
          // Decode token first for faster feedback
          await debugToken(token);
          await getProfile(token);
          setAuthToken(token);
        } catch (error) {
          await AsyncStorage.removeItem('auth_token');
          setAuthToken(null);
        }
      }
    } catch (error) {
      console.error('Error checking auth token:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string) => {
    await AsyncStorage.setItem('auth_token', token);
    setAuthToken(token);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    setAuthToken(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!authToken,
        authToken,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
