import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '@rneui/themed';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, LogBox, Platform, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { enableScreens } from 'react-native-screens';
import * as Font from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';
import AuthProvider, { useAuth } from './contexts/AuthContext';
import AuthScreen from './auth';

// Enable native screens implementation
enableScreens(true);

// Prevent native splash screen from autohiding
SplashScreen.preventAutoHideAsync();

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: Failed prop type',
  'Non-serializable values were found in the navigation state',
]);

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught an error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-xl font-bold mb-2">Something went wrong</Text>
          <Text className="text-gray-600 mb-4">{this.state.error?.message}</Text>
          <Text className="text-sm text-gray-500">Please restart the app</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts
        await Font.loadAsync(MaterialIcons.font);

        // Perform any other initialization here
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView className="flex-1">
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <AuthGuard />
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const AuthGuard = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: Platform.OS === 'ios',
        animation: Platform.OS === 'ios' ? 'default' : 'none',
        contentStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
};
