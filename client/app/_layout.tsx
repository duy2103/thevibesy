import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '@rneui/themed';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox } from 'react-native';

// Prevent native splash screen from autohiding
SplashScreen.preventAutoHideAsync();

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: Failed prop type',
  'Non-serializable values were found in the navigation state',
]);

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after the app is ready
    SplashScreen.hideAsync();
  }, []);

  return (
    <React.StrictMode>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  gestureEnabled: true,
                  animation: 'none',
                }}
              >
                <Stack.Screen 
                  name="(tabs)" 
                  options={{ 
                    headerShown: false,
                  }} 
                />
    </Stack>
            </View>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </React.StrictMode>
  );
}
