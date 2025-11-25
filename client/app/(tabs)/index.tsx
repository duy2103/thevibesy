import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { register, login, getLocations, getProfile } from '../utils/api';

const DEMO_LOCATIONS = [
  { id: '1', name: 'Demo Place 1', description: 'A cool demo place' },
  { id: '2', name: 'Demo Place 2', description: 'Another awesome spot' },
];

const HomeScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userLocations, setUserLocations] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        setAuthToken(token);
        setShowAuth(false);
        loadUserData(token);
      }
    } catch (e) {
      console.error('Auth check error:', e);
    }
  };

  const loadUserData = async (token: string) => {
    setLoadingData(true);
    try {
      const [profileData, locationsData] = await Promise.all([
        getProfile(token),
        getLocations(token)
      ]);
      setUserProfile(profileData);
      setUserLocations(locationsData);
    } catch (e: any) {
      console.error('Data loading error:', e);
      // Don't show alert for demo data, just use fallback
    } finally {
      setLoadingData(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      await register(email, password);
      Alert.alert('Success', 'Registered! Now please login.');
      setEmail('');
      setPassword('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await login(email, password);
      await AsyncStorage.setItem('auth_token', response.access_token);
      setAuthToken(response.access_token);
      setShowAuth(false);
      loadUserData(response.access_token);
      Alert.alert('Success', 'Logged in successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setShowAuth(false);
    setUserProfile({
      name: 'Demo User',
      email: 'demo@vibesy.app',
      bio: 'Exploring the world, one place at a time'
    });
    setUserLocations(DEMO_LOCATIONS);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      setAuthToken(null);
      setUserProfile(null);
      setUserLocations([]);
      setShowAuth(true);
      setEmail('');
      setPassword('');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  if (showAuth) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Login or Register</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              style={styles.input}
              secureTextEntry
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={handleRegister} style={[styles.parseBtn, { backgroundColor: '#7c3aed', flex: 1, marginRight: 8 }]} disabled={isLoading}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Register</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogin} style={[styles.parseBtn, { backgroundColor: '#2563eb', flex: 1, marginLeft: 8 }]} disabled={isLoading}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Login</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleSkip} style={[styles.parseBtn, { backgroundColor: '#6b7280', marginTop: 16 }]}> 
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Skip for now (Demo)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // After authentication, show user dashboard
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userProfile?.name || 'User'}</Text>
            {userProfile?.bio && (
              <Text style={styles.userBio}>{userProfile.bio}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userLocations.length}</Text>
            <Text style={styles.statLabel}>Saved Places</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{authToken ? '1' : '0'}</Text>
            <Text style={styles.statLabel}>Lists Created</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Places Visited</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Places</Text>
        {loadingData ? (
          <Text style={styles.loadingText}>Loading your places...</Text>
        ) : userLocations.length === 0 ? (
          <Text style={styles.emptyText}>No places saved yet. Start by parsing some social media links!</Text>
        ) : (
          userLocations.slice(0, 5).map((loc: any) => (
            <View key={loc.id} style={styles.savedCard}>
              <Text style={styles.locationName}>{loc.name}</Text>
              <Text style={styles.locationDescription}>{loc.description}</Text>
              {loc.address && (
                <Text style={styles.locationAddress}>{loc.address}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  parseBtn: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  userBio: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  loadingText: {
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  savedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  locationDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  locationAddress: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
});

export default HomeScreen;